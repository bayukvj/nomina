import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Memuat file .env ke process.env.
 * Astro hanya mengisi import.meta.env, sedangkan kode server
 * (OAuth, session, database) membutuhkan process.env.
 */
function load() {
  const file = path.resolve(process.cwd(), '.env');
  if (!existsSync(file)) return;

  const content = readFileSync(file, 'utf8');

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) process.env[key] = value;
  }
}

load();

export const env = {
  get(key: string, fallback = '') {
    return process.env[key] ?? fallback;
  },
};
