import { readdirSync, statSync, readFileSync } from 'node:fs';
import path from 'node:path';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const full = path.join(dir, e);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith('.astro')) out.push(full);
  }
  return out;
}

const dark: Record<string, string> = {
  white: '#ffffff',
  'ink-50': '#0b0b0d',
  'ink-100': '#141417',
  'ink-200': '#26262b',
  'ink-300': '#35353b',
  'ink-400': '#8b8b93',
  'ink-500': '#a9a9b2',
  'ink-600': '#c6c6ce',
  'ink-700': '#dedee4',
  'ink-800': '#efeff2',
  'ink-900': '#fafafa',
  'brand-50': '#1c1a10',
  'brand-100': '#26220f',
  'brand-200': '#3a320d',
  'brand-300': '#fde047',
  'brand-400': '#facc15',
  'brand-500': '#eab308',
  'brand-600': '#fde047',
  'brand-700': '#fde047',
  'brand-800': '#fef08a',
  'brand-900': '#fefce8',
  'brand-ink': '#0a0a0a',
  'on-white': '#1f1f1f',
  surface: '#141417',
  'night-900': '#1b1b1f',
  'night-800': '#2a2a30',
  'coral-50': '#0b0b0d',
  'coral-100': '#141417',
  'coral-200': '#26262b',
  'coral-300': '#35353b',
  'coral-400': '#8b8b93',
  'coral-500': '#a9a9b2',
  'coral-600': '#c6c6ce',
  'coral-700': '#dedee4',
  'coral-800': '#efeff2',
  'coral-900': '#fafafa',
  'grape-50': '#0b0b0d',
  'grape-100': '#141417',
  'grape-200': '#26262b',
  'grape-300': '#35353b',
  'grape-400': '#a1a1aa',
  'grape-500': '#a9a9b2',
  'grape-600': '#c6c6ce',
  'grape-700': '#dedee4',
  'grape-800': '#efeff2',
  'grape-900': '#fafafa',
  'mint-50': '#0b0b0d',
  'mint-100': '#141417',
  'mint-200': '#26262b',
  'mint-300': '#35353b',
  'mint-400': '#fbbf24',
  'mint-500': '#f59e0b',
  'mint-600': '#fbbf24',
  'mint-700': '#fcd34d',
  'sun-50': '#0b0b0d',
  'sun-100': '#141417',
  'sun-200': '#26262b',
  'sun-300': '#35353b',
  'sun-400': '#ffcc00',
  'sun-500': '#ffd951',
  'sun-600': '#f5b700',
  'sun-700': '#fde047',
  'sky-50': '#0b0b0d',
  'sky-100': '#141417',
  'sky-200': '#26262b',
  'sky-300': '#35353b',
  'sky-400': '#d6d6d6',
  'sky-500': '#a8a8a8',
  'sky-600': '#c6c6ce',
  'sky-700': '#dedee4',
  emerald: '#34d399',
  'emerald-50': '#0c1f16',
  'emerald-200': '#14532d',
  'emerald-700': '#6ee7b7',
};

function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function lum([r, g, b]: [number, number, number]) {
  const f = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a: string, b: string) {
  const l1 = lum(rgb(a));
  const l2 = lum(rgb(b));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

type Issue = { file: string; line: number; snippet: string; bg: string; fg: string; r: number; state: string };

const issues: Issue[] = [];

for (const file of walk('src')) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    const attrs = line.match(/class="([^"]*)"/g);
    if (!attrs) return;

    for (const attr of attrs) {
      const body = attr.slice(7, -1);
      const base: string[] = [];
      const hover: string[] = [];
      // token: [prefix][name]  dengan prefix opsional hover:/focus:/group-hover:
      const re = /(?:(hover|focus|group-hover):)?([a-z][a-z0-9-]*)((?:\/[0-9]{1,3})?)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(body))) {
        const [, state, name, alpha] = m;
        (state ? hover : base).push(alpha ? `${name}${alpha}` : name);
      }

      const pick = (list: string[], prefix: string) => {
        for (const t of list) {
          if (t.startsWith(prefix) && dark[t.slice(prefix.length)]) {
            return { key: t.slice(prefix.length), alpha: /\/[0-9]/.test(t) };
          }
        }
        return null;
      };

      for (const state of ['base', 'hover'] as const) {
        const tokens = state === 'base' ? base : hover;
        const bg = pick(tokens as string[], 'bg-');
        const fg = pick(tokens as string[], 'text-');
        if (!bg || !fg) continue;
        if (bg.alpha) continue; // alpha di atas latar gelap/putih, review manual
        const r = ratio(dark[fg.key], dark[bg.key]);
        if (r < 3) {
          issues.push({
            file,
            line: idx + 1,
            snippet: body,
            bg: bg.key,
            fg: fg.key,
            r,
            state,
          });
        }
      }
    }
  });
}

for (const i of issues) {
  console.log(
    `${i.file}:${i.line}  [${i.state}]  rasio ${i.r.toFixed(2)}  bg-${i.bg} + text-${i.fg}`,
  );
  console.log(`   ${i.snippet.replace(/\s+/g, ' ').slice(0, 160)}`);
}
console.log(`\ntotal temuan: ${issues.length}`);
