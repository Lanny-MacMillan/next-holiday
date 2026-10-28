/** @jest-environment node */
const requireAuth = jest.fn();
const getCurrentUser = jest.fn();
jest.mock('@/lib/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuth(...a),
  getCurrentUser: (...a: unknown[]) => getCurrentUser(...a),
  getVerifiedClaims: jest.fn(),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
}));

import {
  apiRequest,
  prismaMock as db,
  readJson,
  resetPrismaMock,
} from '@/__tests__/support/api';
import { GET as getAccount } from '@/app/api/users/me/account/route';
import {
  GET as getNotifPrefs,
  PUT as putNotifPrefs,
} from '@/app/api/users/me/notification-preferences/route';
import {
  GET as getPrefs,
  PUT as putPrefs,
} from '@/app/api/users/me/preferences/route';
import { DEFAULT_USER_PREFERENCES } from '@/lib/constants/userPreferences';

const me = { id: 'me-id', auth0Sub: 'auth0|me', name: 'Me', email: 'me@x.com' };

beforeEach(() => {
  resetPrismaMock();
  requireAuth.mockReset().mockResolvedValue(me);
  getCurrentUser.mockReset().mockResolvedValue(me);
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('GET /api/users/me/account', () => {
  const get = async () =>
    readJson(await getAccount(apiRequest('/api/users/me/account')));

  it('returns the account the user already belongs to', async () => {
    db.account.findFirst.mockResolvedValue({ id: 'acc1' });
    const { status, body } = await get();

    expect(status).toBe(200);
    expect(body.data).toEqual({ id: 'acc1' });
    expect(db.accountMember.create).not.toHaveBeenCalled();
  });

  it('creates an owned account and membership for a first-time user', async () => {
    db.account.findFirst.mockResolvedValue(null);
    db.account.create.mockImplementation(
      async ({ data }: { data: { id: string } }) => ({ id: data.id }),
    );
    const { status, body } = await get();

    expect(status).toBe(200);
    const created = db.account.create.mock.calls[0][0].data;
    expect(created).toMatchObject({ name: "Me's Account", ownerUserId: 'me-id' });
    expect(db.accountMember.create).toHaveBeenCalledWith({
      data: { accountId: body.data.id, userId: 'me-id', role: 'owner' },
    });
  });

  it('names the account after the email, then a default, when there is no name', async () => {
    db.account.findFirst.mockResolvedValue(null);
    db.account.create.mockResolvedValue({ id: 'a' });
    requireAuth.mockResolvedValue({ ...me, name: '' });
    await get();
    expect(db.account.create.mock.calls[0][0].data.name).toBe("me@x.com's Account");

    requireAuth.mockResolvedValue({ ...me, name: '', email: '' });
    await get();
    expect(db.account.create.mock.calls[1][0].data.name).toBe("My Family's Account");
  });

  it('is 500 when the database fails', async () => {
    db.account.findFirst.mockRejectedValue(new Error('db down'));
    expect((await get()).status).toBe(500);
  });
});

describe('/api/users/me/notification-preferences', () => {
  const defaults = {
    assignmentNotifications: true,
    completionNotifications: true,
    inviteNotifications: true,
    emailNotifications: false,
    digestFrequency: 'immediate',
  };

  describe('GET', () => {
    const get = async () => {
      const res = await getNotifPrefs(
        apiRequest('/api/users/me/notification-preferences'),
      );
      return { status: res.status, body: await res.json() };
    };

    it('returns stored preferences', async () => {
      db.notificationPreferences.findUnique.mockResolvedValue({
        userId: 'me-id',
        emailNotifications: true,
      });
      const { body } = await get();
      expect(body).toEqual({ userId: 'me-id', emailNotifications: true });
      expect(db.notificationPreferences.create).not.toHaveBeenCalled();
    });

    it('creates the defaults on first read', async () => {
      db.notificationPreferences.findUnique.mockResolvedValue(null);
      db.notificationPreferences.create.mockImplementation(
        async ({ data }: { data: unknown }) => data,
      );
      const { body } = await get();
      expect(body).toEqual({ userId: 'me-id', ...defaults });
    });

    it('is 500 when the database fails', async () => {
      db.notificationPreferences.findUnique.mockRejectedValue(new Error('db down'));
      expect((await get()).status).toBe(500);
    });
  });

  describe('PUT', () => {
    const put = async (body: unknown) => {
      const res = await putNotifPrefs(
        apiRequest('/api/users/me/notification-preferences', 'PUT', body),
      );
      return { status: res.status, body: await res.json() };
    };

    beforeEach(() =>
      db.notificationPreferences.upsert.mockImplementation(
        async (arg: { update: unknown }) => arg,
      ),
    );

    it('upserts only the whitelisted fields', async () => {
      await put({
        emailNotifications: true,
        digestFrequency: 'daily',
        userId: 'someone-else',
        admin: true,
      });

      const { where, update, create } =
        db.notificationPreferences.upsert.mock.calls[0][0];
      expect(where).toEqual({ userId: 'me-id' });
      expect(update).toMatchObject({
        emailNotifications: true,
        digestFrequency: 'daily',
      });
      expect(update).not.toHaveProperty('admin');
      expect(update).not.toHaveProperty('userId');
      expect(create).toMatchObject({
        ...defaults,
        userId: 'me-id',
        emailNotifications: true,
        digestFrequency: 'daily',
      });
    });

    it('is 500 when the database fails', async () => {
      db.notificationPreferences.upsert.mockRejectedValue(new Error('db down'));
      expect((await put({})).status).toBe(500);
    });
  });

  it('both handlers are 500 when signed out (requireAuth throws and is not mapped)', async () => {
    requireAuth.mockRejectedValue(new Error('Authentication required'));
    expect((await getNotifPrefs(apiRequest('/x'))).status).toBe(500);
    expect((await putNotifPrefs(apiRequest('/x', 'PUT', {}))).status).toBe(500);
  });
});

describe('/api/users/me/preferences', () => {
  describe('GET', () => {
    const get = async (query = '', headers?: Record<string, string>) => {
      const req = apiRequest(`/api/users/me/preferences${query}`);
      if (headers)
        for (const [k, v] of Object.entries(headers)) req.headers.set(k, v);
      const res = await getPrefs(req);
      return { status: res.status, body: await res.json() };
    };

    beforeEach(() => db.user.findUnique.mockResolvedValue({ id: 'db-me' }));

    it('returns the caller’s stored preferences', async () => {
      db.userPreferences.findUnique.mockResolvedValue({ theme: 'dark' });
      const { body } = await get();
      expect(body).toEqual({ theme: 'dark' });
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { auth0Sub: 'auth0|me' },
      });
      expect(db.userPreferences.findUnique).toHaveBeenCalledWith({
        where: { userId: 'db-me' },
      });
    });

    it('creates the defaults when none exist', async () => {
      db.userPreferences.findUnique.mockResolvedValue(null);
      db.userPreferences.create.mockImplementation(
        async ({ data }: { data: unknown }) => data,
      );
      const { body } = await get();
      expect(body).toEqual({ userId: 'db-me', ...DEFAULT_USER_PREFERENCES });
    });

    it('accepts the caller’s own id in the query', async () => {
      db.userPreferences.findUnique.mockResolvedValue({});
      expect((await get('?auth0Sub=auth0|me')).status).toBe(200);
    });

    it('refuses when the query or header names another user', async () => {
      expect((await get('?auth0Sub=auth0|other')).status).toBe(403);
      expect((await get('', { 'x-auth0-sub': 'auth0|other' })).status).toBe(403);
      expect(db.user.findUnique).not.toHaveBeenCalled();
    });

    it('is 404 for an unknown user, 401 signed out, 500 on db failure', async () => {
      db.user.findUnique.mockResolvedValue(null);
      expect((await get()).status).toBe(404);

      getCurrentUser.mockResolvedValue(null);
      expect((await get()).status).toBe(401);

      getCurrentUser.mockResolvedValue(me);
      db.user.findUnique.mockRejectedValue(new Error('db down'));
      expect((await get()).status).toBe(500);
    });
  });

  describe('PUT', () => {
    const put = async (body: unknown) => {
      const res = await putPrefs(
        apiRequest('/api/users/me/preferences', 'PUT', body),
      );
      return { status: res.status, body: await res.json() };
    };

    beforeEach(() => {
      db.user.findUnique.mockResolvedValue({ id: 'db-me' });
      db.userPreferences.upsert.mockImplementation(async (arg: unknown) => arg);
    });

    it('upserts only the whitelisted fields for the caller', async () => {
      await put({
        theme: 'dark',
        fontSize: 'large',
        role: 'admin',
        userId: 'x',
        auth0Sub: 'auth0|me',
      });

      const { where, update, create } = db.userPreferences.upsert.mock.calls[0][0];
      expect(where).toEqual({ userId: 'db-me' });
      expect(update).toMatchObject({ theme: 'dark', fontSize: 'large' });
      expect(update).not.toHaveProperty('role');
      expect(update).not.toHaveProperty('userId');
      expect(create).toMatchObject({
        ...DEFAULT_USER_PREFERENCES,
        userId: 'db-me',
        theme: 'dark',
        fontSize: 'large',
      });
    });

    it('refuses to update another user', async () => {
      expect((await put({ auth0Sub: 'auth0|other', theme: 'dark' })).status).toBe(
        403,
      );
      expect(db.userPreferences.upsert).not.toHaveBeenCalled();
    });

    it('is 404 for an unknown user, 401 signed out, 500 on db failure', async () => {
      db.user.findUnique.mockResolvedValue(null);
      expect((await put({})).status).toBe(404);

      getCurrentUser.mockResolvedValue(null);
      expect((await put({})).status).toBe(401);

      getCurrentUser.mockResolvedValue(me);
      db.user.findUnique.mockResolvedValue({ id: 'db-me' });
      db.userPreferences.upsert.mockRejectedValue(new Error('db down'));
      expect((await put({})).status).toBe(500);
    });
  });
});
