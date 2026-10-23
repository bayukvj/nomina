/**
 * Tema warna aksen situs.
 *
 * Warna "Warna Tema" (themeColor) di Admin → Pengaturan → Tampilan
 * menjadi warna utama (aksen) seluruh situs: tombol, tautan, badge,
 * sorotan, dan gradien.
 *
 * Dari satu warna hex, skala 50–900 dibangkitkan otomatis untuk
 * mode terang dan mode gelap.
 */

export const DEFAULT_THEME_COLOR = '#facc15';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return [250, 204, 21];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex([r, g, b]: [number, number, number]) {
  const to = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

function mix(color: string, target: [number, number, number], amount: number) {
  const c = hexToRgb(color);
  const mixed: [number, number, number] = [
    c[0] + (target[0] - c[0]) * amount,
    c[1] + (target[1] - c[1]) * amount,
    c[2] + (target[2] - c[2]) * amount,
  ];
  return rgbToHex(mixed);
}

const WHITE: [number, number, number] = [255, 255, 255];
const BLACK: [number, number, number] = [0, 0, 0];

export function normalizeColor(value: string | undefined | null): string {
  const clean = (value ?? '').trim();
  if (!clean) return DEFAULT_THEME_COLOR;
  if (!/^#?[0-9a-fA-F]{3,6}$/.test(clean)) return DEFAULT_THEME_COLOR;
  const hex = clean.startsWith('#') ? clean : `#${clean}`;
  return hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex.slice(0, 7);
}

/** Skala warna 50–900 untuk mode terang (tint → shade) */
export function buildLightScale(hex: string) {
  return {
    50: mix(hex, WHITE, 0.95),
    100: mix(hex, WHITE, 0.9),
    200: mix(hex, WHITE, 0.75),
    300: mix(hex, WHITE, 0.55),
    400: hex,
    500: mix(hex, BLACK, 0.12),
    600: mix(hex, BLACK, 0.28),
    700: mix(hex, BLACK, 0.45),
    800: mix(hex, BLACK, 0.62),
    900: mix(hex, BLACK, 0.76),
  };
}

/** Skala warna 50–900 untuk mode gelap (latar gelap, teks jadi terang) */
export function buildDarkScale(hex: string) {
  return {
    50: mix(hex, BLACK, 0.94),
    100: mix(hex, BLACK, 0.87),
    200: mix(hex, BLACK, 0.75),
    300: mix(hex, BLACK, 0.55),
    400: mix(hex, WHITE, 0.18),
    500: hex,
    600: mix(hex, WHITE, 0.22),
    700: mix(hex, WHITE, 0.42),
    800: mix(hex, WHITE, 0.6),
    900: mix(hex, WHITE, 0.78),
  };
}

/** CSS siap tempel yang menimpa token warna brand sesuai tema */
export function buildThemeCss(themeColor: string | undefined | null): string {
  const hex = normalizeColor(themeColor);
  const light = buildLightScale(hex);
  const dark = buildDarkScale(hex);

  const decl = (scale: Record<number, string>) =>
    Object.entries(scale)
      .map(([key, value]) => `--color-brand-${key}:${value};`)
      .join('');

  const softLight = mix(hex, WHITE, 0.95);
  const softDark = mix(hex, BLACK, 0.93);

  return (
    `:root{${decl(light)}--color-soft-yellow:${softLight};}` +
    `.dark{${decl(dark)}--color-soft-yellow:${softDark};}`
  );
}
