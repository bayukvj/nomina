import { describe, it, expect } from 'vitest';
import { postUrl, categoryUrl, tagUrl, pageUrl, absoluteUrl } from './permalink';
import type { Settings } from './settings-def';

function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    permalinkStructure: '/{category}/{slug}',
    permalinkCategoryBase: 'kategori',
    permalinkTagBase: 'tag',
    permalinkPageBase: 'halaman',
    permalinkAuthorBase: 'penulis',
    trailingSlash: 'false',
    redirectOldUrls: 'true',
    ...overrides,
  } as Settings;
}

describe('postUrl', () => {
  const settings = makeSettings();

  it('should build URL with category and slug', () => {
    const url = postUrl(
      { slug: 'hello-world', categorySlug: 'teknologi' },
      settings,
    );
    expect(url).toBe('/teknologi/hello-world');
  });

  it('should use tanpa-kategori when no category', () => {
    const url = postUrl({ slug: 'no-cat' }, settings);
    expect(url).toBe('/tanpa-kategori/no-cat');
  });

  it('should respect custom structure without category', () => {
    const s = makeSettings({ permalinkStructure: '/{id}/{slug}' });
    const url = postUrl({ slug: 'post', id: 42 }, s);
    expect(url).toBe('/42/post');
  });

  it('should respect custom structure with date', () => {
    const s = makeSettings({ permalinkStructure: '/{y}/{m}/{d}/{slug}' });
    const url = postUrl(
      { slug: 'post', categorySlug: 'news', publishedAt: '2024-03-15T10:00:00Z' },
      s,
    );
    expect(url).toBe('/2024/03/15/post');
  });

  it('should add trailing slash when configured', () => {
    const s = makeSettings({ trailingSlash: 'true' });
    const url = postUrl({ slug: 'hello', categorySlug: 'cat' }, s);
    expect(url).toBe('/cat/hello/');
  });
});

describe('categoryUrl', () => {
  it('should use base prefix', () => {
    const s = makeSettings({ permalinkCategoryBase: 'kategori' });
    expect(categoryUrl('teknologi', s)).toBe('/kategori/teknologi');
  });

  it('should work without base', () => {
    const s = makeSettings({ permalinkCategoryBase: '' });
    expect(categoryUrl('teknologi', s)).toBe('/teknologi');
  });
});

describe('tagUrl', () => {
  it('should use base prefix', () => {
    const s = makeSettings({ permalinkTagBase: 'tag' });
    expect(tagUrl('politik', s)).toBe('/tag/politik');
  });
});

describe('pageUrl', () => {
  it('should use base prefix', () => {
    const s = makeSettings({ permalinkPageBase: 'halaman' });
    expect(pageUrl('tentang', s)).toBe('/halaman/tentang');
  });
});

describe('absoluteUrl', () => {
  it('should prepend siteUrl to path', () => {
    expect(absoluteUrl('/foo/bar', 'https://example.com')).toBe('https://example.com/foo/bar');
  });

  it('should not modify absolute URLs', () => {
    expect(absoluteUrl('https://cdn.example.com/img.png', 'https://example.com')).toBe(
      'https://cdn.example.com/img.png',
    );
  });

  it('should handle empty path', () => {
    expect(absoluteUrl('', 'https://example.com')).toBe('https://example.com');
  });

  it('should handle trailing slash in siteUrl', () => {
    expect(absoluteUrl('/path', 'https://example.com/')).toBe('https://example.com/path');
  });
});
