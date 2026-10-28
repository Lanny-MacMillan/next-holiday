/** @jest-environment node */
import { NextRequest } from 'next/server';

const getCurrentUser = jest.fn();
jest.mock('@/lib/auth', () => ({
  getCurrentUser: (...a: unknown[]) => getCurrentUser(...a),
}));

const db = {
  invite: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  share: { findUnique: jest.fn(), delete: jest.fn() },
  shareMember: { findUnique: jest.fn(), create: jest.fn() },
  user: { findUnique: jest.fn(), findFirst: jest.fn() },
};
jest.mock('@/lib/prisma', () => ({ prisma: db }));
jest.mock('@/lib/realTimeNotifications', () => ({
  broadcastInvite: jest.fn().mockResolvedValue(undefined),
}));

import { GET, POST } from '@/app/api/invites/route';
import { POST as acceptInvite } from '@/app/api/invites/[inviteId]/accept/route';
import { POST as declineInvite } from '@/app/api/invites/[inviteId]/decline/route';
import { POST as dismissInvite } from '@/app/api/invites/[inviteId]/dismiss/route';

const me = { id: 'me-id', auth0Sub: 'auth0|me', email: 'me@x.com', name: 'Me' };
const other = { id: 'other-id', auth0Sub: 'auth0|other', email: 'o@x.com' };

const req = (url: string, body?: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method: body ? 'POST' : 'GET',
    body: body ? JSON.stringify(body) : undefined,
  });
const params = (inviteId: string) => ({ params: Promise.resolve({ inviteId }) });

beforeEach(() => {
  jest.clearAllMocks();
  getCurrentUser.mockResolvedValue(me);
});

describe('POST /api/invites', () => {
  const body = { shareId: 's1', holidayKey: 'christmas', toEmail: 'new@x.com' };

  it('401 when not authenticated', async () => {
    getCurrentUser.mockResolvedValue(null);
    expect((await POST(req('/api/invites', body))).status).toBe(401);
  });

  it('403 when the body claims to be another user', async () => {
    const res = await POST(
      req('/api/invites', { ...body, fromUserId: other.auth0Sub }),
    );
    expect(res.status).toBe(403);
    expect(db.invite.create).not.toHaveBeenCalled();
  });

  it('403 when the caller is neither owner nor member of the share', async () => {
    db.share.findUnique.mockResolvedValue({
      id: 's1',
      ownerUserId: other.id,
      members: [],
    });
    const res = await POST(req('/api/invites', body));
    expect(res.status).toBe(403);
    expect(db.invite.create).not.toHaveBeenCalled();
  });

  it('creates the invite as the authenticated user when they own the share', async () => {
    db.share.findUnique.mockResolvedValue({
      id: 's1',
      ownerUserId: me.id,
      members: [],
    });
    db.invite.findFirst.mockResolvedValue(null);
    db.user.findFirst.mockResolvedValue(null);
    db.invite.create.mockResolvedValue({ id: 'i1' });
    const res = await POST(
      req('/api/invites', { ...body, fromUserId: me.auth0Sub }),
    );
    expect(res.status).toBe(200);
    expect(db.invite.create.mock.calls[0][0].data.fromUserId).toBe(me.id);
  });
});

describe('GET /api/invites', () => {
  it('401 when not authenticated', async () => {
    getCurrentUser.mockResolvedValue(null);
    expect((await GET(req('/api/invites?inbox=1'))).status).toBe(401);
  });

  it("403 when asking for someone else's invites", async () => {
    const res = await GET(req(`/api/invites?inbox=1&userId=${other.auth0Sub}`));
    expect(res.status).toBe(403);
    expect(db.invite.findMany).not.toHaveBeenCalled();
  });

  it("always queries the authenticated user's own invites", async () => {
    db.user.findUnique.mockResolvedValue(me);
    db.invite.findMany.mockResolvedValue([]);
    const res = await GET(req(`/api/invites?inbox=1&userId=${me.auth0Sub}`));
    expect(res.status).toBe(200);
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { auth0Sub: me.auth0Sub },
    });
  });
});

describe('invite actions', () => {
  const pending = {
    id: 'i1',
    status: 'pending',
    shareId: 's1',
    fromUserId: other.id,
  };

  describe('accept', () => {
    it('401 when not authenticated', async () => {
      getCurrentUser.mockResolvedValue(null);
      expect((await acceptInvite(req('/x', {}), params('i1'))).status).toBe(401);
    });

    it('403 when the invite was addressed to someone else', async () => {
      db.invite.findUnique.mockResolvedValue({
        ...pending,
        toUserId: 'someone-else',
        toEmail: null,
      });
      const res = await acceptInvite(req('/x', {}), params('i1'));
      expect(res.status).toBe(403);
      expect(db.invite.update).not.toHaveBeenCalled();
      expect(db.shareMember.create).not.toHaveBeenCalled();
    });
  });

  describe('decline', () => {
    it('401 when not authenticated', async () => {
      getCurrentUser.mockResolvedValue(null);
      expect((await declineInvite(req('/x', {}), params('i1'))).status).toBe(401);
    });

    it('403 when the invite was addressed to someone else', async () => {
      db.invite.findUnique.mockResolvedValue({
        ...pending,
        toUserId: 'someone-else',
        toEmail: null,
        share: null,
      });
      const res = await declineInvite(req('/x', {}), params('i1'));
      expect(res.status).toBe(403);
      expect(db.invite.update).not.toHaveBeenCalled();
    });

    it('lets the recipient (matched by email, case-insensitive) decline', async () => {
      db.invite.findUnique.mockResolvedValue({
        ...pending,
        toUserId: null,
        toEmail: 'ME@X.COM',
        share: null,
      });
      db.invite.update.mockResolvedValue({ id: 'i1', status: 'declined' });
      expect((await declineInvite(req('/x', {}), params('i1'))).status).toBe(200);
    });
  });

  describe('dismiss', () => {
    it('401 when not authenticated', async () => {
      getCurrentUser.mockResolvedValue(null);
      expect((await dismissInvite(req('/x', {}), params('i1'))).status).toBe(401);
    });

    it('403 when the caller did not send the invite', async () => {
      db.invite.findUnique.mockResolvedValue({ ...pending, fromUserId: other.id });
      const res = await dismissInvite(req('/x', {}), params('i1'));
      expect(res.status).toBe(403);
      expect(db.invite.update).not.toHaveBeenCalled();
    });

    it('lets the sender dismiss', async () => {
      db.invite.findUnique.mockResolvedValue({ ...pending, fromUserId: me.id });
      db.invite.update.mockResolvedValue({ id: 'i1' });
      expect((await dismissInvite(req('/x', {}), params('i1'))).status).toBe(200);
    });
  });
});
