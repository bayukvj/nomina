import { randomBytes, createHmac } from 'node:crypto';
import type { APIContext } from 'astro';

export const CSRF_COOKIE = 'nomina_csrf';
export const CSRF_FIELD = '_csrf';
export const CSRF_HEADER = 'x-csrf-token';

/**
 * Secret untuk menandatangani token CSRF.
 * Dari env var CSRF_SECRET, fallback ke SITE_URL atau random.
 */
export function getCsrfSecret(): string {
  return (
    process.env.CSRF_SECRET ??
    process.env.SESSION_SECRET ??
    'nomina-csrf-default-change-me'
  );
}

/**
 * Generate signed CSRF token: payload.signature
 */
export function signCsrfToken(secret: string): string {
  const payload = randomBytes(32).toString('hex');
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

/**
 * Extract raw payload from a signed token.
 */
export function extractCsrfPayload(token: string | undefined | null): string | null {
  if (!token || !token.includes('.')) return null;
  return token.split('.')[0];
}

/**
 * Verify a signed CSRF token.
 */
export function verifyCsrfToken(token: string | undefined | null, secret: string): boolean {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const dot = token.indexOf('.');
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  if (expected.length !== sig.length) return false;
  return createHmac('sha256', secret).update(payload).digest('hex') === sig;
}

/**
 * Get or create the CSRF cookie token.
 * Returns the signed token and sets the cookie if not present.
 */
export function ensureCsrfCookie(
  cookies: APIContext['cookies'],
  secret: string,
): string {
  const existing = cookies.get(CSRF_COOKIE)?.value;
  if (existing && verifyCsrfToken(existing, secret)) return existing;

  const signed = signCsrfToken(secret);
  cookies.set(CSRF_COOKIE, signed, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return signed;
}

/**
 * Validate CSRF for form submissions.
 * Call this BEFORE reading formData() in the endpoint.
 * Returns the formData if validation passes, throws Response if invalid.
 */
export async function validateCsrfForm(
  cookies: APIContext['cookies'],
  request: Request,
  secret: string,
): Promise<FormData> {
  const cookieToken = cookies.get(CSRF_COOKIE)?.value;
  if (!cookieToken || !verifyCsrfToken(cookieToken, secret)) {
    throw new Response('CSRF validation failed', { status: 403 });
  }

  const formData = await request.formData();
  const formToken = formData.get(CSRF_FIELD)?.toString();

  if (!formToken || !verifyCsrfToken(formToken, secret)) {
    throw new Response('CSRF validation failed', { status: 403 });
  }

  const cookiePayload = extractCsrfPayload(cookieToken);
  const formPayload = extractCsrfPayload(formToken);

  if (!cookiePayload || !formPayload || cookiePayload !== formPayload) {
    throw new Response('CSRF validation failed', { status: 403 });
  }

  return formData;
}

/**
 * Validate CSRF for JSON requests via header.
 */
export function validateCsrfHeader(
  cookies: APIContext['cookies'],
  request: Request,
  secret: string,
): boolean {
  const cookieToken = cookies.get(CSRF_COOKIE)?.value;
  if (!cookieToken || !verifyCsrfToken(cookieToken, secret)) return false;

  const headerToken = request.headers.get(CSRF_HEADER);
  if (!headerToken || !verifyCsrfToken(headerToken, secret)) return false;

  return extractCsrfPayload(cookieToken) === extractCsrfPayload(headerToken);
}
