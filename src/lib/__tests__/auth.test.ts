/** @jest-environment node */
import { NextRequest } from 'next/server';

const findUnique = jest.fn();
jest.mock('../prisma', () => ({
  prisma: { user: { findUnique: (...a: unknown[]) => findUnique(...a) } },
}));

const verifyIdToken = jest.fn();
jest.mock('../verifyAuth0Token', () => ({
  verifyIdToken: (...a: unknown[]) => verifyIdToken(...a),
}));

import { getCurrentUser } from '../auth';

const dbUser = { id: 'u1', auth0Sub: 'auth0|victim', email: 'v@x.com' };

function req(headers: Record<string, string> = {}, url = 'http://localhost/api/x') {
  return new NextRequest(url, { headers });
}

const forged = JSON.stringify({ sub: 'auth0|victim' });

beforeEach(() => {
  findUnique.mockReset().mockResolvedValue(dbUser);
  verifyIdToken.mockReset();
  delete process.env.ALLOW_LEGACY_TEST_USER_AUTH;
});

describe('getCurrentUser', () => {
  it('ignores a forged x-test-user header by default', async () => {
    expect(await getCurrentUser(req({ 'x-test-user': forged }))).toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('ignores a forged ?testUser= param by default', async () => {
    const url = `http://localhost/api/x?testUser=${encodeURIComponent(forged)}`;
    expect(await getCurrentUser(req({}, url))).toBeNull();
  });

  it('returns null with no credentials', async () => {
    expect(await getCurrentUser(req())).toBeNull();
  });

  it('authenticates a valid bearer token and looks up the verified sub', async () => {
    verifyIdToken.mockResolvedValue({ sub: 'auth0|victim' });
    const user = await getCurrentUser(req({ authorization: 'Bearer good.token' }));
    expect(verifyIdToken).toHaveBeenCalledWith('good.token');
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { auth0Sub: 'auth0|victim' } }),
    );
    expect(user?.auth0Sub).toBe('auth0|victim');
  });

  describe('verifiedEmail', () => {
    const asUser = (claims: Record<string, unknown>) =>
      verifyIdToken.mockResolvedValue({ sub: 'auth0|victim', ...claims });
    const bearer = () => req({ authorization: 'Bearer good.token' });

    it('is the token email when the token says it is verified', async () => {
      asUser({ email: 'real@x.com', emailVerified: true });
      expect((await getCurrentUser(bearer()))?.verifiedEmail).toBe('real@x.com');
    });

    it('is null when the email is not verified', async () => {
      asUser({ email: 'real@x.com', emailVerified: false });
      expect((await getCurrentUser(bearer()))?.verifiedEmail).toBeNull();
    });

    it('is null when the token has no email', async () => {
      asUser({ emailVerified: true });
      expect((await getCurrentUser(bearer()))?.verifiedEmail).toBeNull();
    });

    it('ignores the database email, which is not proof of ownership', async () => {
      asUser({ email: 'real@x.com', emailVerified: false });
      findUnique.mockResolvedValue({ ...dbUser, email: 'victim@x.com' });
      expect((await getCurrentUser(bearer()))?.verifiedEmail).toBeNull();
    });

    it('is null on the legacy header path', async () => {
      process.env.ALLOW_LEGACY_TEST_USER_AUTH = 'true';
      const legacy = JSON.stringify({ sub: 'auth0|victim', email: 'v@x.com' });
      const user = await getCurrentUser(req({ 'x-test-user': legacy }));
      expect(user?.verifiedEmail).toBeNull();
    });
  });

  it('rejects an invalid bearer token', async () => {
    verifyIdToken.mockRejectedValue(new Error('bad signature'));
    expect(await getCurrentUser(req({ authorization: 'Bearer bad' }))).toBeNull();
  });

  it('does not fall back to the legacy header when a bearer token fails, even with the flag on', async () => {
    process.env.ALLOW_LEGACY_TEST_USER_AUTH = 'true';
    verifyIdToken.mockRejectedValue(new Error('bad signature'));
    const result = await getCurrentUser(
      req({ authorization: 'Bearer bad', 'x-test-user': forged }),
    );
    expect(result).toBeNull();
  });

  it('rejects a malformed Authorization header', async () => {
    expect(await getCurrentUser(req({ authorization: 'Basic abc' }))).toBeNull();
  });

  it('accepts the legacy header only when the flag is explicitly on', async () => {
    process.env.ALLOW_LEGACY_TEST_USER_AUTH = 'true';
    const user = await getCurrentUser(req({ 'x-test-user': forged }));
    expect(user?.auth0Sub).toBe('auth0|victim');
  });
});
