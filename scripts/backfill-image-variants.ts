/**
 * Backfill varian gambar (WebP + thumbnail) untuk media yang sudah terunggah
 * sebelum fitur varian diperkenalkan.
 * Jalankan: npx tsx scripts/backfill-image-variants.ts
 */
import { readFile, access } from 'node:fs/promises';
import { loadEnv } from './load-env';

loadEnv();

const { db } = await import('../src/db');
const { media } = await import('../src/db/schema');
const { eq } = await import('drizzle-orm');
const { generateImageVariants } = await import('../src/lib/images');

const rows = await db.select().from(media);
let updated = 0;
let skipped = 0;

for (const m of rows) {
  if (!m.mimeType?.startsWith('image/') || m.mimeType === 'image/svg+xml') {
    skipped++;
    continue;
  }
  if (m.sizes && Object.keys(m.sizes).length > 0) {
    skipped++;
    continue;
  }
  if (!m.path) {
    skipped++;
    continue;
  }

  try {
    await access(m.path);
    const buffer = await readFile(m.path);
    const base = m.filename.replace(/\.[^.]+$/, '');
    const result = await generateImageVariants(buffer, base, m.folder, m.mimeType);

    if (Object.keys(result.sizes).length > 0) {
      await db
        .update(media)
        .set({ sizes: result.sizes, width: result.width, height: result.height })
        .where(eq(media.id, m.id));
      updated++;
      console.log(`  + ${m.originalName} (${result.width}x${result.height})`);
    } else {
      skipped++;
    }
  } catch (err) {
    skipped++;
    console.log(`  ! ${m.originalName}: ${(err as Error).message}`);
  }
}

console.log(`\nSelesai: ${updated} media diproses, ${skipped} dilewati.`);
