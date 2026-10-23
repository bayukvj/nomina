import type { APIRoute } from 'astro';
import { getSettings } from '../lib/settings';

/** Index sitemap: menunjuk ke sitemap.xml utama */
export const GET: APIRoute = async ({ site }) => {
  const settings = await getSettings();
  const base = (site?.toString() ?? process.env.SITE_URL ?? 'http://localhost:4321').replace(/\/$/, '');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${base}/sitemap.xml</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </sitemap>
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
