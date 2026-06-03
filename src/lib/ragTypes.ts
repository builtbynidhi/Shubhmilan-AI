/**
 * Shared types for the RAG grounding layer (palmistry + astrology).
 * Mirrors the row shape returned by /api/rag-retrieve.
 */

export interface RetrievedChunk {
  id: string;
  category: string;
  feature_key: string;
  qualifier: string | null;
  text_en: string;
  text_hi: string;
  source: string;
  similarity: number;
}

/** Format retrieved chunks as a citable knowledge block for an AI prompt. */
export function formatKnowledgeForPrompt(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "";
  return chunks
    .map((c, i) => `[K${i + 1}] (${c.feature_key}${c.qualifier ? `/${c.qualifier}` : ""}) ${c.text_en} — Source: ${c.source}`)
    .join("\n");
}
