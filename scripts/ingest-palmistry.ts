/**
 * Palmistry KB ingestion (dev-time, Node — NOT the browser bundle).
 *
 * Reads the curated knowledge under knowledge/palmistry/ (+ any user files in
 * knowledge/palmistry/sources/), embeds each chunk with OpenAI
 * text-embedding-3-small (1536-d), and upserts into the Neon `palmistry_knowledge`
 * table (pgvector) via Drizzle. Safe to re-run — upserts by `id`.
 *
 * Required env (server-side secrets — NEVER VITE_-prefixed):
 *   OPENAI_API_KEY   — embedding key
 *   DATABASE_URL     — Neon connection string (pooled or direct both work)
 *
 * Run:  npm run ingest:palmistry
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { palmistryKnowledge } from "../api/_lib/schema";

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

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;
const BATCH_SIZE = 64;

const HERE = dirname(fileURLToPath(import.meta.url));
const KB_DIR = join(HERE, "..", "knowledge", "palmistry");
const SOURCES_DIR = join(KB_DIR, "sources");

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`✗ Missing required env var ${name}. See the header of scripts/ingest-palmistry.ts.`);
    process.exit(1);
  }
  return v;
}

/** Load the curated category files listed in manifest.json. */
function loadCuratedChunks(): KbChunk[] {
  const manifest = JSON.parse(readFileSync(join(KB_DIR, "manifest.json"), "utf8")) as {
    files: string[];
  };
  const chunks: KbChunk[] = [];
  for (const file of manifest.files) {
    const parsed = JSON.parse(readFileSync(join(KB_DIR, file), "utf8")) as KbChunk[];
    chunks.push(...parsed);
  }
  return chunks;
}

/** Load optional user-provided files from sources/ (.json as-is; .md/.txt as paragraphs). */
function loadSourceChunks(): KbChunk[] {
  if (!existsSync(SOURCES_DIR)) return [];
  const chunks: KbChunk[] = [];
  for (const file of readdirSync(SOURCES_DIR)) {
    if (/^readme/i.test(file) || file.startsWith(".")) continue;
    const ext = extname(file).toLowerCase();
    const full = join(SOURCES_DIR, file);
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

async function embedBatch(apiKey: string, inputs: string[]): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: inputs, dimensions: EMBEDDING_DIMENSIONS }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embeddings error ${res.status}: ${err}`);
  }
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data.map((d) => d.embedding);
}

async function main(): Promise<void> {
  const openaiKey = requireEnv("OPENAI_API_KEY");
  const databaseUrl = requireEnv("DATABASE_URL");

  const chunks = [...loadCuratedChunks(), ...loadSourceChunks()];
  const ids = new Set<string>();
  for (const c of chunks) {
    if (ids.has(c.id)) throw new Error(`Duplicate chunk id: ${c.id}`);
    ids.add(c.id);
  }
  console.log(`Loaded ${chunks.length} chunks. Embedding with ${EMBEDDING_MODEL}…`);

  const db = drizzle(neon(databaseUrl));

  let done = 0;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const embeddings = await embedBatch(openaiKey, batch.map(embeddingTextFor));
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
      .insert(palmistryKnowledge)
      .values(rows)
      .onConflictDoUpdate({
        target: palmistryKnowledge.id,
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

  console.log(`✓ Done. ${chunks.length} chunks embedded + upserted into palmistry_knowledge.`);
}

main().catch((err) => {
  console.error("✗ Ingestion failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
