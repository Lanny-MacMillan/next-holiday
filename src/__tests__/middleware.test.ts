/** @jest-environment node */
import { NextRequest, NextResponse } from 'next/server';

const verifyIdToken = jest.fn();
jest.mock('@/lib/verifyAuth0Token', () => ({
  verifyIdToken: (...a: unknown[]) => verifyIdToken(...a),
}));

import { middleware } from '../middleware';
import { RATE_LIMIT, resetRateLimit } from '@/lib/rateLimit';

const call = (path: string, headers: Record<string, string> = {}) =>
  middleware(new NextRequest(`http://localhost${path}`, { headers }));

beforeEach(() => {
  resetRateLimit();
  verifyIdToken.mockReset();
  delete process.env.ALLOW_LEGACY_TEST_USER_AUTH;
});

describe('API middleware', () => {
  it('returns 401 when there is no token', async () => {
    const res = await call('/api/holidays');
    expect(res.status).toBe(401);
  });

  it('ignores the legacy x-test-user header', async () => {
    const res = await call('/api/holidays', {
      'x-test-user': JSON.stringify({ sub: 'auth0|victim' }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 for an invalid token', async () => {
    verifyIdToken.mockRejectedValue(new Error('bad'));
    const res = await call('/api/holidays', { authorization: 'Bearer nope' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for a non-bearer scheme', async () => {
    const res = await call('/api/holidays', { authorization: 'Basic abc' });
    expect(res.status).toBe(401);
  });

  it('lets a valid token through', async () => {
    verifyIdToken.mockResolvedValue({ sub: 'auth0|me' });
    const res = await call('/api/holidays', { authorization: 'Bearer good' });
    expect(res.status).toBe(200);
  });

  it('leaves the performance beacon public', async () => {
    const res = await call('/api/performance');
    expect(res.status).toBe(200);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('lets header-only requests through only with the legacy flag', async () => {
    process.env.ALLOW_LEGACY_TEST_USER_AUTH = 'true';
    const res = await call('/api/holidays', { 'x-test-user': '{}' });
    expect(res.status).toBe(200);
  });

  it('leaves the Stripe webhook public, because it carries a signature instead of a token', async () => {
    const res = await call('/api/billing/webhook');
    expect(res.status).toBe(200);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('leaves the health check public', async () => {
    const res = await call('/api/health');
    expect(res.status).toBe(200);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  describe('rate limiting', () => {
    const fromIp = (ip: string) =>
      call('/api/performance', { 'x-forwarded-for': `${ip}, 10.0.0.1` });

    it('answers 429 with Retry-After once a client goes over the limit', async () => {
      for (let i = 0; i < RATE_LIMIT.max; i++) {
        expect((await fromIp('203.0.113.7')).status).toBe(200);
      }
      const res = await fromIp('203.0.113.7');
      expect(res.status).toBe(429);
      expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0);
    });

    it('counts each client separately', async () => {
      for (let i = 0; i <= RATE_LIMIT.max; i++) await fromIp('203.0.113.7');
      expect((await fromIp('198.51.100.9')).status).toBe(200);
    });

    it('limits before checking the token', async () => {
      for (let i = 0; i < RATE_LIMIT.max; i++) await call('/api/holidays');
      expect((await call('/api/holidays')).status).toBe(429);
    });
  });
});

describe('request ids and logging', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const info = jest.spyOn(console, 'log').mockImplementation(() => {});
  const lastLine = (spy: jest.SpyInstance) => JSON.parse(spy.mock.calls.at(-1)![0]);

  beforeEach(() => {
    warn.mockClear();
    info.mockClear();
  });
  afterAll(() => {
    warn.mockRestore();
    info.mockRestore();
  });

  it('gives every response an id, whether it is allowed or refused', async () => {
    verifyIdToken.mockResolvedValue({ sub: 'auth0|me' });

    const allowed = await call('/api/holidays', { authorization: 'Bearer good' });
    const refused = await call('/api/holidays');

    expect(allowed.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
    expect(refused.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
    expect(allowed.headers.get('x-request-id')).not.toBe(
      refused.headers.get('x-request-id'),
    );
  });

  it('keeps an id the caller sent, and passes it on to the route', async () => {
    verifyIdToken.mockResolvedValue({ sub: 'auth0|me' });
    const next = jest.spyOn(NextResponse, 'next');

    const res = await call('/api/holidays', {
      authorization: 'Bearer good',
      'x-request-id': 'client-id-12345',
    });

    expect(res.headers.get('x-request-id')).toBe('client-id-12345');
    const forwarded = next.mock.calls[0][0] as { request: { headers: Headers } };
    expect(forwarded.request.headers.get('x-request-id')).toBe('client-id-12345');
    next.mockRestore();
  });

  it.each(['short', 'has spaces in it', 'x'.repeat(100), 'bad<script>chars'])(
    'replaces an unsafe incoming id (%s)',
    async id => {
      const res = await call('/api/health', { 'x-request-id': id });

      expect(res.headers.get('x-request-id')).not.toBe(id);
      expect(res.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
    },
  );

  it('gives public paths an id too', async () => {
    const res = await call('/api/health');

    expect(res.headers.get('x-request-id')).toBeTruthy();
  });

  it('logs a rate-limited request with its id and path, and without the address', async () => {
    for (let i = 0; i <= RATE_LIMIT.max; i++) {
      await call('/api/health', { 'x-forwarded-for': '203.0.113.9' });
    }

    const refused = await call('/api/holidays', {
      'x-forwarded-for': '203.0.113.9',
    });

    expect(refused.status).toBe(429);
    const line = lastLine(warn);
    expect(line).toMatchObject({
      level: 'warn',
      message: 'Rate limit exceeded',
      detail: {
        requestId: refused.headers.get('x-request-id'),
        path: '/api/holidays',
        method: 'GET',
      },
    });
    expect(JSON.stringify(line)).not.toContain('203.0.113.9');
  });

  it('logs a rejected token without the token itself', async () => {
    verifyIdToken.mockRejectedValue(new Error('jwt expired'));

    await call('/api/holidays', { authorization: 'Bearer secret-token-value' });

    const line = lastLine(warn);
    expect(line).toMatchObject({
      message: 'Token rejected',
      detail: { path: '/api/holidays', reason: 'jwt expired' },
    });
    expect(JSON.stringify(line)).not.toContain('secret-token-value');
  });

  it('notes a request that has no token at the quieter info level', async () => {
    await call('/api/holidays');

    expect(lastLine(info)).toMatchObject({
      level: 'info',
      message: 'Request without a bearer token',
    });
    expect(warn).not.toHaveBeenCalled();
  });
});
