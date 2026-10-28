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
} from '@/__tests__/support/api';
import { POST } from '@/app/api/users/cancel-subscription-cleanup/route';

const me = { id: 'me-id', auth0Sub: 'auth0|me' };
const run = async (body: unknown = {}) =>
  readJson(
    await POST(apiRequest('/api/users/cancel-subscription-cleanup', 'POST', body)),
  );

const share = (id: string, members: string[] = [], type = 'Christmas') => ({
  id,
  holiday: { holidayType: type },
  members: members.map(userId => ({ userId })),
});

beforeEach(() => {
  resetPrismaMock();
  getCurrentUser.mockReset().mockResolvedValue(me);
  db.user.findUnique.mockResolvedValue({ id: 'me-id' });
  db.share.findMany.mockResolvedValue([]);
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('POST /api/users/cancel-subscription-cleanup', () => {
  it('does nothing and reports zeros for a user with no shares', async () => {
    const { status, body } = await run();

    expect(status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      cleanup: {
        sharesLeft: 0,
        membersRemoved: 0,
        ownedSharesProcessed: 0,
        errors: [],
      },
    });
  });

  it('leaves the shares the user belongs to but does not own', async () => {
    db.share.findMany
      .mockResolvedValueOnce([share('s1'), share('s2')])
      .mockResolvedValueOnce([]);
    const { body } = await run();

    expect(body.cleanup.sharesLeft).toBe(2);
    expect(db.share.findMany.mock.calls[0][0].where).toEqual({
      members: { some: { userId: 'me-id' } },
      ownerUserId: { not: 'me-id' },
    });
    expect(
      db.shareMember.delete.mock.calls.map(
        (c: unknown[]) => (c[0] as { where: unknown }).where,
      ),
    ).toEqual([
      { shareId_userId: { shareId: 's1', userId: 'me-id' } },
      { shareId_userId: { shareId: 's2', userId: 'me-id' } },
    ]);
  });

  it('removes everyone but the owner from owned shares and drops pending invites', async () => {
    db.share.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([share('own1', ['me-id', 'u2', 'u3'])]);
    const { body } = await run();

    expect(body.cleanup).toMatchObject({
      membersRemoved: 2,
      ownedSharesProcessed: 1,
    });
    expect(db.shareMember.delete).toHaveBeenCalledTimes(2);
    expect(db.shareMember.delete).not.toHaveBeenCalledWith({
      where: { shareId_userId: { shareId: 'own1', userId: 'me-id' } },
    });
    expect(db.invite.deleteMany).toHaveBeenCalledWith({
      where: { shareId: 'own1', status: 'pending' },
    });
  });

  it('keeps going and reports each failure', async () => {
    db.share.findMany
      .mockResolvedValueOnce([share('s1', [], 'Easter')])
      .mockResolvedValueOnce([share('own1', ['u2'], 'Christmas')]);
    db.shareMember.delete.mockRejectedValue(new Error('locked'));
    db.invite.deleteMany.mockRejectedValue(new Error('no invites table'));
    const { status, body } = await run();

    expect(status).toBe(200);
    expect(body.cleanup).toMatchObject({ sharesLeft: 0, membersRemoved: 0 });
    expect(body.cleanup.errors).toEqual([
      'Failed to leave share for Easter: locked',
      'Failed to remove member from Christmas: locked',
      'Failed to clean up invites for Christmas: no invites table',
    ]);
  });

  it('refuses to clean up someone else’s account', async () => {
    const { status } = await run({ auth0Sub: 'auth0|other' });
    expect(status).toBe(403);
    expect(db.shareMember.delete).not.toHaveBeenCalled();
  });

  it('is 404 for an unknown user, 401 signed out, 500 on db failure', async () => {
    db.user.findUnique.mockResolvedValue(null);
    expect((await run()).status).toBe(404);

    getCurrentUser.mockResolvedValue(null);
    expect((await run()).status).toBe(401);

    getCurrentUser.mockResolvedValue(me);
    db.user.findUnique.mockResolvedValue({ id: 'me-id' });
    db.share.findMany.mockReset().mockRejectedValue(new Error('db down'));
    expect((await run()).status).toBe(500);
  });
});
