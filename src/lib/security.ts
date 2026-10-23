/**
 * Header keamanan untuk seluruh respons.
 *
 * Catatan: Astro menyisipkan beberapa <script> inline (tema, custom JS),
 * jadi 'unsafe-inline' dipakai untuk script-src. Atribut ini tetap membatasi
 * sumber skrip eksternal ke domain yang diizinkan.
 */
export function buildSecurityHeaders(path: string): Record<string, string> {
  const isAdmin = path.startsWith('/admin');

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    isAdmin
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.googletagmanager.com https://www.googletagservices.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    isAdmin
      ? "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com"
      : "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
    "connect-src 'self' https://*.google-analytics.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ');

  return {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'X-DNS-Prefetch-Control': 'on',
  };
}
