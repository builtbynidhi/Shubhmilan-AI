/**
 * Shared KB ingestion core (dev-time, Node — NOT the browser bundle).
 *
 * Reads a curated knowledge folder (manifest.json + chunk files, plus any
 * user-provided files in <dir>/sources/), embeds each chunk with Google Gemini
 * (gemini-embedding-001 @1536-d), and upserts into the matching Neon pgvector
 * table via Drizzle. Safe to re-run — upserts by `id`.
 *
 * Used by scripts/ingest-palmistry.ts and scripts/ingest-astrology.ts.
 *
 * Required env (server-side secrets — NEVER VITE_-prefixed):
 *   GEMINI_API_KEY   — embedding key (free, from aistudio.google.com)
 *   DATABASE_URL     — Neon connection string (pooled or direct both work)
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { palmistryKnowledge, astrologyKnowledge } from "../../api/_lib/schema";

// Load .env from the project root so `npm run ingest:*` works without
// manually exporting OPENAI_API_KEY / DATABASE_URL (Node 20.12+).
try {
  process.loadEnvFile();
} catch {
  // No .env file — fall back to whatever the shell exported.
}

const TABLES = {
  palmistry: { table: palmistryKnowledge, name: "palmistry_knowledge" },
  astrology: { table: astrologyKnowledge, name: "astrology_knowledge" },
} as const;
export type IngestDomain = keyof typeof TABLES;

/** Reference the conflicting row's incoming value in an upsert SET clause. */
function sqlExcluded(column: string) {
  return sql.raw(`excluded.${column}`);
}

interface KbChunk {
  id: string;
  category: string;
  feature_key: string;
  qualifier: string | null;
  text_en: string;
  text_hi: string;
  source: string;
}

const EMBEDDING_MODEL = process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 1536;
const BATCH_SIZE = 64;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`✗ Missing required env var ${name}. See the header of scripts/_lib/ingest.ts.`);
    process.exit(1);
  }
  return v;
}

/** Load the curated category files listed in manifest.json. */
function loadCuratedChunks(kbDir: string): KbChunk[] {
  const manifest = JSON.parse(readFileSync(join(kbDir, "manifest.json"), "utf8")) as {
    files: string[];
  };
  const chunks: KbChunk[] = [];
  for (const file of manifest.files) {
    const parsed = JSON.parse(readFileSync(join(kbDir, file), "utf8")) as KbChunk[];
    chunks.push(...parsed);
  }
  return chunks;
}

/** Load optional user-provided files from sources/ (.json as-is; .md/.txt as paragraphs). */
function loadSourceChunks(kbDir: string): KbChunk[] {
  const sourcesDir = join(kbDir, "sources");
  if (!existsSync(sourcesDir)) return [];
  const chunks: KbChunk[] = [];
  for (const file of readdirSync(sourcesDir)) {
    if (/^readme/i.test(file) || file.startsWith(".")) continue;
    const ext = extname(file).toLowerCase();
    const full = join(sourcesDir, file);
    const stem = basename(file, ext);
    if (ext === ".json") {
      chunks.push(...(JSON.parse(readFileSync(full, "utf8")) as KbChunk[]));
    } else if (ext === ".md" || ext === ".txt") {
      const paras = readFileSync(full, "utf8")
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0 && !p.startsWith("#"));
      paras.forEach((text, i) => {
        chunks.push({
          id: `source.${stem}.${i}`,
          category: "sources",
          feature_key: stem,
          qualifier: null,
          text_en: text,
          text_hi: "",
          source: `User source: ${file}`,
        });
      });
    }
  }
  return chunks;
}

/** The string we embed for each chunk — feature + qualifier + English meaning. */
function embeddingTextFor(c: KbChunk): string {
  return [c.feature_key, c.qualifier, c.text_en].filter(Boolean).join(" — ");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function embedBatch(apiKey: string, inputs: string[]): Promise<number[][]> {
  // Gemini free tier caps embed_content at ~100 requests/minute. On a 429 we
  // honour the server's retryDelay and retry, so large KBs ingest reliably.
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: inputs.map((text) => ({
            model: `models/${EMBEDDING_MODEL}`,
            content: { parts: [{ text }] },
            outputDimensionality: EMBEDDING_DIMENSIONS,
          })),
        }),
      }
    );

    if (res.ok) {
      const json = (await res.json()) as { embeddings: { values: number[] }[] };
      return json.embeddings.map((e) => e.values);
    }

    const err = await res.text();
    if (res.status === 429 && attempt < 6) {
      const m = err.match(/"retryDelay":\s*"(\d+)s"/);
      const waitS = (m ? parseInt(m[1], 10) : 30) + 2;
      console.log(`  rate limit hit — waiting ${waitS}s then retrying (attempt ${attempt + 1})…`);
      await sleep(waitS * 1000);
      continue;
    }
    throw new Error(`Gemini embeddings error ${res.status}: ${err}`);
  }
}

export async function runIngest(domain: IngestDomain, kbDir: string): Promise<void> {
  const geminiKey = requireEnv("GEMINI_API_KEY");
  const databaseUrl = requireEnv("DATABASE_URL");

  // Both KB tables share the same column shape; narrow to one for Drizzle's types.
  const table = TABLES[domain].table as typeof palmistryKnowledge;
  const tableName = TABLES[domain].name;

  const chunks = [...loadCuratedChunks(kbDir), ...loadSourceChunks(kbDir)];
  const ids = new Set<string>();
  for (const c of chunks) {
    if (ids.has(c.id)) throw new Error(`Duplicate chunk id: ${c.id}`);
    ids.add(c.id);
  }
  console.log(`Loaded ${chunks.length} ${domain} chunks. Embedding with ${EMBEDDING_MODEL}…`);

  const db = drizzle(neon(databaseUrl));

  let done = 0;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const embeddings = await embedBatch(geminiKey, batch.map(embeddingTextFor));
    const rows = batch.map((c, j) => ({
      id: c.id,
      category: c.category,
      featureKey: c.feature_key,
      qualifier: c.qualifier,
      textEn: c.text_en,
      textHi: c.text_hi,
      source: c.source,
      embedding: embeddings[j],
      updatedAt: new Date(),
    }));
    await db
      .insert(table)
      .values(rows)
      .onConflictDoUpdate({
        target: table.id,
        set: {
          category: sqlExcluded("category"),
          featureKey: sqlExcluded("feature_key"),
          qualifier: sqlExcluded("qualifier"),
          textEn: sqlExcluded("text_en"),
          textHi: sqlExcluded("text_hi"),
          source: sqlExcluded("source"),
          embedding: sqlExcluded("embedding"),
          updatedAt: sqlExcluded("updated_at"),
        },
      });
    done += batch.length;
    console.log(`  upserted ${done}/${chunks.length}`);
  }

  console.log(`✓ Done. ${chunks.length} chunks embedded + upserted into ${tableName}.`);
}
