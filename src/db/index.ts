import '../lib/env';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const databaseUrl =
  process.env.DATABASE_URL ?? 'postgres://postgres@localhost:5432/nomina';

const globalForDb = globalThis as unknown as { pool?: Pool; db?: ReturnType<typeof drizzle<typeof schema>> };

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool;

export const db = globalForDb.db ?? drizzle(pool, { schema });
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

export { schema };
export * from './schema';
