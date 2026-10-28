/** @jest-environment node */
const requireAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuth(...a),
  getCurrentUser: jest.fn(),
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
import { DELETE, GET, PATCH } from '@/app/api/notifications/route';

const me = { id: 'me-id', auth0Sub: 'auth0|me', email: 'me@x.com' };

beforeEach(() => {
  resetPrismaMock();
  requireAuth.mockReset().mockResolvedValue(me);
  db.notification.findMany.mockResolvedValue([]);
  db.invite.findMany.mockResolvedValue([]);
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('GET /api/notifications', () => {
  const get = async (query = '') =>
    readJson(await GET(apiRequest(`/api/notifications${query}`)));

  it('shows only the caller’s undismissed notifications, capped at 50', async () => {
    await get();
    const query = db.notification.findMany.mock.calls[0][0];
    expect(query.where).toEqual({ userId: 'me-id', isDismissed: false });
    expect(query).toMatchObject({ take: 50, orderBy: { createdAt: 'desc' } });
  });

  it('can narrow to unread', async () => {
    await get('?unread=true');
    expect(db.notification.findMany.mock.calls[0][0].where).toMatchObject({
      isRead: false,
    });
  });

  it('merges pending invites in as notifications, newest first', async () => {
    db.notification.findMany.mockResolvedValue([
      { id: 'n-old', createdAt: new Date('2025-01-01T00:00:00Z') },
      { id: 'n-new', createdAt: new Date('2025-03-01T00:00:00Z') },
    ]);
    db.invite.findMany.mockResolvedValue([
      {
        id: 'i1',
        fromUserId: 'u2',
        message: 'join us',
        createdAt: new Date('2025-02-01T00:00:00Z'),
        fromUser: { name: 'Ann', email: 'a@x.com' },
        share: {
          holidayId: 'h1',
          holiday: { id: 'h1', name: 'Our Xmas', holidayType: 'Christmas' },
        },
      },
    ]);
    const { body } = await get();

    expect(body.data.map((n: { id: string }) => n.id)).toEqual([
      'n-new',
      'invite-i1',
      'n-old',
    ]);
    expect(body.data[1]).toMatchObject({
      type: 'invite_received',
      isInvite: true,
      isRead: false,
      entityId: 'i1',
      holidayId: 'h1',
      inviteMessage: 'join us',
      message: 'Ann invited you to collaborate on Our Xmas',
    });
    expect(body.data[0].isInvite).toBe(false);
  });

  it('names the sender by email when they have no name', async () => {
    db.invite.findMany.mockResolvedValue([
      {
        id: 'i1',
        createdAt: new Date(),
        fromUser: { name: null, email: 'a@x.com' },
        share: { holiday: { name: 'Easter' } },
      },
    ]);
    expect((await get()).body.data[0].message).toBe(
      'a@x.com invited you to collaborate on Easter',
    );
  });

  it('is 500 when the database fails', async () => {
    db.notification.findMany.mockRejectedValue(new Error('db down'));
    expect((await get()).status).toBe(500);
  });
});

describe('PATCH /api/notifications', () => {
  const patch = async (body: unknown) =>
    readJson(await PATCH(apiRequest('/api/notifications', 'PATCH', body)));

  it('marks the caller’s own notifications as read', async () => {
    const { status, body } = await patch({
      notificationIds: ['n1', 'n2'],
      action: 'read',
    });

    expect(status).toBe(200);
    expect(body.data).toEqual({ success: true, updated: 2, invitesHandled: 0 });
    const { where, data } = db.notification.updateMany.mock.calls[0][0];
    expect(where).toEqual({ id: { in: ['n1', 'n2'] }, userId: 'me-id' });
    expect(data).toMatchObject({ isRead: true });
    expect(data.readAt).toBeInstanceOf(Date);
  });

  it('dismisses', async () => {
    await patch({ notificationIds: ['n1'], action: 'dismiss' });
    const { data } = db.notification.updateMany.mock.calls[0][0];
    expect(data).toMatchObject({ isDismissed: true });
    expect(data.dismissedAt).toBeInstanceOf(Date);
  });

  it('deletes, still limited to the caller’s own notifications', async () => {
    await patch({ notificationIds: ['n1'], action: 'delete' });
    expect(db.notification.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['n1'] }, userId: 'me-id' },
    });
    expect(db.notification.updateMany).not.toHaveBeenCalled();
  });

  it('counts invite ids separately and never writes them to the notifications table', async () => {
    const { body } = await patch({
      notificationIds: ['invite-i1', 'invite-i2'],
      action: 'dismiss',
    });

    expect(body.data).toEqual({ success: true, updated: 0, invitesHandled: 2 });
    expect(db.notification.updateMany).not.toHaveBeenCalled();
  });

  it('ignores ids that are not strings', async () => {
    const { body } = await patch({
      notificationIds: ['n1', null, 5, undefined],
      action: 'read',
    });
    expect(body.data.updated).toBe(1);
    expect(db.notification.updateMany.mock.calls[0][0].where.id).toEqual({
      in: ['n1'],
    });
  });

  it.each([
    ['no ids', { action: 'read' }],
    ['ids that are not an array', { notificationIds: 'n1', action: 'read' }],
    ['no action', { notificationIds: ['n1'] }],
    ['an unknown action', { notificationIds: ['n1'], action: 'archive' }],
    ['no usable ids', { notificationIds: [null, 3], action: 'read' }],
  ])('rejects %s', async (_label, body) => {
    expect((await patch(body)).status).toBe(400);
    expect(db.notification.updateMany).not.toHaveBeenCalled();
  });

  it('is 500 when the database fails', async () => {
    db.notification.updateMany.mockRejectedValue(new Error('db down'));
    expect((await patch({ notificationIds: ['n1'], action: 'read' })).status).toBe(
      500,
    );
  });
});

describe('DELETE /api/notifications', () => {
  it('removes the caller’s notifications dismissed more than 90 days ago', async () => {
    db.notification.deleteMany.mockResolvedValue({ count: 4 });
    const before = Date.now();
    const { status, body } = await readJson(
      await DELETE(apiRequest('/api/notifications', 'DELETE')),
    );

    expect(status).toBe(200);
    expect(body.data).toEqual({ success: true, deletedCount: 4 });
    const { where } = db.notification.deleteMany.mock.calls[0][0];
    expect(where).toMatchObject({ userId: 'me-id', isDismissed: true });
    const days = (before - where.dismissedAt.lt.getTime()) / 86_400_000;
    expect(days).toBeGreaterThan(89.9);
    expect(days).toBeLessThan(90.1);
  });

  it('is 500 when the database fails', async () => {
    db.notification.deleteMany.mockRejectedValue(new Error('db down'));
    expect(
      (await readJson(await DELETE(apiRequest('/api/notifications', 'DELETE'))))
        .status,
    ).toBe(500);
  });
});
