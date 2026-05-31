/**
 * Palm RAG — retrieval layer for the palm-reading feature.
 *
 * Turns the structured observations from the vision pass into retrieval queries
 * and fetches grounding knowledge from the `palm-rag-retrieve` Supabase Edge
 * Function (which embeds server-side and queries the pgvector KB). The OpenAI
 * embedding key lives in the Edge Function, never in this bundle.
 *
 * Designed to fail soft: any error returns [] so palm reading degrades to an
 * ungrounded reading rather than breaking.
 */

import { apiFetch } from "@/lib/api";
import type { PalmObservations } from "@/lib/palmReading";

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

const MOUNT_LABELS: Record<string, string> = {
  mount_jupiter: "mount of Jupiter",
  mount_saturn: "mount of Saturn",
  mount_apollo: "mount of Apollo (Sun)",
  mount_mercury: "mount of Mercury",
  mount_venus: "mount of Venus",
  mount_moon: "mount of the Moon",
  mount_mars: "mount of Mars",
};

function humanizeLine(key: string): string {
  return key.replace(/_/g, " ");
}

/** Build natural-language retrieval queries from detected palm features. */
export function buildPalmQueries(obs: PalmObservations): string[] {
  const queries: string[] = [];

  for (const line of obs.lines ?? []) {
    if (line.present === false) {
      queries.push(`${humanizeLine(line.feature_key)} absent`);
      continue;
    }
    const detail = line.qualifier?.trim() || line.quality;
    queries.push(`${humanizeLine(line.feature_key)} ${detail}`.trim());
  }

  for (const mount of obs.mounts ?? []) {
    if (mount.prominence === "normal") continue;
    const label = MOUNT_LABELS[mount.feature_key] ?? humanizeLine(mount.feature_key);
    queries.push(`${label} ${mount.prominence}`);
  }

  for (const sign of obs.signs ?? []) {
    queries.push([sign.feature_key, sign.location].filter(Boolean).join(" "));
  }

  if (obs.palmShape) queries.push(`palm shape ${obs.palmShape} hand`);
  if (obs.fingerLength) queries.push(`${obs.fingerLength} fingers`);
  if (obs.thumb) queries.push(`${obs.thumb} thumb`);

  // De-dupe and cap.
  return [...new Set(queries.map((q) => q.trim()).filter(Boolean))].slice(0, 20);
}

/**
 * Retrieve grounding knowledge for the given queries. Returns [] on any failure
 * (Edge Function not deployed, network error, etc.) so callers can degrade.
 */
export async function retrievePalmKnowledge(queries: string[]): Promise<RetrievedChunk[]> {
  if (queries.length === 0) return [];
  try {
    const data = await apiFetch<{ chunks: RetrievedChunk[] }>("/api/palm-rag-retrieve", {
      method: "POST",
      body: { queries, matchCount: 4 },
      public: true,
    });
    return data?.chunks ?? [];
  } catch (err) {
    console.warn("[palmRag] retrieval unavailable — proceeding ungrounded:", err);
    return [];
  }
}

/** Format retrieved chunks as a knowledge block for the composition prompt. */
export function formatKnowledgeForPrompt(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "";
  return chunks
    .map((c, i) => `[K${i + 1}] (${c.feature_key}${c.qualifier ? `/${c.qualifier}` : ""}) ${c.text_en} — Source: ${c.source}`)
    .join("\n");
}
