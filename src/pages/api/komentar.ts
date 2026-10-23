import type { APIRoute } from 'astro';
import { db } from '../../db';
import { comments, posts } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { getSettings } from '../../lib/settings';
import { postUrl } from '../../lib/permalink';
import { escapeHtml } from '../../lib/utils';
import { validateCsrfForm, getCsrfSecret } from '../../lib/csrf';
import { rateLimit, rateLimitKey } from '../../lib/rate-limit';

export const POST: APIRoute = async ({ request, redirect, cookies, clientAddress }) => {
  const settings = await getSettings();

  if (settings.commentEnabled !== 'true') {
    return redirect('/');
  }

  const secret = getCsrfSecret();

  const rlKey = rateLimitKey({ ip: clientAddress }, 'komentar');
  const rl = rateLimit(rlKey, { windowMs: 60_000, max: 10 });
  if (!rl.allowed) {
    return new Response('Terlalu banyak permintaan. Coba lagi nanti.', {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
    });
  }

  const formData = await validateCsrfForm(cookies, request, secret).catch(() => null);
  if (!formData) {
    return new Response('Permintaan tidak valid (CSRF)', { status: 403 });
  }

  const postId = Number(formData.get('postId'));
  const name = escapeHtml(String(formData.get('name') ?? '').trim());
  const email = escapeHtml(String(formData.get('email') ?? '').trim());
  const body = escapeHtml(String(formData.get('body') ?? '').trim());
  const website = String(formData.get('website') ?? '').trim();

  if (website) return redirect('/');
  if (!postId || name.length < 2 || body.length < 3) {
    return new Response('Data tidak valid', { status: 400 });
  }
  if (body.length > 2000) {
    return new Response('Komentar terlalu panjang', { status: 400 });
  }

  await db.insert(comments).values({
    postId,
    name,
    email: email || null,
    body,
    status: settings.commentRequireModeration === 'true' ? 'pending' : 'approved',
    ip: clientAddress,
    userAgent: request.headers.get('user-agent')?.slice(0, 300),
  });

  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  const redirectUrl = post
    ? postUrl(
        {
          slug: post.slug,
          id: post.id,
          categorySlug: undefined,
          publishedAt: post.publishedAt,
          createdAt: post.createdAt,
        },
        settings,
      ) + '#komentar'
    : '/cari';

  return redirect(redirectUrl);
};
