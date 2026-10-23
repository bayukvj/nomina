import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimit, rateLimitKey, getRateLimitHeaders } from './rate-limit';

describe('Rate limiting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe('rateLimitKey', () => {
    it('should format key with ip', () => {
      expect(rateLimitKey({ ip: '127.0.0.1' }, 'login')).toBe('login:127.0.0.1');
    });

    it('should format key with identifier if ip missing', () => {
      expect(rateLimitKey({ identifier: 'user123' }, 'subscribe')).toBe('subscribe:user123');
    });

    it('should use unknown if neither is provided', () => {
      expect(rateLimitKey({}, 'test')).toBe('test:unknown');
    });
  });

  describe('rateLimit', () => {
    it('should allow requests up to max limit', () => {
      const options = { windowMs: 60_000, max: 3 };
      const key = 'test:limit';

      const r1 = rateLimit(key, options);
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(2);

      const r2 = rateLimit(key, options);
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = rateLimit(key, options);
      expect(r3.allowed).toBe(true);
      expect(r3.remaining).toBe(0);
    });

    it('should block when limit exceeded', () => {
      const options = { windowMs: 60_000, max: 2 };
      const key = 'test:blocked';

      rateLimit(key, options);
      rateLimit(key, options);

      const r3 = rateLimit(key, options);
      expect(r3.allowed).toBe(false);
      expect(r3.remaining).toBe(0);
    });

    it('should reset after window expires', () => {
      const options = { windowMs: 60_000, max: 2 };
      const key = 'test:reset';

      const r1 = rateLimit(key, options);
      expect(r1.allowed).toBe(true);

      vi.advanceTimersByTime(61_000);

      const r2 = rateLimit(key, options);
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(1);
    });

    it('should track separate keys independently', () => {
      const options = { windowMs: 60_000, max: 1 };

      const r1 = rateLimit('key:a', options);
      const r2 = rateLimit('key:b', options);

      expect(r1.allowed).toBe(true);
      expect(r2.allowed).toBe(true);
    });

    it('should use different window for different keys', () => {
      const options = { windowMs: 60_000, max: 1 };

      rateLimit('key:separate', options);
      const r2 = rateLimit('other:separate', options);

      expect(r2.allowed).toBe(true);
    });
  });

  describe('getRateLimitHeaders', () => {
    it('should format rate limit headers', () => {
      const result = getRateLimitHeaders({ allowed: true, remaining: 5, resetAt: Date.now() + 60_000 });
      expect(result['X-RateLimit-Remaining']).toBe('5');
      expect(result['X-RateLimit-Limit']).toBeTruthy();
      expect(result['X-RateLimit-Reset']).toBeTruthy();
    });

    it('should handle zero remaining', () => {
      const result = getRateLimitHeaders({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });
      expect(result['X-RateLimit-Remaining']).toBe('0');
    });
  });
});
