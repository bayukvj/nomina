import type { APIRoute } from 'astro';
import { getPosts, getAllCategories, getAllTags, getAllPages } from '../lib/content';
import { getSettings } from '../lib/settings';
import { postUrl, categoryUrl, tagUrl, pageUrl } from '../lib/permalink';

export const GET: APIRoute = async ({ site }) => {
  const base = (site?.toString() ?? process.env.SITE_URL ?? 'http://localhost:4321').replace(/\/$/, '');
  const settings = await getSettings();

  const [posts, categories, tags, pages] = await Promise.all([
    getPosts({ perPage: 500, sort: 'terbaru' }),
    getAllCategories(),
    getAllTags(),
    getAllPages(),
  ]);

  const urls: { loc: string; lastmod?: string; changefreq?: string; priority?: string }[] = [
    { loc: `${base}/`, changefreq: 'hourly', priority: '1.0' },
  ];

  for (const r of posts.rows) {
    urls.push({
      loc: `${base}${postUrl(
        {
          slug: r.post.slug,
          id: r.post.id,
          categorySlug: r.category?.slug,
          publishedAt: r.post.publishedAt,
          createdAt: r.post.createdAt,
        },
        settings,
      )}`,
      lastmod: new Date(r.post.updatedAt ?? r.post.createdAt).toISOString(),
      changefreq: 'daily',
      priority: '0.8',
    });
  }

  for (const c of categories) {
    urls.push({ loc: `${base}${categoryUrl(c.slug, settings)}`, changefreq: 'daily', priority: '0.6' });
  }

  for (const t of tags) {
    urls.push({ loc: `${base}${tagUrl(t.slug, settings)}`, changefreq: 'weekly', priority: '0.4' });
  }

  for (const p of pages.filter((p) => p.status === 'published')) {
    urls.push({
      loc: `${base}${pageUrl(p.slug, settings)}`,
      lastmod: new Date(p.updatedAt).toISOString(),
      changefreq: 'monthly',
      priority: '0.5',
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}${
      u.changefreq ? `\n    <changefreq>${u.changefreq}</changefreq>` : ''
    }${u.priority ? `\n    <priority>${u.priority}</priority>` : ''}
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
