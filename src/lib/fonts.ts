/**
 * Pengaturan tipografi situs:
 * - fontFamily  : font untuk teks
 * - fontHeading : font untuk judul
 * - fontSize    : ukuran font dasar (menggerakkan seluruh skala rem)
 */

export type FontDef = { name: string; weights: string };

import { readFileSync } from 'node:fs';

const families: Record<string, FontDef> = {
  jakarta: { name: 'Plus Jakarta Sans', weights: '400;500;600;700;800' },
  inter: { name: 'Inter', weights: '400;500;600;700;800' },
  poppins: { name: 'Poppins', weights: '400;500;600;700;800' },
  montserrat: { name: 'Montserrat', weights: '400;500;600;700;800' },
  nunito: { name: 'Nunito Sans', weights: '400;500;600;700;800' },
  rubik: { name: 'Rubik', weights: '400;500;600;700;800' },
  sora: { name: 'Sora', weights: '600;700;800' },
  playfair: { name: 'Playfair Display', weights: '600;700;800' },
  system: { name: 'system-ui', weights: '' },
};

export const fontFamilyOptions = [
  { value: 'jakarta', label: 'Plus Jakarta Sans (bawaan)' },
  { value: 'inter', label: 'Inter' },
  { value: 'poppins', label: 'Poppins' },
  { value: 'montserrat', label: 'Montserrat' },
  { value: 'nunito', label: 'Nunito Sans' },
  { value: 'rubik', label: 'Rubik' },
  { value: 'system', label: 'Sistem (tanpa unduhan font)' },
];

export const fontHeadingOptions = [
  { value: 'sora', label: 'Sora (bawaan)' },
  { value: 'playfair', label: 'Playfair Display' },
  { value: 'jakarta', label: 'Plus Jakarta Sans' },
  { value: 'poppins', label: 'Poppins' },
  { value: 'montserrat', label: 'Montserrat' },
  { value: 'system', label: 'Sistem (tanpa unduhan font)' },
];

export const fontSizeOptions = [
  { value: 'kecil', label: 'Kecil — 15px' },
  { value: 'sedang', label: 'Sedang — 16px (bawaan)' },
  { value: 'besar', label: 'Besar — 18px' },
  { value: 'ekstra', label: 'Ekstra besar — 20px' },
];

const sizeMap: Record<string, string> = {
  kecil: '15px',
  sedang: '16px',
  besar: '18px',
  ekstra: '20px',
};

function familyOf(key: string, fallback: string): FontDef {
  return families[key] ?? families[fallback];
}

/** CSS yang menimpa --font-sans, --font-display, dan ukuran font dasar */
export function buildFontCss(family: string, heading: string, size: string): string {
  const fam = familyOf(family, 'jakarta');
  const head = familyOf(heading, 'sora');
  const px = sizeMap[size] ?? '16px';

  return (
    `:root{` +
    `--font-sans:'${fam.name}',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;` +
    `--font-display:'${head.name}','${fam.name}',ui-sans-serif,system-ui,sans-serif;` +
    `--font-size-base:${px};` +
    `}html{font-size:var(--font-size-base);}`
  );
}

/** URL Google Fonts untuk font yang dipilih (null = tidak perlu unduh) */
export function buildFontLink(family: string, heading: string): string | null {
  const fam = familyOf(family, 'jakarta');
  const head = familyOf(heading, 'sora');

  const parts: string[] = [];
  if (fam.weights) parts.push(`${fam.name.replace(/ /g, '+')}:wght@${fam.weights}`);
  if (head.weights && head.name !== fam.name) {
    parts.push(`${head.name.replace(/ /g, '+')}:wght@${head.weights}`);
  }
  if (parts.length === 0) return null;

  return `https://fonts.googleapis.com/css2?family=${parts.join('&family=')}&display=swap`;
}

/** Key internal font (untuk mencari berkas lokal) */
export function fontKey(family: string, heading: string): { body: string; heading: string } {
  const map: Record<string, string> = {
    jakarta: 'jakarta',
    inter: 'inter',
    poppins: 'poppins',
    montserrat: 'montserrat',
    nunito: 'nunito',
    rubik: 'rubik',
    sora: 'sora',
    playfair: 'playfair',
    system: 'system',
  };
  return {
    body: map[family] ?? 'jakarta',
    heading: map[heading] ?? 'sora',
  };
}

/**
 * Ambil path berkas font lokal (latin, weight 400) untuk preload.
 * Memakai manifest yang dihasilkan scripts/fetch-fonts.ts.
 */
export function getPreloadFont(family: string): string | null {
  const key = fontKey(family, 'sora').body;
  if (key === 'system') return null;

  try {
    const manifestPath = new URL('../../public/fonts/manifest.json', import.meta.url);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<
      string,
      Record<string, Record<string, string>>
    >;
    return manifest?.[key]?.latin?.['400'] ?? null;
  } catch {
    return null;
  }
}
