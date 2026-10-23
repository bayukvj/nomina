import type { APIRoute } from 'astro';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../db';
import { subscribers } from '../../db/schema';
import { validateCsrfForm, getCsrfSecret } from '../../lib/csrf';
import { rateLimit, rateLimitKey } from '../../lib/rate-limit';

export const POST: APIRoute = async ({ request, redirect, cookies, clientAddress }) => {
  const secret = getCsrfSecret();

  const rlKey = rateLimitKey({ ip: clientAddress }, 'subscribe');
  const rl = rateLimit(rlKey, { windowMs: 60_000, max: 5 });
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

  const email = String(formData.get('email') ?? '').trim().toLowerCase();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return new Response('Email tidak valid', { status: 400 });
  }

  if (email.length > 254) {
    return new Response('Email terlalu panjang', { status: 400 });
  }

  const existing = await db
    .select({ id: subscribers.id })
    .from(subscribers)
    .where(sql`lower(${subscribers.email}) = ${email}`)
    .limit(1);

  if (existing.length === 0) {
    await db.insert(subscribers).values({ email });
  }

  return redirect('/');
};
