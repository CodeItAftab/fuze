import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://fuze:fuze_password@localhost:5432/fuze";

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ Warning: DATABASE_URL not set in process.env, falling back to localhost:5432");
}

const queryClient = postgres(connectionString, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });
export * from "./schema.js";
