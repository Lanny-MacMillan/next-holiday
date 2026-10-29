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
import { GET, POST } from '@/app/api/shares/route';

const me = { id: 'me-id', auth0Sub: 'auth0|me', subscriptionPlan: 'plus' };

beforeEach(() => {
  resetPrismaMock();
  getCurrentUser.mockReset().mockResolvedValue(me);
  db.user.findUnique.mockResolvedValue({ id: 'me-id' });
  db.account.findFirst.mockResolvedValue({ id: 'acc1' });
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('POST /api/shares', () => {
  const post = async (body: unknown) =>
    readJson(await POST(apiRequest('/api/shares', 'POST', body)));

  beforeEach(() => {
    db.holiday.findFirst.mockResolvedValue({ id: 'h1' });
    db.share.findFirst.mockResolvedValue(null);
    db.share.create.mockResolvedValue({
      id: 's1',
      holidayId: 'h1',
      ownerUserId: 'me-id',
    });
  });

  describe('Plus only', () => {
    it.each([
      ['a free account', { ...me, subscriptionPlan: 'free' }],
      ['an account with no plan on record', { ...me, subscriptionPlan: undefined }],
    ])('refuses %s and writes nothing', async (_label, user) => {
      getCurrentUser.mockResolvedValue(user);

      const { status, body } = await post({ holidayKey: 'christmas' });

      expect(status).toBe(403);
      expect(body.error).toBe('A Plus subscription is required');
      expect(db.share.create).not.toHaveBeenCalled();
      expect(db.holiday.findFirst).not.toHaveBeenCalled();
    });
  });

  it('creates a share and makes the owner its first member', async () => {
    const { status, body } = await post({ holidayKey: 'christmas' });

    expect(status).toBe(200);
    expect(body).toMatchObject({
      id: 's1',
      shareStatus: 'created_new',
      message: 'Created new Christmas share',
    });
    expect(db.share.create).toHaveBeenCalledWith({
      data: { holidayId: 'h1', ownerUserId: 'me-id' },
    });
    expect(db.shareMember.create).toHaveBeenCalledWith({
      data: { shareId: 's1', userId: 'me-id' },
    });
  });

  it('finds the oldest holiday of that type in the caller’s own account', async () => {
    await post({ holidayKey: 'new-year' });

    expect(db.account.findFirst).toHaveBeenCalledWith({
      where: { ownerUserId: 'me-id' },
    });
    expect(db.holiday.findFirst).toHaveBeenCalledWith({
      where: { holidayType: 'New Year', accountId: 'acc1' },
      orderBy: { createdAt: 'asc' },
    });
  });

  it.each([
    ['valentines', "Valentine's Day"],
    ['mothers-day', "Mother's Day"],
    ['fourth-of-july', 'Fourth of July'],
    ['baby-shower', 'Baby Shower'],
    ['Some Custom', 'Some Custom'],
  ])('maps the key %s to %s', async (key, name) => {
    await post({ holidayKey: key });
    expect(db.holiday.findFirst.mock.calls[0][0].where.holidayType).toBe(name);
  });

  it('returns the existing share to its owner without creating another', async () => {
    db.share.findFirst.mockResolvedValue({
      id: 's1',
      ownerUserId: 'me-id',
      members: [],
    });
    const { body } = await post({ holidayKey: 'christmas' });

    expect(body).toMatchObject({
      shareStatus: 'owner_access',
      message: 'Accessing your Christmas share',
    });
    expect(db.share.create).not.toHaveBeenCalled();
  });

  it('reports a member who is already in someone else’s share', async () => {
    db.share.findFirst.mockResolvedValue({
      id: 's1',
      ownerUserId: 'other',
      members: [{ user: { auth0Sub: 'auth0|me' } }],
    });
    expect((await post({ holidayKey: 'christmas' })).body).toMatchObject({
      shareStatus: 'already_member',
      message: 'You are already a member of this Christmas share',
    });
  });

  it('reports joining an existing share otherwise (without adding a member)', async () => {
    db.share.findFirst.mockResolvedValue({
      id: 's1',
      ownerUserId: 'other',
      members: [],
    });
    expect((await post({ holidayKey: 'christmas' })).body).toMatchObject({
      shareStatus: 'joined_existing',
      message: 'Joined existing Christmas share',
    });
    expect(db.shareMember.create).not.toHaveBeenCalled();
  });

  it('requires a holiday key', async () => {
    expect((await post({})).status).toBe(400);
  });

  it('refuses to create a share on behalf of another user', async () => {
    expect(
      (await post({ holidayKey: 'christmas', ownerUserId: 'auth0|other' })).status,
    ).toBe(403);
    expect(db.share.create).not.toHaveBeenCalled();
  });

  it('accepts its own id as ownerUserId', async () => {
    expect(
      (await post({ holidayKey: 'christmas', ownerUserId: 'auth0|me' })).status,
    ).toBe(200);
  });

  it('is 404 when the user, account or holiday is missing', async () => {
    db.user.findUnique.mockResolvedValue(null);
    expect((await post({ holidayKey: 'christmas' })).body.error).toBe(
      'Owner user not found',
    );

    db.user.findUnique.mockResolvedValue({ id: 'me-id' });
    db.account.findFirst.mockResolvedValue(null);
    expect((await post({ holidayKey: 'christmas' })).body.error).toBe(
      'User account not found',
    );

    db.account.findFirst.mockResolvedValue({ id: 'acc1' });
    db.holiday.findFirst.mockResolvedValue(null);
    const { status, body } = await post({ holidayKey: 'christmas' });
    expect(status).toBe(404);
    expect(body.error).toMatch(/Holiday not found/);
  });

  it('is 401 signed out and 500 on a db failure', async () => {
    db.share.create.mockRejectedValue(new Error('db down'));
    expect((await post({ holidayKey: 'christmas' })).status).toBe(500);

    getCurrentUser.mockResolvedValue(null);
    expect((await post({ holidayKey: 'christmas' })).status).toBe(401);
  });
});

describe('GET /api/shares', () => {
  const get = async (query = '') =>
    readJson(await GET(apiRequest(`/api/shares${query}`)));

  describe('by holiday key', () => {
    beforeEach(() => {
      db.holiday.findFirst.mockResolvedValue({ id: 'h1' });
      db.share.findFirst.mockResolvedValue({ id: 's1' });
    });

    it('returns the share for that holiday', async () => {
      const { body } = await get('?holidayKey=easter');

      expect(body).toEqual({ id: 's1' });
      expect(db.holiday.findFirst).toHaveBeenCalledWith({
        where: { holidayType: 'Easter', accountId: 'acc1' },
      });
      expect(db.share.findFirst).toHaveBeenCalledWith({
        where: { holidayId: 'h1' },
      });
    });

    it.each([
      ['user', () => db.user.findUnique.mockResolvedValue(null)],
      ['account', () => db.account.findFirst.mockResolvedValue(null)],
      ['holiday', () => db.holiday.findFirst.mockResolvedValue(null)],
      ['share', () => db.share.findFirst.mockResolvedValue(null)],
    ])('returns null when there is no %s', async (_what, arrange) => {
      arrange();
      expect((await get('?holidayKey=easter')).body).toBeNull();
    });
  });

  describe('listing', () => {
    const when = new Date('2025-01-02T03:04:05Z');
    const person = (n: number) => ({
      id: `u${n}`,
      auth0Sub: `auth0|${n}`,
      name: `P${n}`,
      email: `p${n}@x.com`,
      picture: null,
    });
    const share = (over: Record<string, unknown> = {}) => ({
      id: 's1',
      createdAt: when,
      updatedAt: when,
      holiday: { id: 'h1', holidayType: 'Christmas', name: 'Xmas' },
      owner: person(1),
      members: [
        { user: person(1), joinedAt: when },
        { user: person(2), joinedAt: null },
      ],
      invites: [],
      ...over,
    });

    it('looks for shares the user owns or belongs to', async () => {
      db.share.findMany.mockResolvedValue([]);
      await get();
      expect(db.share.findMany.mock.calls[0][0].where).toEqual({
        OR: [{ ownerUserId: 'me-id' }, { members: { some: { userId: 'me-id' } } }],
      });
    });

    it('describes a shared holiday with Auth0 ids for the client', async () => {
      db.share.findMany.mockResolvedValue([share()]);
      const { body } = await get();

      expect(body).toEqual([
        {
          shareId: 's1',
          holidayId: 'h1',
          holidayKey: 'christmas',
          ownerUserId: 'auth0|1',
          memberUserIds: ['auth0|1', 'auth0|2'],
          members: [
            {
              userId: 'auth0|1',
              uuid: 'u1',
              name: 'P1',
              email: 'p1@x.com',
              picture: null,
              joinedAt: '2025-01-02T03:04:05.000Z',
            },
            {
              userId: 'auth0|2',
              uuid: 'u2',
              name: 'P2',
              email: 'p2@x.com',
              picture: null,
            },
          ],
          hasPendingInvites: false,
          pendingInviteCount: 0,
          createdAt: '2025-01-02T03:04:05.000Z',
          updatedAt: '2025-01-02T03:04:05.000Z',
        },
      ]);
    });

    it('hides a share with only its owner and no pending invites', async () => {
      db.share.findMany.mockResolvedValue([
        share({
          members: [{ user: person(1) }],
          invites: [{ id: 'i', status: 'declined' }],
        }),
      ]);
      expect((await get()).body).toEqual([]);
    });

    it('keeps an owner-only share while an invite is pending, and counts them', async () => {
      db.share.findMany.mockResolvedValue([
        share({
          members: [{ user: person(1) }],
          invites: [
            { id: 'i1', status: 'pending' },
            { id: 'i2', status: 'pending' },
            { id: 'i3', status: 'declined' },
          ],
        }),
      ]);
      const { body } = await get();

      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({
        hasPendingInvites: true,
        pendingInviteCount: 2,
      });
    });

    it('derives a key from the type name when it is not a standard holiday', async () => {
      db.share.findMany.mockResolvedValue([
        share({ holiday: { id: 'h1', holidayType: "Cat's Big Day", name: 'x' } }),
      ]);
      expect((await get()).body[0].holidayKey).toBe('cats-big-day');
    });

    it('returns an empty list for a user that is not in the database', async () => {
      db.user.findUnique.mockResolvedValue(null);
      expect((await get()).body).toEqual([]);
    });
  });

  it('refuses a query for another user’s shares', async () => {
    expect((await get('?userId=auth0|other')).status).toBe(403);
  });

  it('is 401 signed out and 500 on a db failure', async () => {
    db.share.findMany.mockRejectedValue(new Error('db down'));
    expect((await get()).status).toBe(500);

    getCurrentUser.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
  });
});
