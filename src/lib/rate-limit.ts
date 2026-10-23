/**
 * Sederhana rate limiter berbasis memori.
 * Cocok untuk single-instance deployment.
 * Untuk multi-instance, ganti dengan Redis-based limiter.
 */

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();

  const existing = store.get(key);
  if (existing && existing.resetAt > now) {
    if (existing.count <= 0) {
      return { allowed: false, remaining: 0, resetAt: existing.resetAt };
    }
    existing.count -= 1;
    return { allowed: true, remaining: existing.count, resetAt: existing.resetAt };
  }

  const resetAt = now + options.windowMs;
  store.set(key, { count: options.max - 1, resetAt });
  return { allowed: true, remaining: options.max - 1, resetAt };
}

export function rateLimitKey(context: { ip?: string; identifier?: string }, prefix: string): string {
  return `${prefix}:${context.ip ?? context.identifier ?? 'unknown'}`;
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.resetAt - Date.now() + result.remaining),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetAt),
  };
}

if (typeof globalThis.setInterval !== 'undefined') {
  try {
    const interval = setInterval(cleanup, 60_000);
    if (typeof interval.unref === 'function') interval.unref();
  } catch {
    // serverless/edge: skip periodic cleanup
  }
}
