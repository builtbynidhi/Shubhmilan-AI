import { defineConfig } from "drizzle-kit";

// Migrations use the DIRECT (unpooled) connection string — PgBouncer does not
// support all DDL/migration operations. Runtime queries use the pooled
// DATABASE_URL (see api/_lib/db.ts).
export default defineConfig({
  schema: "./api/_lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
  // pgvector lives in the `vector` extension; create it before migrating.
  extensionsFilters: ["postgis"],
});
