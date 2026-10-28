/** @jest-environment node */
import { NextRequest } from 'next/server';

const getCurrentUser = jest.fn();
jest.mock('@/lib/auth', () => ({
  getCurrentUser: (...a: unknown[]) => getCurrentUser(...a),
}));

const db = {
  user: { findUnique: jest.fn() },
  account: { findFirst: jest.fn() },
  holiday: { findFirst: jest.fn() },
  share: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  shareMember: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
};
jest.mock('@/lib/prisma', () => ({ prisma: db }));

const cleanupUserShareData = jest.fn();
jest.mock('@/lib/server/shareCleanup', () => ({
  cleanupUserShareData: (...a: unknown[]) => cleanupUserShareData(...a),
}));

import { GET, POST } from '@/app/api/shares/route';
import {
  DELETE as removeMember,
  POST as addMember,
} from '@/app/api/shares/[shareId]/members/route';

const me = { id: 'me-id', auth0Sub: 'auth0|me', email: 'me@x.com' };
const other = { id: 'other-id', auth0Sub: 'auth0|other' };
const third = { id: 'third-id', auth0Sub: 'auth0|third' };

const req = (url: string, method = 'GET', body?: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
const params = (shareId = 's1') => ({ params: Promise.resolve({ shareId }) });

beforeEach(() => {
  jest.clearAllMocks();
  getCurrentUser.mockResolvedValue(me);
});

describe('/api/shares', () => {
  it('POST 401 when unauthenticated', async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await POST(req('/api/shares', 'POST', { holidayKey: 'christmas' }));
    expect(res.status).toBe(401);
  });

  it('POST 403 when creating a share on behalf of another user', async () => {
    const res = await POST(
      req('/api/shares', 'POST', {
        holidayKey: 'christmas',
        ownerUserId: other.auth0Sub,
      }),
    );
    expect(res.status).toBe(403);
    expect(db.share.create).not.toHaveBeenCalled();
  });

  it('POST scopes the holiday lookup to the authenticated user', async () => {
    db.user.findUnique.mockResolvedValue(me);
    db.account.findFirst.mockResolvedValue(null);
    await POST(
      req('/api/shares', 'POST', {
        holidayKey: 'christmas',
        ownerUserId: me.auth0Sub,
      }),
    );
    expect(db.account.findFirst).toHaveBeenCalledWith({
      where: { ownerUserId: me.id },
    });
  });

  it('GET 401 when unauthenticated', async () => {
    getCurrentUser.mockResolvedValue(null);
    expect((await GET(req('/api/shares?userId=x'))).status).toBe(401);
  });

  it("GET 403 when asking for another user's shares", async () => {
    const res = await GET(req(`/api/shares?userId=${other.auth0Sub}`));
    expect(res.status).toBe(403);
    expect(db.share.findMany).not.toHaveBeenCalled();
  });
});

describe('/api/shares/[shareId]/members', () => {
  describe('POST (add member)', () => {
    it('401 when unauthenticated', async () => {
      getCurrentUser.mockResolvedValue(null);
      const res = await addMember(
        req('/x', 'POST', { userId: third.auth0Sub }),
        params(),
      );
      expect(res.status).toBe(401);
    });

    it('403 when the caller is not the share owner', async () => {
      db.user.findUnique.mockResolvedValue(third);
      db.share.findUnique.mockResolvedValue({ id: 's1', ownerUserId: other.id });
      const res = await addMember(
        req('/x', 'POST', { userId: third.auth0Sub }),
        params(),
      );
      expect(res.status).toBe(403);
      expect(db.shareMember.create).not.toHaveBeenCalled();
    });

    it('lets the share owner add a member', async () => {
      db.user.findUnique.mockResolvedValue(third);
      db.share.findUnique.mockResolvedValue({
        id: 's1',
        ownerUserId: me.id,
        holiday: { account: { ownerUserId: me.id } },
        members: [{ userId: me.id }],
      });
      db.shareMember.findUnique.mockResolvedValue(null);
      await addMember(req('/x', 'POST', { userId: third.auth0Sub }), params());
      expect(db.shareMember.create).toHaveBeenCalledWith({
        data: { shareId: 's1', userId: third.id },
      });
    });
  });

  describe('DELETE (remove / leave)', () => {
    const share = (ownerUserId: string) => ({ id: 's1', ownerUserId, members: [] });

    it('401 when unauthenticated', async () => {
      getCurrentUser.mockResolvedValue(null);
      const res = await removeMember(
        req(`/x?userId=${third.auth0Sub}`, 'DELETE'),
        params(),
      );
      expect(res.status).toBe(401);
    });

    it('403 when a plain member tries to remove someone else', async () => {
      db.user.findUnique.mockResolvedValue(third);
      db.share.findUnique.mockResolvedValue(share(other.id));
      const res = await removeMember(
        req(`/x?userId=${third.auth0Sub}`, 'DELETE'),
        params(),
      );
      expect(res.status).toBe(403);
      expect(db.shareMember.delete).not.toHaveBeenCalled();
      expect(cleanupUserShareData).not.toHaveBeenCalled();
    });

    it('lets a member remove themselves and runs cleanup directly (no HTTP call)', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch');
      db.user.findUnique.mockResolvedValue(me);
      db.share.findUnique.mockResolvedValue(share(other.id));
      db.shareMember.findUnique.mockResolvedValue({ shareId: 's1', userId: me.id });
      await removeMember(req(`/x?userId=${me.auth0Sub}`, 'DELETE'), params());
      expect(db.shareMember.delete).toHaveBeenCalled();
      expect(cleanupUserShareData).toHaveBeenCalledWith('s1', me.id);
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });

    it('lets the share owner remove another member', async () => {
      db.user.findUnique.mockResolvedValue(third);
      db.share.findUnique.mockResolvedValue(share(me.id));
      db.shareMember.findUnique.mockResolvedValue({
        shareId: 's1',
        userId: third.id,
      });
      await removeMember(req(`/x?userId=${third.auth0Sub}`, 'DELETE'), params());
      expect(db.shareMember.delete).toHaveBeenCalled();
    });
  });
});
