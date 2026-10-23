import type { Settings } from './settings-def';

export type UrlSource = {
  slug: string;
  id?: number;
  title?: string;
  categorySlug?: string | null;
  categoryName?: string | null;
  publishedAt?: Date | string | null;
  createdAt?: Date | string | null;
};

function withSlash(path: string, settings: Settings) {
  if (settings.trailingSlash === 'true' && !path.endsWith('/')) return `${path}/`;
  return path;
}

export function postUrl(post: UrlSource, settings: Settings): string {
  const structure = settings.permalinkStructure || '/{category}/{slug}';
  const date = post.publishedAt ?? post.createdAt ?? new Date();
  const d = typeof date === 'string' ? new Date(date) : date;

  const values: Record<string, string> = {
    slug: post.slug,
    id: String(post.id ?? ''),
    title: slugifyText(post.title ?? ''),
    category: post.categorySlug ?? 'tanpa-kategori',
    categoryName: post.categoryName ?? '',
    y: String(d.getFullYear()),
    m: String(d.getMonth() + 1).padStart(2, '0'),
    d: String(d.getDate()).padStart(2, '0'),
  };

  let path = structure.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '');
  path = path.replace(/\/+/g, '/').replace(/\/$/, '');
  if (!path.startsWith('/')) path = `/${path}`;
  return withSlash(path, settings);
}

function slugifyText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function categoryUrl(slug: string, settings: Settings) {
  const base = (settings.permalinkCategoryBase ?? '').trim();
  return withSlash(base ? `/${base}/${slug}` : `/${slug}`, settings);
}

export function tagUrl(slug: string, settings: Settings) {
  const base = (settings.permalinkTagBase ?? '').trim();
  return withSlash(base ? `/${base}/${slug}` : `/${slug}`, settings);
}

export function pageUrl(slug: string, settings: Settings) {
  const base = (settings.permalinkPageBase ?? '').trim();
  return withSlash(base ? `/${base}/${slug}` : `/${slug}`, settings);
}

export function authorUrl(slug: string, settings: Settings) {
  const base = (settings.permalinkAuthorBase ?? '').trim();
  return withSlash(base ? `/${base}/${slug}` : `/${slug}`, settings);
}

export function absoluteUrl(path: string, siteUrl: string) {
  if (!path) return siteUrl;
  if (path.startsWith('http')) return path;
  return `${siteUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
