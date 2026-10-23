import { describe, it, expect } from 'vitest';
import { buildSrcset } from './images';

describe('buildSrcset', () => {
  it('should return undefined for null/undefined input', () => {
    expect(buildSrcset(null)).toBeUndefined();
    expect(buildSrcset(undefined)).toBeUndefined();
  });

  it('should return undefined for empty sizes object', () => {
    expect(buildSrcset({})).toBeUndefined();
  });

  it('should return undefined when only thumb exists', () => {
    expect(buildSrcset({ thumb: { url: '/test-thumb.webp', width: 160 } })).toBeUndefined();
  });

  it('should build srcset sorted by width', () => {
    const sizes = {
      1920: { url: '/img-1920.webp', width: 1920 },
      320: { url: '/img-320.webp', width: 320 },
      1280: { url: '/img-1280.webp', width: 1280 },
    };
    const result = buildSrcset(sizes);
    expect(result).toBe('/img-320.webp 320w, /img-1280.webp 1280w, /img-1920.webp 1920w');
  });

  it('should exclude thumb from srcset', () => {
    const sizes = {
      640: { url: '/img-640.webp', width: 640 },
      thumb: { url: '/img-thumb.webp', width: 160 },
    };
    const result = buildSrcset(sizes);
    expect(result).toBe('/img-640.webp 640w');
    expect(result).not.toContain('thumb');
  });

  it('should handle mixed ordering', () => {
    const sizes = {
      960: { url: '/img-960.webp', width: 960 },
      640: { url: '/img-640.webp', width: 640 },
    };
    const result = buildSrcset(sizes);
    expect(result).toBe('/img-640.webp 640w, /img-960.webp 960w');
  });
});
