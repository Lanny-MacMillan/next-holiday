/** @jest-environment node */
import { NextRequest } from 'next/server';

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
