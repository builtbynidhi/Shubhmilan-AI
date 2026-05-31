/**
 * Neon database client (Drizzle + neon-http) for Vercel serverless functions.
 * Uses the POOLED connection string at runtime. Migrations use the unpooled
 * string via drizzle.config.ts.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

export const db = drizzle(neon(connectionString), { schema });
export { schema };
