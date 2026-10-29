/** @jest-environment node */
const getCurrentUser = jest.fn();
jest.mock('@/lib/auth', () => ({
  getCurrentUser: (...a: unknown[]) => getCurrentUser(...a),
  getVerifiedClaims: jest.fn(),
  requireAuth: jest.fn(),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
}));

import {
  apiRequest,
  prismaMock as db,
  readJson,
  resetPrismaMock,
  routeParams,
} from '@/__tests__/support/api';
import { POST as decline } from '@/app/api/invites/[inviteId]/decline/route';
import { POST as dismiss } from '@/app/api/invites/[inviteId]/dismiss/route';

const me = {
  id: 'me-id',
  auth0Sub: 'auth0|me',
  email: 'me@x.com',
  verifiedEmail: 'me@x.com',
};

const invite = (over: Record<string, unknown> = {}) => ({
  id: 'i1',
  status: 'pending',
  toUserId: 'me-id',
  toEmail: null,
  fromUserId: 'owner-id',
  share: {
    id: 's1',
    members: [{ userId: 'owner-id' }],
    invites: [{ id: 'i1', status: 'pending' }],
  },
  ...over,
});

const call = async (route: typeof decline) =>
  readJson(
    await route(apiRequest('/x', 'POST', {}), routeParams({ inviteId: 'i1' })),
  );

beforeEach(() => {
  resetPrismaMock();
  getCurrentUser.mockReset().mockResolvedValue(me);
  db.invite.update.mockResolvedValue({ id: 'i1', status: 'declined' });
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('declining an invite', () => {
  it('answers 404 for an invite that does not exist', async () => {
    db.invite.findUnique.mockResolvedValue(null);

    expect((await call(decline)).status).toBe(404);
  });

  it('refuses an invite that was already answered', async () => {
    db.invite.findUnique.mockResolvedValue(invite({ status: 'accepted' }));

    const { status, body } = await call(decline);

    expect(status).toBe(400);
    expect(body.error).toBe('Invite is not pending');
    expect(db.invite.update).not.toHaveBeenCalled();
  });

  it('marks the invite declined with the time it was answered', async () => {
    db.invite.findUnique.mockResolvedValue(invite());

    await call(decline);

    const { where, data } = db.invite.update.mock.calls[0][0];
    expect(where).toEqual({ id: 'i1' });
    expect(data.status).toBe('declined');
    expect(data.respondedAt).toBeInstanceOf(Date);
  });

  it('removes a share that now has no members but the owner and no other invites', async () => {
    db.invite.findUnique.mockResolvedValue(invite());

    await call(decline);

    expect(db.share.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
  });

  it('keeps the share when another invite is still waiting', async () => {
    db.invite.findUnique.mockResolvedValue(
      invite({
        share: {
          id: 's1',
          members: [{ userId: 'owner-id' }],
          invites: [
            { id: 'i1', status: 'pending' },
            { id: 'i2', status: 'pending' },
          ],
        },
      }),
    );

    await call(decline);

    expect(db.share.delete).not.toHaveBeenCalled();
  });

  it('keeps the share when someone has already joined it', async () => {
    db.invite.findUnique.mockResolvedValue(
      invite({
        share: {
          id: 's1',
          members: [{ userId: 'owner-id' }, { userId: 'joined-id' }],
          invites: [{ id: 'i1', status: 'pending' }],
        },
      }),
    );

    await call(decline);

    expect(db.share.delete).not.toHaveBeenCalled();
  });

  it('answers 500 when saving fails', async () => {
    db.invite.findUnique.mockResolvedValue(invite());
    db.invite.update.mockRejectedValue(new Error('db down'));

    expect((await call(decline)).status).toBe(500);
  });
});

describe('dismissing an invite', () => {
  it('answers 404 for an invite that does not exist', async () => {
    db.invite.findUnique.mockResolvedValue(null);

    expect((await call(dismiss)).status).toBe(404);
  });

  it('lets the sender hide it from their own list', async () => {
    getCurrentUser.mockResolvedValue({ ...me, id: 'owner-id' });
    db.invite.findUnique.mockResolvedValue(invite());
    db.invite.update.mockResolvedValue({ id: 'i1', senderDismissedAt: 'now' });

    const { status } = await call(dismiss);

    expect(status).toBe(200);
    expect(db.invite.update.mock.calls[0][0].data.senderDismissedAt).toBeInstanceOf(
      Date,
    );
  });

  it('answers 500 when saving fails', async () => {
    getCurrentUser.mockResolvedValue({ ...me, id: 'owner-id' });
    db.invite.findUnique.mockResolvedValue(invite());
    db.invite.update.mockRejectedValue(new Error('db down'));

    expect((await call(dismiss)).status).toBe(500);
  });
});
