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
const cleanupUserShareData = jest.fn();
jest.mock('@/lib/server/shareCleanup', () => ({
  cleanupUserShareData: (...a: unknown[]) => cleanupUserShareData(...a),
}));

import {
  apiRequest,
  prismaMock as db,
  readJson,
  resetPrismaMock,
  routeParams,
} from '@/__tests__/support/api';
import { DELETE, POST } from '@/app/api/shares/[shareId]/members/route';

const me = { id: 'me-id', auth0Sub: 'auth0|me' };
const ctx = routeParams({ shareId: 's1' });

beforeEach(() => {
  resetPrismaMock();
  getCurrentUser.mockReset().mockResolvedValue(me);
  cleanupUserShareData.mockReset().mockResolvedValue(undefined);
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('POST /api/shares/[shareId]/members', () => {
  const add = async (body: unknown = { userId: 'auth0|new' }) =>
    readJson(await POST(apiRequest('/api/shares/s1/members', 'POST', body), ctx));

  beforeEach(() => {
    db.user.findUnique.mockResolvedValue({ id: 'new-id' });
    db.share.findUnique.mockResolvedValue({
      id: 's1',
      ownerUserId: 'me-id',
      holiday: { account: { ownerUserId: 'me-id' } },
      members: [{ userId: 'me-id' }],
    });
    db.shareMember.findUnique.mockResolvedValue(null);
  });

  it('converts the Auth0 sub to an internal id when adding', async () => {
    await add();
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { auth0Sub: 'auth0|new' },
    });
    expect(db.shareMember.create).toHaveBeenCalledWith({
      data: { shareId: 's1', userId: 'new-id' },
    });
  });

  it('also adds the holiday owner if they are not a member yet', async () => {
    db.share.findUnique
      .mockResolvedValueOnce({ id: 's1', ownerUserId: 'me-id' })
      .mockResolvedValueOnce({
        holiday: { account: { ownerUserId: 'holiday-owner' } },
        members: [{ userId: 'new-id' }],
      })
      .mockResolvedValueOnce({ id: 's1', members: [] });
    await add();

    expect(db.shareMember.create).toHaveBeenCalledTimes(2);
    expect(db.shareMember.create).toHaveBeenLastCalledWith({
      data: { shareId: 's1', userId: 'holiday-owner' },
    });
  });

  it('does not add the holiday owner twice', async () => {
    db.share.findUnique
      .mockResolvedValueOnce({ id: 's1', ownerUserId: 'me-id' })
      .mockResolvedValueOnce({
        holiday: { account: { ownerUserId: 'holiday-owner' } },
        members: [{ userId: 'holiday-owner' }],
      })
      .mockResolvedValueOnce({ id: 's1' });
    await add();
    expect(db.shareMember.create).toHaveBeenCalledTimes(1);
  });

  it('ignores a duplicate-key race when adding the holiday owner', async () => {
    db.share.findUnique.mockReset();
    db.share.findUnique
      .mockResolvedValueOnce({ id: 's1', ownerUserId: 'me-id' })
      .mockResolvedValueOnce({
        holiday: { account: { ownerUserId: 'holiday-owner' } },
        members: [],
      })
      .mockResolvedValueOnce({ id: 's1', members: [] });
    db.shareMember.create
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce({ code: 'P2002' });

    expect((await add()).status).toBe(200);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('returns the share and adds no one when the user is already a member', async () => {
    db.shareMember.findUnique.mockResolvedValue({ shareId: 's1' });
    const { status, body } = await add();

    expect(status).toBe(200);
    expect(body).toMatchObject({ id: 's1', ownerUserId: 'me-id' });
    expect(db.shareMember.create).not.toHaveBeenCalled();
  });

  it('requires a userId', async () => {
    expect((await add({})).status).toBe(400);
  });

  it('is 404 for an unknown user or share', async () => {
    db.user.findUnique.mockResolvedValue(null);
    expect((await add()).body.error).toBe('User not found');

    db.user.findUnique.mockResolvedValue({ id: 'new-id' });
    db.share.findUnique.mockResolvedValue(null);
    expect((await add()).body.error).toBe('Share not found');
  });

  it('is 500 on a db failure', async () => {
    db.shareMember.create.mockRejectedValue(new Error('db down'));
    expect((await add()).status).toBe(500);
  });
});

describe('DELETE /api/shares/[shareId]/members', () => {
  const remove = async (query = '?userId=auth0|friend') =>
    readJson(
      await DELETE(apiRequest(`/api/shares/s1/members${query}`, 'DELETE'), ctx),
    );

  const person = (n: string) => ({
    id: n,
    auth0Sub: `auth0|${n}`,
    name: n,
    email: `${n}@x.com`,
    picture: null,
  });
  const updated = (memberIds: string[]) => ({
    id: 's1',
    ownerUserId: 'me-id',
    holiday: { id: 'h1', holidayType: 'Fourth of July', name: 'x' },
    owner: person('me-id'),
    members: memberIds.map(id => ({ user: person(id), joinedAt: 'then' })),
  });

  beforeEach(() => {
    db.user.findUnique.mockResolvedValue({ id: 'friend-id' });
    db.share.findUnique
      .mockResolvedValueOnce({ id: 's1', ownerUserId: 'me-id' })
      .mockResolvedValueOnce(updated(['me-id', 'u3']));
    db.shareMember.findUnique.mockResolvedValue({
      shareId: 's1',
      userId: 'friend-id',
    });
  });

  it('removes the member, cleans up their data, and returns the share for the client', async () => {
    const { status, body } = await remove();

    expect(status).toBe(200);
    expect(db.shareMember.delete).toHaveBeenCalledWith({
      where: { shareId_userId: { shareId: 's1', userId: 'friend-id' } },
    });
    expect(cleanupUserShareData).toHaveBeenCalledWith('s1', 'friend-id');
    expect(body).toMatchObject({
      shareId: 's1',
      holidayKey: 'fourth-of-july',
      memberUserIds: ['auth0|me-id', 'auth0|u3'],
    });
    expect(db.invite.deleteMany).not.toHaveBeenCalled();
  });

  it('clears pending invites once only the owner is left', async () => {
    db.share.findUnique
      .mockReset()
      .mockResolvedValueOnce({ id: 's1', ownerUserId: 'me-id' })
      .mockResolvedValueOnce(updated(['me-id']));
    await remove();
    expect(db.invite.deleteMany).toHaveBeenCalledWith({
      where: { shareId: 's1', status: 'pending' },
    });
  });

  it('still removes the member when cleanup fails', async () => {
    cleanupUserShareData.mockRejectedValue(new Error('cleanup broke'));
    expect((await remove()).status).toBe(200);
  });

  it('never removes the share owner', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'me-id' });
    const { status, body } = await remove('?userId=auth0|me');

    expect(status).toBe(403);
    expect(body.error).toBe('Cannot remove the share owner from the share');
    expect(db.shareMember.delete).not.toHaveBeenCalled();
  });

  it('is 404 for someone who is not a member', async () => {
    db.shareMember.findUnique.mockResolvedValue(null);
    expect((await remove()).body.error).toBe('User is not a member of this share');
    expect(db.shareMember.delete).not.toHaveBeenCalled();
  });

  it('requires a userId and a known user and share', async () => {
    expect((await remove('')).status).toBe(400);

    db.user.findUnique.mockResolvedValue(null);
    expect((await remove()).body.error).toBe('User not found');

    db.user.findUnique.mockResolvedValue({ id: 'friend-id' });
    db.share.findUnique.mockReset().mockResolvedValue(null);
    expect((await remove()).body.error).toBe('Share not found');
  });

  it('is 404 if the share vanishes during removal', async () => {
    db.share.findUnique
      .mockReset()
      .mockResolvedValueOnce({ id: 's1', ownerUserId: 'me-id' })
      .mockResolvedValueOnce(null);
    expect((await remove()).body.error).toBe('Share not found after update');
  });

  it('is 500 on a db failure', async () => {
    db.shareMember.delete.mockRejectedValue(new Error('db down'));
    expect((await remove()).status).toBe(500);
  });
});
