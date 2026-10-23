import { describe, it, expect } from 'vitest';
import { escapeHtml, slugify, uniqueSlug, readingTime, excerptFrom, formatBytes, formatNumber, formatDate, timeAgo } from './utils';

describe('escapeHtml (komentar.ts import fix)', () => {
  it('should escape & to &amp;', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('should escape < to &lt;', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('should escape > to &gt;', () => {
    expect(escapeHtml('>')).toBe('&gt;');
  });

  it('should escape " to &quot;', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('should escape \' to &#039;', () => {
    expect(escapeHtml("'hello'")).toBe('&#039;hello&#039;');
  });

  it('should handle null/undefined input', () => {
    expect(escapeHtml(null as unknown as string)).toBe('');
    expect(escapeHtml(undefined as unknown as string)).toBe('');
  });

  it('should escape all characters in order: & < > " \'', () => {
    const input = '<script>alert("xss")</script>';
    const result = escapeHtml(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });
});

describe('slugify', () => {
  it('should convert to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('should remove accents', () => {
    expect(slugify('Café Münchén')).toBe('cafe-munchen');
  });

  it('should replace special chars with hyphens', () => {
    expect(slugify('hello!@#world')).toBe('hello-world');
  });

  it('should collapse multiple hyphens', () => {
    expect(slugify('a---b')).toBe('a-b');
  });

  it('should replace & with " dan "', () => {
    expect(slugify('Tom & Jerry')).toBe('tom-dan-jerry');
  });

  it('should trim and limit to 180 chars', () => {
    const long = 'a'.repeat(200);
    expect(slugify(long).length).toBe(180);
  });

  it('should handle apostrophes', () => {
    expect(slugify("O'Brien")).toBe('obrien');
  });
});

describe('uniqueSlug', () => {
  it('should return base slug when not taken', () => {
    expect(uniqueSlug('hello', new Set())).toBe('hello');
  });

  it('should append suffix when taken', () => {
    const taken = new Set(['hello']);
    expect(uniqueSlug('hello', taken)).toBe('hello-2');
    expect(uniqueSlug('hello', new Set(['hello', 'hello-2']))).toBe('hello-3');
  });
});
describe('readingTime', () => {
  it('should calculate reading time at 200 WPM', () => {
    const text = Array(200).fill('word').join(' ');
    expect(readingTime(text)).toBe(1);
  });

  it('should handle HTML content', () => {
    expect(readingTime('<p>hello</p>')).toBe(1);
  });

  it('should return minimum of 1 for empty content', () => {
    expect(readingTime('')).toBe(1);
    expect(readingTime(null as unknown as string)).toBe(1);
  });
});

describe('excerptFrom', () => {
  it('should strip HTML tags', () => {
    expect(excerptFrom('<p>Hello World</p>')).toBe('Hello World');
  });

  it('should truncate to specified length', () => {
    const result = excerptFrom('Hello World Foo Bar', 10);
    expect(result.length).toBeLessThanOrEqual(13);
    expect(result).toMatch(/^.{0,10}…$/);
  });

  it('should not truncate short text', () => {
    expect(excerptFrom('short', 160)).toBe('short');
  });

  it('should remove script and style tags', () => {
    const html = '<script>alert(1)</script><p>content</p>';
    expect(excerptFrom(html)).not.toContain('alert');
    expect(excerptFrom(html)).toContain('content');
  });
});

describe('formatBytes', () => {
  it('should format 0 as 0 B', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('should format bytes', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  it('should format KB', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
  });

  it('should format MB', () => {
    expect(formatBytes(1048576)).toBe('1.0 MB');
  });

  it('should format GB', () => {
    expect(formatBytes(1073741824)).toBe('1.0 GB');
  });
});

describe('formatNumber', () => {
  it('should format numbers with Indonesian locale', () => {
    expect(formatNumber(1000)).toBe('1.000');
    expect(formatNumber(1000000)).toBe('1.000.000');
  });
});

describe('formatDate', () => {
  it('should return empty string for null/undefined', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });

  it('should format date in Indonesian locale', () => {
    const result = formatDate('2024-01-15');
    expect(result).toContain('2024');
  });

  it('should return short format', () => {
    const result = formatDate('2024-01-15', 'short');
    expect(result).toBeTruthy();
  });

  it('should return empty for invalid date string', () => {
    expect(formatDate('invalid-date')).toBe('');
  });
});

describe('timeAgo', () => {
  it('should return empty for null/undefined', () => {
    expect(timeAgo(null)).toBe('');
  });

  it('should return "baru saja" for very recent time', () => {
    const now = new Date();
    expect(timeAgo(now)).toBe('baru saja');
  });

  it('should return minutes ago', () => {
    const recent = new Date(Date.now() - 120_000);
    expect(timeAgo(recent)).toBe('2 menit lalu');
  });

  it('should return hours ago', () => {
    const recent = new Date(Date.now() - 3 * 3600_000);
    expect(timeAgo(recent)).toBe('3 jam lalu');
  });

  it('should return days ago', () => {
    const recent = new Date(Date.now() - 2 * 24 * 3600_000);
    expect(timeAgo(recent)).toBe('2 hari lalu');
  });

  it('should return months ago', () => {
    const recent = new Date(Date.now() - 3 * 30 * 24 * 3600_000);
    expect(timeAgo(recent)).toBe('3 bulan lalu');
  });

  it('should return years ago', () => {
    const recent = new Date(Date.now() - 2 * 365 * 24 * 3600_000);
    expect(timeAgo(recent)).toBe('2 tahun lalu');
  });

  it('should handle string date input', () => {
    const past = new Date().toISOString();
    const result = timeAgo(past);
    expect(typeof result).toBe('string');
  });
});
