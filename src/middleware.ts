import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, getUserByToken } from './lib/auth';
import { MEMBER_COOKIE, getMemberByToken } from './lib/member-auth';
import { compressResponse, shouldCompress } from './lib/compress';
import { buildSecurityHeaders } from './lib/security';

const PROTECTED_PREFIXES = ['/admin'];

export const onRequest = defineMiddleware(async (context, next) => {
  const token = context.cookies.get(SESSION_COOKIE)?.value;
  const user = await getUserByToken(token);
  context.locals.user = user;

  const memberToken = context.cookies.get(MEMBER_COOKIE)?.value;
  context.locals.member = await getMemberByToken(memberToken);

  const path = context.url.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

  if (isProtected && path !== '/admin/login') {
    if (!user) {
      const redirect = encodeURIComponent(path);
      return context.redirect(`/admin/login?next=${redirect}`, 302);
    }
    if (user.role === 'author' && (path.startsWith('/admin/users') || path.startsWith('/admin/settings'))) {
      return context.redirect('/admin', 302);
    }
  }

  if (path === '/admin/login' && user) {
    return context.redirect('/admin', 302);
  }

  let response = await next();

  /* ---------- header keamanan ---------- */
  const securityHeaders = buildSecurityHeaders(path);
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  /* ---------- cache aset statis ---------- */
  if (path.startsWith('/_astro/') || path.startsWith('/fonts/') || path.startsWith('/uploads/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (path === '/robots.txt' || path === '/sitemap.xml' || path === '/sitemap-index.xml') {
    response.headers.set('Cache-Control', 'public, max-age=3600');
  } else {
    response.headers.set('Cache-Control', 'no-cache');
  }

  /* ---------- kompresi respons ---------- */
  if (shouldCompress(context.request, response)) {
    response = await compressResponse(response, context.request);
  }

  return response;
});
