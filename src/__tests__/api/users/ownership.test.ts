/** @jest-environment node */
import { NextRequest } from 'next/server';

const me = { id: 'me-id', auth0Sub: 'auth0|me', email: 'me@x.com', name: 'Me' };
const claims = {
  sub: 'auth0|me',
  email: 'verified@x.com',
  name: 'Me',
  picture: 'p.png',
};

const getCurrentUser = jest.fn();
const getVerifiedClaims = jest.fn();
jest.mock('@/lib/auth', () => ({
  getCurrentUser: (...a: unknown[]) => getCurrentUser(...a),
  getVerifiedClaims: (...a: unknown[]) => getVerifiedClaims(...a),
  requireAuth: jest.fn(),
}));

const db = {
  user: { findUnique: jest.fn(), update: jest.fn(), upsert: jest.fn() },
  userPreferences: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn() },
  share: { findMany: jest.fn() },
  shareMember: { findMany: jest.fn(), delete: jest.fn() },
};
jest.mock('@/lib/prisma', () => ({ prisma: db }));

const addUserToDb = jest.fn();
jest.mock('@/lib/server/userActions', () => ({
  addUserToDb: (...a: unknown[]) => addUserToDb(...a),
}));

import * as usersRoute from '@/app/api/users/route';
import { GET as bySub } from '@/app/api/users/by-auth0-sub/route';
import { GET as meGet, PUT as mePut } from '@/app/api/users/me/route';
import {
  GET as prefsGet,
  PUT as prefsPut,
} from '@/app/api/users/me/preferences/route';
import { POST as cancelCleanup } from '@/app/api/users/cancel-subscription-cleanup/route';
import { POST as setup } from '@/app/api/users/setup/route';

const req = (
  url: string,
  method = 'GET',
  body?: unknown,
  headers: Record<string, string> = {},
) =>
  new NextRequest(`http://localhost${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

beforeEach(() => {
  jest.clearAllMocks();
  getCurrentUser.mockResolvedValue(me);
  getVerifiedClaims.mockResolvedValue(claims);
});

describe('GET /api/users (user directory)', () => {
  it('no longer exists, so one user cannot list everyone', () => {
    expect((usersRoute as Record<string, unknown>).GET).toBeUndefined();
  });
});

describe('POST /api/users (login sync)', () => {
  const body = { auth0Sub: 'auth0|me', email: 'attacker@x.com', name: 'Custom' };

  it('401 without a token', async () => {
    getVerifiedClaims.mockResolvedValue(null);
    expect((await usersRoute.POST(req('/api/users', 'POST', body))).status).toBe(
      401,
    );
  });

  it('403 when the body targets a different sub', async () => {
    const res = await usersRoute.POST(
      req('/api/users', 'POST', { ...body, auth0Sub: 'auth0|victim' }),
    );
    expect(res.status).toBe(403);
    expect(db.user.upsert).not.toHaveBeenCalled();
  });

  it('stores the token email/picture, not the body email', async () => {
    db.user.upsert.mockResolvedValue({ id: 'u1', auth0Sub: 'auth0|me' });
    db.userPreferences.findUnique.mockResolvedValue({});
    await usersRoute.POST(req('/api/users', 'POST', body));
    const arg = db.user.upsert.mock.calls[0][0];
    expect(arg.where).toEqual({ auth0Sub: 'auth0|me' });
    expect(arg.create.email).toBe('verified@x.com');
    expect(arg.create.picture).toBe('p.png');
    expect(arg.create.name).toBe('Custom');
  });
});

describe('POST /api/users/setup', () => {
  it('401 without a token', async () => {
    getVerifiedClaims.mockResolvedValue(null);
    const res = await setup(req('/x', 'POST', { auth0User: { sub: 'auth0|me' } }));
    expect(res.status).toBe(401);
  });

  it('403 when setting up a different user', async () => {
    const res = await setup(
      req('/x', 'POST', { auth0User: { sub: 'auth0|victim' } }),
    );
    expect(res.status).toBe(403);
    expect(addUserToDb).not.toHaveBeenCalled();
  });

  it('uses token claims for identity, email and picture', async () => {
    addUserToDb.mockResolvedValue({ success: true });
    await setup(
      req('/x', 'POST', {
        auth0User: { sub: 'auth0|me', email: 'evil@x.com', name: 'Custom' },
      }),
    );
    expect(addUserToDb).toHaveBeenCalledWith({
      sub: 'auth0|me',
      email: 'verified@x.com',
      name: 'Custom',
      picture: 'p.png',
    });
  });
});

describe('GET /api/users/by-auth0-sub', () => {
  it('401 when unauthenticated', async () => {
    getCurrentUser.mockResolvedValue(null);
    expect((await bySub(req('/x?sub=auth0|me'))).status).toBe(401);
  });

  it('403 when looking up someone else', async () => {
    expect((await bySub(req('/x?sub=auth0|victim'))).status).toBe(403);
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it('returns the caller when the sub matches', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'u1' });
    expect((await bySub(req('/x?sub=auth0|me'))).status).toBe(200);
    expect(db.user.findUnique.mock.calls[0][0].where).toEqual({
      auth0Sub: 'auth0|me',
    });
  });
});

describe('/api/users/me', () => {
  it('GET 401 when unauthenticated', async () => {
    getCurrentUser.mockResolvedValue(null);
    expect((await meGet(req('/x?auth0Sub=auth0|me'))).status).toBe(401);
  });

  it("GET 403 for another user's sub in the query", async () => {
    expect((await meGet(req('/x?auth0Sub=auth0|victim'))).status).toBe(403);
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it("GET 403 for another user's sub in the x-auth0-sub header", async () => {
    const res = await meGet(
      req('/x', 'GET', undefined, { 'x-auth0-sub': 'auth0|victim' }),
    );
    expect(res.status).toBe(403);
  });

  it("PUT 403 when updating someone else's profile", async () => {
    const res = await mePut(
      req('/x', 'PUT', { auth0Sub: 'auth0|victim', name: 'Hacked' }),
    );
    expect(res.status).toBe(403);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('PUT updates only the authenticated user, even if the body omits the sub', async () => {
    db.user.update.mockResolvedValue({ id: 'u1', auth0Sub: 'auth0|me' });
    await mePut(req('/x', 'PUT', { name: 'New' }));
    expect(db.user.update.mock.calls[0][0].where).toEqual({ auth0Sub: 'auth0|me' });
  });
});

describe('/api/users/me/preferences', () => {
  it("GET 403 for another user's sub", async () => {
    expect((await prefsGet(req('/x?auth0Sub=auth0|victim'))).status).toBe(403);
  });

  it("PUT 403 when updating another user's preferences", async () => {
    const res = await prefsPut(
      req('/x', 'PUT', { auth0Sub: 'auth0|victim', theme: 'dark' }),
    );
    expect(res.status).toBe(403);
    expect(db.userPreferences.update).not.toHaveBeenCalled();
    expect(db.userPreferences.upsert).not.toHaveBeenCalled();
  });
});

describe('POST /api/users/cancel-subscription-cleanup', () => {
  it('401 when unauthenticated', async () => {
    getCurrentUser.mockResolvedValue(null);
    expect(
      (await cancelCleanup(req('/x', 'POST', { auth0Sub: 'auth0|me' }))).status,
    ).toBe(401);
  });

  it("403 when targeting another user's account", async () => {
    const res = await cancelCleanup(req('/x', 'POST', { auth0Sub: 'auth0|victim' }));
    expect(res.status).toBe(403);
    expect(db.shareMember.delete).not.toHaveBeenCalled();
  });
});
