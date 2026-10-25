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

export const queryClient = postgres(connectionString, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });

// Ensure persistent migration_jobs table exists
queryClient`
  CREATE TABLE IF NOT EXISTS migration_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_identity_id UUID NOT NULL,
    provider TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    total_chunks INTEGER NOT NULL DEFAULT 0,
    completed_chunks INTEGER NOT NULL DEFAULT 0,
    total_bytes BIGINT NOT NULL DEFAULT 0,
    transferred_bytes BIGINT NOT NULL DEFAULT 0,
    percent INTEGER NOT NULL DEFAULT 0,
    current_file_name TEXT,
    status_text TEXT,
    logs TEXT,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
  );
  CREATE INDEX IF NOT EXISTS migration_user_idx ON migration_jobs(user_id);
  CREATE INDEX IF NOT EXISTS migration_status_idx ON migration_jobs(status);
`.catch((err) => console.error("Failed to ensure migration_jobs table:", err));

export * from "./schema.js";
