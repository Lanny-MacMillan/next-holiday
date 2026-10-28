/** @jest-environment node */
import { NextRequest } from 'next/server';

jest.mock('../prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
}));
const verifyIdToken = jest.fn();
jest.mock('../verifyAuth0Token', () => ({
  verifyIdToken: (...a: unknown[]) => verifyIdToken(...a),
}));

import { prismaMock as db, resetPrismaMock } from '@/__tests__/support/api';
import {
  assertHolidayAccess,
  getCurrentUser,
  getVerifiedClaims,
  requireAuth,
} from '../auth';

const bearer = { authorization: 'Bearer good' };
const req = (
  headers: Record<string, string> = bearer,
  url = 'http://localhost/api/x',
) => new NextRequest(url, { headers });

beforeEach(() => {
  resetPrismaMock();
  verifyIdToken
    .mockReset()
    .mockResolvedValue({ sub: 'auth0|me', email: 'me@x.com', emailVerified: true });
  delete process.env.ALLOW_LEGACY_TEST_USER_AUTH;
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.ALLOW_LEGACY_TEST_USER_AUTH;
  jest.restoreAllMocks();
});

describe('getVerifiedClaims', () => {
  it('returns the claims without touching the database', async () => {
    verifyIdToken.mockResolvedValue({
      sub: 'auth0|me',
      email: 'me@x.com',
      name: 'Me',
      picture: 'p',
      emailVerified: true,
    });

    expect(await getVerifiedClaims(req())).toEqual({
      sub: 'auth0|me',
      email: 'me@x.com',
      name: 'Me',
      picture: 'p',
      emailVerified: true,
    });
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it('only counts an email as verified when the claim is exactly true', async () => {
    verifyIdToken.mockResolvedValue({ sub: 'auth0|me', emailVerified: 'yes' });
    expect((await getVerifiedClaims(req()))?.emailVerified).toBe(false);
  });

  it('is null without a valid token, or when the token has no subject', async () => {
    expect(await getVerifiedClaims(req({}))).toBeNull();

    verifyIdToken.mockRejectedValue(new Error('expired'));
    expect(await getVerifiedClaims(req())).toBeNull();

    verifyIdToken.mockResolvedValue({ email: 'x@x.com' });
    expect(await getVerifiedClaims(req())).toBeNull();
  });
});

describe('legacy test-user auth (flag on)', () => {
  beforeEach(() => {
    process.env.ALLOW_LEGACY_TEST_USER_AUTH = 'true';
    db.user.findUnique.mockResolvedValue({ id: 'u1', auth0Sub: 'auth0|legacy' });
  });

  it('fills in defaults for a sparse header', async () => {
    expect(await getVerifiedClaims(req({ 'x-test-user': '{}' }))).toMatchObject({
      sub: 'test-auth0-sub',
      email: 'test@example.com',
      name: 'Test User',
    });
  });

  it('reads the user from the header', async () => {
    const claims = await getVerifiedClaims(
      req({ 'x-test-user': JSON.stringify({ sub: 'auth0|legacy', name: 'L' }) }),
    );
    expect(claims).toMatchObject({ sub: 'auth0|legacy', name: 'L' });
  });

  it('reads the user from the testUser query param when there is no header', async () => {
    const url = `http://localhost/api/x?testUser=${encodeURIComponent(JSON.stringify({ sub: 'auth0|legacy' }))}`;
    expect((await getVerifiedClaims(req({}, url)))?.sub).toBe('auth0|legacy');
  });

  it('rejects an unparseable header or query param', async () => {
    expect(await getVerifiedClaims(req({ 'x-test-user': 'not json' }))).toBeNull();
    expect(
      await getVerifiedClaims(req({}, 'http://localhost/api/x?testUser=%7Bnope')),
    ).toBeNull();
  });
});

describe('getCurrentUser database handling', () => {
  it('returns null when the user is unknown and does not look like a test user', async () => {
    db.user.findUnique.mockResolvedValue(null);
    expect(await getCurrentUser(req())).toBeNull();
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it.each(['auth0|test-123', 'google-oauth2|999'])(
    'creates a missing %s on first sight',
    async sub => {
      verifyIdToken.mockResolvedValue({ sub, name: 'T' });
      db.user.findUnique.mockResolvedValue(null);
      db.user.create.mockImplementation(
        async ({ data }: { data: Record<string, unknown> }) => ({
          id: 'new',
          ...data,
        }),
      );

      const user = await getCurrentUser(req());

      expect(user).toMatchObject({
        id: 'new',
        auth0Sub: sub,
        name: 'T',
        verifiedEmail: null,
      });
      expect(db.user.create.mock.calls[0][0].data.email).toBe('test@example.com');
    },
  );

  it('returns null when that creation fails', async () => {
    verifyIdToken.mockResolvedValue({ sub: 'auth0|test-1' });
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockRejectedValue(new Error('duplicate'));
    expect(await getCurrentUser(req())).toBeNull();
  });

  it('returns null when the lookup fails', async () => {
    db.user.findUnique.mockRejectedValue(new Error('db down'));
    expect(await getCurrentUser(req())).toBeNull();
  });
});

describe('requireAuth', () => {
  it('returns the user', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'u1', auth0Sub: 'auth0|me' });
    expect(await requireAuth(req())).toMatchObject({
      id: 'u1',
      verifiedEmail: 'me@x.com',
    });
  });

  it('throws when nobody is signed in', async () => {
    await expect(requireAuth(req({}))).rejects.toThrow('Authentication required');
  });
});

describe('assertHolidayAccess', () => {
  it('allows access through the account, a share membership or share ownership', async () => {
    db.holiday.findFirst.mockResolvedValue({ id: 'h1' });
    expect(await assertHolidayAccess('h1', 'u1')).toBeNull();

    const { where } = db.holiday.findFirst.mock.calls[0][0];
    expect(where.id).toBe('h1');
    expect(where.OR).toEqual([
      { account: { members: { some: { userId: 'u1' } } } },
      { shares: { members: { some: { userId: 'u1' } } } },
      { shares: { ownerUserId: 'u1' } },
    ]);
  });

  it('answers 403 when none of those hold', async () => {
    db.holiday.findFirst.mockResolvedValue(null);
    const res = await assertHolidayAccess('h1', 'u1');
    expect(res?.status).toBe(403);
    expect(await res?.json()).toEqual({ success: false, error: 'Forbidden' });
  });

  it('answers 500 when the check fails', async () => {
    db.holiday.findFirst.mockRejectedValue(new Error('db down'));
    expect((await assertHolidayAccess('h1', 'u1'))?.status).toBe(500);
  });
});
