/**
 * POST /api/palm-rag-retrieve — grounding retrieval for palm reading.
 *
 * Embeds the incoming feature queries (OpenAI text-embedding-3-small) and runs a
 * pgvector cosine search over palmistry_knowledge on Neon, returning the closest
 * chunks. Public (no auth) but input-capped. The embedding key lives server-side.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { cosineDistance, desc, sql } from "drizzle-orm";
import { db } from "./_lib/db";
import { palmistryKnowledge } from "./_lib/schema";
import { handle, assertMethod, HttpError } from "./_lib/http";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;
const DEFAULT_MATCH_COUNT = 4;

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

  const body = (req.body ?? {}) as { queries?: string[]; matchCount?: number };
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
      const similarity = sql<number>`1 - (${cosineDistance(palmistryKnowledge.embedding, embedding)})`;
      return db
        .select({
          id: palmistryKnowledge.id,
          category: palmistryKnowledge.category,
          feature_key: palmistryKnowledge.featureKey,
          qualifier: palmistryKnowledge.qualifier,
          text_en: palmistryKnowledge.textEn,
          text_hi: palmistryKnowledge.textHi,
          source: palmistryKnowledge.source,
          similarity,
        })
        .from(palmistryKnowledge)
        .where(sql`${palmistryKnowledge.embedding} is not null`)
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
