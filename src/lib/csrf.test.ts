import { describe, it, expect, beforeEach } from 'vitest';
import {
  signCsrfToken,
  verifyCsrfToken,
  extractCsrfPayload,
  getCsrfSecret,
  ensureCsrfCookie,
  validateCsrfForm,
  validateCsrfHeader,
  CSRF_COOKIE,
  CSRF_FIELD,
} from './csrf';

function createMockCookies(token?: string) {
  const store: Record<string, string> = token ? { nomina_csrf: token } : {};
  return {
    get: (name: string) => (store[name] ? { value: store[name] } : undefined),
    set: (name: string, value: string) => {
      store[name] = value;
    },
  };
}

function createMockRequestWithFormData(csrfToken: string) {
  const formData = new FormData();
  formData.append(CSRF_FIELD, csrfToken);
  return {
    formData: () => Promise.resolve(formData),
  } as unknown as Request;
}

function createMockRequestWithHeader(csrfToken: string) {
  return new Request('http://test.com', {
    headers: { 'x-csrf-token': csrfToken },
  });
}

describe('CSRF utilities', () => {
  let secret: string;

  beforeEach(() => {
    secret = 'test-secret-key-123456';
  });

  describe('signCsrfToken', () => {
    it('should generate a signed token with payload.signature format', () => {
      const token = signCsrfToken(secret);
      expect(token).toMatch(/^[a-f0-9]{64}\.[a-f0-9]{64}$/);
    });

    it('should generate different tokens each time', () => {
      const t1 = signCsrfToken(secret);
      const t2 = signCsrfToken(secret);
      expect(t1).not.toBe(t2);
    });
  });

  describe('extractCsrfPayload', () => {
    it('should extract the payload from a signed token', () => {
      const token = signCsrfToken(secret);
      const payload = extractCsrfPayload(token);
      expect(payload).toBeTruthy();
      expect(payload).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should return null for malformed token', () => {
      expect(extractCsrfPayload(null)).toBeNull();
      expect(extractCsrfPayload(undefined)).toBeNull();
      expect(extractCsrfPayload('noseparator')).toBeNull();
    });
  });

  describe('verifyCsrfToken', () => {
    it('should verify a valid signed token', () => {
      const token = signCsrfToken(secret);
      expect(verifyCsrfToken(token, secret)).toBe(true);
    });

    it('should reject a token signed with different secret', () => {
      const token = signCsrfToken('other-secret');
      expect(verifyCsrfToken(token, secret)).toBe(false);
    });

    it('should reject malformed tokens', () => {
      expect(verifyCsrfToken(null, secret)).toBe(false);
      expect(verifyCsrfToken(undefined, secret)).toBe(false);
      expect(verifyCsrfToken('', secret)).toBe(false);
      expect(verifyCsrfToken('invalid', secret)).toBe(false);
      expect(verifyCsrfToken('abc.def', secret)).toBe(false);
    });

    it('should reject tampered tokens', () => {
      const token = signCsrfToken(secret);
      const payload = extractCsrfPayload(token);
      const tampered = `${payload}.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`;
      expect(verifyCsrfToken(tampered, secret)).toBe(false);
    });
  });

  describe('getCsrfSecret', () => {
    it('should return CSRF_SECRET env or fallback', () => {
      const s = getCsrfSecret();
      expect(typeof s).toBe('string');
      expect(s.length).toBeGreaterThan(0);
    });
  });

  describe('ensureCsrfCookie', () => {
    it('should return existing valid token', () => {
      const token = signCsrfToken(secret);
      const cookies = createMockCookies(token);
      const result = ensureCsrfCookie(cookies as never, secret);
      expect(result).toBe(token);
    });

    it('should create new token when none exists', () => {
      const cookies = createMockCookies();
      const result = ensureCsrfCookie(cookies as never, secret);
      expect(result).toMatch(/^[a-f0-9]{64}\.[a-f0-9]{64}$/);
    });

    it('should create new token when existing is invalid', () => {
      const cookies = createMockCookies('invalid-token');
      const result = ensureCsrfCookie(cookies as never, secret);
      expect(result).toMatch(/^[a-f0-9]{64}\.[a-f0-9]{64}$/);
    });
  });

  describe('validateCsrfForm', () => {
    it('should return formData when CSRF is valid', async () => {
      const token = signCsrfToken(secret);
      const cookies = createMockCookies(token);
      const request = createMockRequestWithFormData(token);

      const formData = await validateCsrfForm(cookies as never, request, secret);
      expect(formData.get(CSRF_FIELD)).toBe(token);
    });

    it('should throw 403 when cookie token is invalid', async () => {
      const cookies = createMockCookies('invalid');
      const request = createMockRequestWithFormData('some-token');

      const response = await validateCsrfForm(cookies as never, request, secret).catch((e: unknown) => e) as Response;
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(403);
    });

    it('should throw 403 when form token is invalid', async () => {
      const token = signCsrfToken(secret);
      const cookies = createMockCookies(token);
      const request = createMockRequestWithFormData('invalid');

      const response = await validateCsrfForm(cookies as never, request, secret).catch((e: unknown) => e) as Response;
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(403);
    });

    it('should throw 403 when payloads do not match', async () => {
      const token1 = signCsrfToken(secret);
      const token2 = signCsrfToken(secret);
      const cookies = createMockCookies(token1);
      const request = createMockRequestWithFormData(token2);

      const response = await validateCsrfForm(cookies as never, request, secret).catch((e: unknown) => e) as Response;
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(403);
    });
  });

  describe('validateCsrfHeader', () => {
    it('should return true when both tokens match', () => {
      const token = signCsrfToken(secret);
      const cookies = createMockCookies(token);
      const request = createMockRequestWithHeader(token);

      expect(validateCsrfHeader(cookies as never, request, secret)).toBe(true);
    });

    it('should return false when cookie token is invalid', () => {
      const cookies = createMockCookies('invalid');
      const request = createMockRequestWithHeader(signCsrfToken(secret));

      expect(validateCsrfHeader(cookies as never, request, secret)).toBe(false);
    });

    it('should return false when header token is missing', () => {
      const token = signCsrfToken(secret);
      const cookies = createMockCookies(token);
      const request = new Request('http://test.com');

      expect(validateCsrfHeader(cookies as never, request, secret)).toBe(false);
    });

    it('should return false when payloads do not match', () => {
      const token1 = signCsrfToken(secret);
      const token2 = signCsrfToken(secret);
      const cookies = createMockCookies(token1);
      const request = createMockRequestWithHeader(token2);

      expect(validateCsrfHeader(cookies as never, request, secret)).toBe(false);
    });
  });
});
