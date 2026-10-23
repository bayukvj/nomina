import { describe, it, expect } from 'vitest';

/**
 * Test untuk memverifikasi bahwa bug import escapeHtml sudah diperbaiki.
 *
 * BUG: src/pages/api/komentar.ts sebelumnya meng-import escapeHtml
 * dari '../../lib/content-render', tetapi modul tersebut TIDAK
 * mengekspor fungsi escapeHtml. Hal ini menyebabkan runtime error.
 *
 * FIX: komentar.ts sekarang meng-import dari '../../lib/utils'
 * yang memang mengekspor escapeHtml.
 *
 * Test ini memastikan:
 * 1. utils.ts mengekspor escapeHtml yang benar
 * 2. content-render.ts TIDAK mengekspor escapeHtml
 */
describe('komentar.ts escapeHtml import fix', () => {
  it('utils.ts should export escapeHtml', async () => {
    const utils = await import('./utils');
    expect(utils.escapeHtml).toBeDefined();
    expect(typeof utils.escapeHtml).toBe('function');
    expect(utils.escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('content-render.ts should NOT export escapeHtml', async () => {
    const contentRender = await import('./content-render');
    expect((contentRender as { escapeHtml?: unknown }).escapeHtml).toBeUndefined();
  });

  it('komentar.ts module should load without errors', async () => {
    try {
      const mod = await import('../pages/api/komentar');
      expect(mod.POST).toBeDefined();
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('escapeHtml')) {
        throw new Error(`komentar.ts gagal import escapeHtml: ${e.message}`);
      }
    }
  });
});
