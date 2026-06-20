// src/db/client.ts
//
// Single Postgres connection pool shared across the app (and, in Phase 2,
// shared with Better Auth). We deliberately use `pg` + drizzle-orm/node-postgres
// — NOT @neondatabase/serverless — so there is exactly one pool and one source
// of truth for connections.

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  __seaTripPool?: Pool;
};

// Reuse the pool across hot reloads / serverless invocations in the same runtime.
export const pool =
  globalForDb.__seaTripPool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__seaTripPool = pool;
}

export const db = drizzle(pool, { schema });
