import { db } from '../db';
import { settings as settingsTable } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { settingsDefaults, type Settings } from './settings-def';

let cache: { data: Settings; at: number } | null = null;
const TTL = 30_000;

export async function getSettings(): Promise<Settings> {
  if (cache && Date.now() - cache.at < TTL) return cache.data;

  const rows = await db.select().from(settingsTable);
  const data = { ...settingsDefaults } as Settings;

  for (const row of rows) {
    if (row.value === null || row.value === undefined) continue;
    data[row.key] = typeof row.value === 'string' ? row.value : JSON.stringify(row.value);
  }

  cache = { data, at: Date.now() };
  return data;
}

export function invalidateSettingsCache() {
  cache = null;
}

export async function saveSettings(values: Record<string, string>, group = 'umum') {
  const entries = Object.entries(values);
  if (entries.length === 0) return;

  for (const [key, value] of entries) {
    const existing = await db
      .select({ id: settingsTable.key })
      .from(settingsTable)
      .where(eq(settingsTable.key, key))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(settingsTable)
        .set({ value: value, group, updatedAt: new Date() })
        .where(eq(settingsTable.key, key));
    } else {
      await db.insert(settingsTable).values({ key, value, group });
    }
  }
  invalidateSettingsCache();
}

/** Hapus nilai tersimpan untuk sekumpulan key -> kembali ke default */
export async function resetSettings(keys: string[]) {
  if (keys.length === 0) return;
  await db.delete(settingsTable).where(inArray(settingsTable.key, keys));
  invalidateSettingsCache();
}

/** Daftar key yang nilainya sudah diubah dari default */
export async function getCustomizedKeys(): Promise<string[]> {
  const rows = await db.select({ key: settingsTable.key }).from(settingsTable);
  return rows.map((r) => r.key);
}
export function isTrue(value: string | undefined) {
  return value === 'true' || value === '1' || value === 'on';
}

export function toBool(value: string | undefined, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return isTrue(value);
}
