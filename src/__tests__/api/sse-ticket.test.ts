/** @jest-environment node */
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const getVerifiedClaims = jest.fn();
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
  getVerifiedClaims: (...a: unknown[]) => getVerifiedClaims(...a),
}));
jest.mock('@/lib/prisma', () => ({ prisma: {} }));

import { POST } from '@/app/api/sse-ticket/route';

const SECRET = 'shared-secret';
const post = (body?: unknown) =>
  new NextRequest('http://localhost/api/sse-ticket', {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
const verify = (ticket: string, secret = SECRET) =>
  jwtVerify(ticket, new TextEncoder().encode(secret), {
    audience: 'sse-stream',
    algorithms: ['HS256'],
  });

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SSE_API_SECRET = SECRET;
  getVerifiedClaims.mockResolvedValue({ sub: 'auth0|me', email: 'me@x.com' });
});

describe('POST /api/sse-ticket', () => {
  it('401 without a verified login', async () => {
    getVerifiedClaims.mockResolvedValue(null);
    const res = await POST(post());
    expect(res.status).toBe(401);
  });

  it('503 when the SSE secret is not configured', async () => {
    delete process.env.SSE_API_SECRET;
    const res = await POST(post());
    expect(res.status).toBe(503);
  });

  it('issues a ticket for the verified user that the SSE service can verify', async () => {
    const res = await POST(post());
    const { ticket, expiresIn } = await res.json();
    expect(res.status).toBe(200);
    expect(expiresIn).toBe(60);

    const { payload } = await verify(ticket);
    expect(payload.sub).toBe('auth0|me');
    expect(payload.aud).toBe('sse-stream');
  });

  it('expires within a minute', async () => {
    const { ticket } = await (await POST(post())).json();
    const { payload } = await verify(ticket);
    const lifetime = (payload.exp as number) - (payload.iat as number);
    expect(lifetime).toBeLessThanOrEqual(60);
  });

  it('ignores any user id in the request body', async () => {
    const { ticket } = await (await POST(post({ sub: 'auth0|victim' }))).json();
    expect((await verify(ticket)).payload.sub).toBe('auth0|me');
  });

  it('cannot be verified with a different secret', async () => {
    const { ticket } = await (await POST(post())).json();
    await expect(verify(ticket, 'some-other-secret')).rejects.toThrow();
  });
});
