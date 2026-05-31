# Palmistry Knowledge Base

Curated, bilingual (English + Hindi) palmistry knowledge from the classical
Samudrik Shastra / Hast Rekha tradition. This is the retrieval corpus that grounds the
palm-reading feature (`src/lib/palmReading.ts` → two-pass RAG).

## Layout
- `lines.json` — heart, head, life, fate, sun, marriage, health lines (with qualifiers).
- `mounts.json` — Jupiter, Saturn, Apollo, Mercury, Venus, Moon, Mars.
- `signs.json` — star, cross, triangle, square, island, grille.
- `shapes.json` — palm element type (earth/air/fire/water), thumb, finger length.
- `manifest.json` — schema, embedding config, file list.
- `sources/` — drop-in folder for your own texts (see its README).

## Chunk shape
Each entry: `{ id, category, feature_key, qualifier, text_en, text_hi, source }`.
`feature_key` + `qualifier` match the structured observations the vision pass emits
(`PalmObservations`), so retrieval queries map cleanly onto detected palm features.

## Pipeline
1. `scripts/ingest-palmistry.ts` embeds each chunk (`text-embedding-3-small`, 1536-d) and
   upserts into the Supabase `palmistry_knowledge` table (pgvector).
2. The `palm-rag-retrieve` Edge Function embeds a query and returns the closest chunks.
3. The palm-reading composer grounds its answer in those chunks and cites `source`.

> Content here is interpretive guidance for entertainment/cultural use, written warmly and
> positively. Keep it kind, non-fatalistic, and non-medical.
