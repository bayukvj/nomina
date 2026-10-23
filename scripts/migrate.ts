import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../src/db/schema';

const databaseUrl =
  process.env.DATABASE_URL ?? 'postgres://postgres@localhost:5432/nomina';

async function main() {
  console.log('→ Menjalankan migrasi database…');
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });
  await migrate(db, { migrationsFolder: './drizzle' });
  await pool.end();
  console.log('✓ Migrasi selesai.');
}

main().catch((err) => {
  console.error('✗ Migrasi gagal:', err);
  process.exit(1);
});
