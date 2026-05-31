# User-provided palmistry sources

Drop your own palmistry source texts here to expand the knowledge base.

## Accepted formats
- **`.json`** — an array of chunks matching the `chunkSchema` in `../manifest.json`
  (`id`, `category`, `feature_key`, `qualifier`, `text_en`, `text_hi`, `source`). Ingested as-is.
- **`.md` / `.txt`** — free text. The ingestion script splits it into paragraph chunks and
  fills `category="sources"`, `feature_key`/`qualifier` from the filename, and `source` from
  the file name. Provide `text_hi` by supplying a `.json` instead if you need bilingual control.

## How it gets in
Run `npm run ingest:palmistry` (see `scripts/ingest-palmistry.ts`). The curated files in the
parent folder are always ingested; anything here is added on top. Re-running upserts by `id`,
so it is safe to run repeatedly.

> Keep `id`s stable and unique — they are the upsert key.
