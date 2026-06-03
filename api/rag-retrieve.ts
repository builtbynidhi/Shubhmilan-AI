/**
 * POST /api/rag-retrieve — generalized grounding retrieval (palmistry + astrology).
 *
 * Embeds the incoming queries (OpenAI text-embedding-3-small) and runs a
 * pgvector cosine search over the requested knowledge domain on Neon, returning
 * the closest chunks. Public (no auth) but input-capped. The embedding key
 * lives server-side. Supersedes /api/palm-rag-retrieve (kept for back-compat).
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { cosineDistance, desc, sql } from "drizzle-orm";
import { db } from "./_lib/db";
import { palmistryKnowledge, astrologyKnowledge } from "./_lib/schema";
import { handle, assertMethod, HttpError } from "./_lib/http";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;
const DEFAULT_MATCH_COUNT = 4;

const DOMAIN_TABLES = {
  palmistry: palmistryKnowledge,
  astrology: astrologyKnowledge,
} as const;
type Domain = keyof typeof DOMAIN_TABLES;

interface Chunk {
  id: string;
  category: string;
  feature_key: string;
  qualifier: string | null;
  text_en: string;
  text_hi: string;
  source: string;
  similarity: number;
}

async function embed(apiKey: string, inputs: string[]): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: inputs, dimensions: EMBEDDING_DIMENSIONS }),
  });
  if (!res.ok) throw new Error(`OpenAI embeddings error ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data.map((d) => d.embedding);
}

export default handle(async (req: VercelRequest, res: VercelResponse) => {
  assertMethod(req, "POST");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new HttpError(500, "OPENAI_API_KEY not configured");

  const body = (req.body ?? {}) as { domain?: string; queries?: string[]; matchCount?: number };

  const domain = body.domain as Domain;
  if (!domain || !(domain in DOMAIN_TABLES)) {
    throw new HttpError(400, "Invalid domain — expected 'palmistry' or 'astrology'");
  }
  const table = DOMAIN_TABLES[domain];

  const queries = (body.queries ?? [])
    .map((q) => (typeof q === "string" ? q.trim() : ""))
    .filter(Boolean)
    .slice(0, 24);
  if (queries.length === 0) {
    res.status(200).json({ chunks: [] });
    return;
  }
  const matchCount = Math.min(Math.max(body.matchCount ?? DEFAULT_MATCH_COUNT, 1), 8);

  const embeddings = await embed(apiKey, queries);

  const best = new Map<string, Chunk>();
  const resultsPerQuery = await Promise.all(
    embeddings.map((embedding) => {
      const similarity = sql<number>`1 - (${cosineDistance(table.embedding, embedding)})`;
      return db
        .select({
          id: table.id,
          category: table.category,
          feature_key: table.featureKey,
          qualifier: table.qualifier,
          text_en: table.textEn,
          text_hi: table.textHi,
          source: table.source,
          similarity,
        })
        .from(table)
        .where(sql`${table.embedding} is not null`)
        .orderBy(desc(similarity))
        .limit(matchCount);
    })
  );
  for (const rows of resultsPerQuery) {
    for (const row of rows as Chunk[]) {
      const existing = best.get(row.id);
      if (!existing || row.similarity > existing.similarity) best.set(row.id, row);
    }
  }

  const chunks = [...best.values()].sort((a, b) => b.similarity - a.similarity);
  res.status(200).json({ chunks });
});
