import type { APIRoute } from 'astro';
import { getSettings } from '../lib/settings';

export const GET: APIRoute = async ({ site }) => {
  const base = (site?.toString() ?? process.env.SITE_URL ?? 'http://localhost:4321').replace(/\/$/, '');
  const settings = await getSettings();

  const body = `User-agent: *
${settings.robots || 'index, follow'}

Disallow: /admin
Disallow: /api/
Disallow: /go/

Sitemap: ${base}/sitemap-index.xml
`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
