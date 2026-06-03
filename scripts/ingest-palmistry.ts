/**
 * Palmistry KB ingestion — embeds knowledge/palmistry/ into Neon pgvector.
 * Shared core lives in scripts/_lib/ingest.ts.
 *
 * Run:  npm run ingest:palmistry
 */

import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runIngest } from "./_lib/ingest";

const HERE = dirname(fileURLToPath(import.meta.url));

runIngest("palmistry", join(HERE, "..", "knowledge", "palmistry")).catch((err) => {
  console.error("✗ Ingestion failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
