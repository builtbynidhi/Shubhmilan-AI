/**
 * Astro RAG — retrieval layer grounding Kundli & Guna Milan narratives in the
 * classical astrology knowledge base (knowledge/astrology/ → Neon pgvector).
 *
 * Builds natural-language queries from the deterministic Ashtakoot result (or
 * Kundli dosha findings), fetches matching chunks from /api/rag-retrieve
 * (domain: "astrology" — embeds server-side), and formats them as a citable
 * knowledge block for the Groq narrative prompt.
 *
 * Designed to fail soft: any error returns [] so the features degrade to an
 * ungrounded narrative rather than breaking.
 */

import { apiFetch } from "@/lib/api";
import type { AshtakootResult } from "@/lib/jyotish/ashtakoot";
import type { RetrievedChunk } from "@/lib/ragTypes";

export type { RetrievedChunk };
export { formatKnowledgeForPrompt } from "@/lib/ragTypes";

/** Build retrieval queries from a computed Ashtakoot result. */
export function buildAshtakootQueries(result: AshtakootResult): string[] {
  const queries: string[] = [];

  // Per-koot meaning for the weakest and strongest categories.
  for (const c of result.categories) {
    const ratio = c.maximum > 0 ? c.obtained / c.maximum : 1;
    if (ratio <= 0.5) queries.push(`${c.name} koot low score meaning dosha`);
  }

  if (result.nadiDosha) queries.push("Nadi dosha same nadi effects remedies");
  if (result.bhakootDosha) queries.push("Bhakoot dosha rashi axis effects remedies");
  if (result.ganaDosha) queries.push("Gana dosha temperament mismatch");

  queries.push(`${result.boy.nakshatra} nakshatra nature marriage`);
  queries.push(`${result.girl.nakshatra} nakshatra nature marriage`);
  queries.push(`guna milan total score ${result.total} out of 36 meaning`);
  if (result.total >= 18) queries.push("vivah muhurat auspicious nakshatra tithi");
  if (result.total < 25) queries.push("guna milan remedies low score upay");

  return [...new Set(queries.map((q) => q.trim()).filter(Boolean))].slice(0, 20);
}

/** Build retrieval queries from Kundli dosha findings (kundliApi.ts). */
export function buildKundliQueries(ctx: {
  nakshatra?: string;
  doshas?: { name: string; present: boolean }[];
  manglik?: boolean;
}): string[] {
  const queries: string[] = [];
  if (ctx.nakshatra) queries.push(`${ctx.nakshatra} nakshatra nature deity planet`);
  for (const d of ctx.doshas ?? []) {
    if (d.present) queries.push(`${d.name} effects remedies cancellation`);
  }
  if (ctx.manglik) queries.push("Mangal dosha Mars marriage cancellation remedies");
  return [...new Set(queries.map((q) => q.trim()).filter(Boolean))].slice(0, 12);
}

/**
 * Retrieve grounding knowledge for the given queries. Returns [] on any
 * failure (endpoint not deployed, network error, etc.) so callers degrade.
 */
export async function retrieveAstroKnowledge(queries: string[]): Promise<RetrievedChunk[]> {
  if (queries.length === 0) return [];
  try {
    const data = await apiFetch<{ chunks: RetrievedChunk[] }>("/api/rag-retrieve", {
      method: "POST",
      body: { domain: "astrology", queries, matchCount: 4 },
      public: true,
    });
    return data?.chunks ?? [];
  } catch (err) {
    console.warn("[astroRag] retrieval unavailable — proceeding ungrounded:", err);
    return [];
  }
}
