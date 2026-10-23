/**
 * Unduh font dari Google Fonts ke public/fonts + buat CSS @font-face lokal.
 * Dijalankan sekali: npx tsx scripts/fetch-fonts.ts
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve(process.cwd(), 'public', 'fonts');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

type Family = { key: string; name: string; weights: string };

const FAMILIES: Family[] = [
  { key: 'jakarta', name: 'Plus Jakarta Sans', weights: '400;500;600;700;800' },
  { key: 'inter', name: 'Inter', weights: '400;500;600;700;800' },
  { key: 'poppins', name: 'Poppins', weights: '400;500;600;700;800' },
  { key: 'montserrat', name: 'Montserrat', weights: '400;500;600;700;800' },
  { key: 'nunito', name: 'Nunito Sans', weights: '400;500;600;700;800' },
  { key: 'rubik', name: 'Rubik', weights: '400;500;600;700;800' },
  { key: 'sora', name: 'Sora', weights: '600;700;800' },
  { key: 'playfair', name: 'Playfair Display', weights: '600;700;800' },
];

mkdirSync(OUT_DIR, { recursive: true });

const faces: string[] = [];
const manifest: Record<string, Record<string, Record<string, string>>> = {};
let downloaded = 0;
let skipped = 0;

for (const fam of FAMILIES) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    fam.name,
  )}:wght@${fam.weights}&display=swap`;

  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) {
    console.log(`  ! gagal ambil CSS ${fam.name}`);
    continue;
  }
  const css = await res.text();

  const blocks = css.split('@font-face').slice(1);
  let index = 0;

  for (const block of blocks) {
    const src = block.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);
    if (!src) continue;

    const weight = block.match(/font-weight:\s*([^;]+);/)?.[1].trim() ?? '400';
    const range = block.match(/unicode-range:\s*([^;]+);/)?.[1].trim();
    const style = block.match(/font-style:\s*([^;]+);/)?.[1].trim() ?? 'normal';

    /* hanya subset yang dipakai situs berbahasa Indonesia */
    if (range && !/U\+0000-00FF|U\+0100-02(AF|BA)/.test(range)) {
      continue;
    }

    const filename = `${fam.key}-${String(index++).padStart(2, '0')}.woff2`;
    const filePath = path.join(OUT_DIR, filename);

    if (!existsSync(filePath)) {
      const fontRes = await fetch(src[1], { headers: { 'User-Agent': UA } });
      if (!fontRes.ok) {
        skipped++;
        continue;
      }
      writeFileSync(filePath, Buffer.from(await fontRes.arrayBuffer()));
      downloaded++;
    }

    faces.push(
      [
        '@font-face {',
        `  font-family: '${fam.name}';`,
        `  font-style: ${style};`,
        `  font-weight: ${weight};`,
        '  font-display: swap;',
        `  src: url('/fonts/${filename}') format('woff2');`,
        ...(range ? [`  unicode-range: ${range};`] : []),
        '}',
      ].join('\n'),
    );

    /*Subset "latin" (U+0000-00FF) = yang paling sering dipakai */
    const subset = range && /U\+0000-00FF/.test(range) ? 'latin' : 'ext';
    manifest[fam.key] ??= {};
    manifest[fam.key][subset] ??= {};
    manifest[fam.key][subset][weight] = `/fonts/${filename}`;
  }
  console.log(`  ✓ ${fam.name}`);
}

const header = `/* Font lokal (self-hosted) - hasil unduhan dari Google Fonts.
   Di-generate oleh scripts/fetch-fonts.ts. Jangan diedit manual. */\n\n`;

writeFileSync(path.join(OUT_DIR, 'fonts.css'), header + faces.join('\n\n') + '\n');
writeFileSync(
  path.join(OUT_DIR, 'manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);

console.log(`\nSelesai: ${downloaded} berkas diunduh, ${skipped} gagal, ${faces.length} @font-face.`);
