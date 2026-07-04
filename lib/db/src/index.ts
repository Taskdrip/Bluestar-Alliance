import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Trim to guard against accidental leading/trailing whitespace when the
// value is pasted into a secrets manager (pg's parser does not tolerate it,
// unlike the WHATWG URL parser used elsewhere).
const connectionString = process.env.DATABASE_URL.trim();

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

export * from "./schema";
