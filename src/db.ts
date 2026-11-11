import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://demo:demo@localhost:5432/spatial_demo";

export const pool = new Pool({ connectionString });

export async function withClient<T>(fn: (q: Pool) => Promise<T>): Promise<T> {
  try {
    return await fn(pool);
  } finally {
    // Pool is process-lived; callers that are one-shot scripts close it explicitly.
  }
}
