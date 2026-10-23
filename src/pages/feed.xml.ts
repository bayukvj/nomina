import type { APIRoute } from 'astro';
import rss from '@astrojs/rss';
import { getPosts } from '../lib/content';
import { getSettings } from '../lib/settings';
import { postUrl } from '../lib/permalink';

/** Alias feed.xml -> rss.xml (konvensi umum) */
export const GET: APIRoute = async (context) => {
  const settings = await getSettings();
  const site = context.site ?? process.env.SITE_URL ?? 'http://localhost:4321';
  const { rows } = await getPosts({ perPage: 30, sort: 'terbaru' });

  return rss({
    title: settings.siteName,
    description: settings.siteDescription,
    site,
    trailingSlash: false,
    items: rows.map((r) => ({
      title: r.post.title,
      description: r.post.excerpt ?? '',
      pubDate: new Date(r.post.publishedAt ?? r.post.createdAt),
      link: postUrl(
        {
          slug: r.post.slug,
          id: r.post.id,
          categorySlug: r.category?.slug,
          publishedAt: r.post.publishedAt,
          createdAt: r.post.createdAt,
        },
        settings,
      ),
      categories: r.category ? [r.category.name] : [],
      author: r.author?.name,
    })),
    customData: '<language>id-ID</language>',
  });
};
