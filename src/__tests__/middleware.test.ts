/** @jest-environment node */
import { NextRequest } from 'next/server';

const verifyIdToken = jest.fn();
jest.mock('@/lib/verifyAuth0Token', () => ({
  verifyIdToken: (...a: unknown[]) => verifyIdToken(...a),
}));

import { middleware } from '../middleware';

const call = (path: string, headers: Record<string, string> = {}) =>
  middleware(new NextRequest(`http://localhost${path}`, { headers }));

beforeEach(() => {
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
});
