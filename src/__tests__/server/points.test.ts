/** @jest-environment node */
import { prismaMock as db, resetPrismaMock } from '@/__tests__/support/api';
import {
  getLeaderboard,
  getUserProgress,
  syncCompletionPoints,
} from '@/lib/server/points';

jest.mock('@/lib/prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
}));
jest.mock('@/lib/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

const base = {
  userId: 'u1',
  holidayId: 'h1',
  entityType: 'task' as const,
  entityId: 't1',
  wasCompleted: false,
  isCompleted: true,
  priority: 'high' as const,
};

beforeEach(() => {
  resetPrismaMock();
  db.pointEvent.aggregate.mockResolvedValue({ _sum: { points: 0 } });
  db.pointEvent.upsert.mockResolvedValue({});
  db.pointEvent.deleteMany.mockResolvedValue({ count: 1 });
  db.pointEvent.findMany.mockResolvedValue([]);
  db.userAchievement.findMany.mockResolvedValue([]);
  db.userAchievement.createMany.mockResolvedValue({ count: 0 });
  for (const model of ['task', 'gift', 'card']) {
    db[model].count.mockResolvedValue(0);
  }
});

describe('syncCompletionPoints', () => {
  it('awards points to the user who completed the item', async () => {
    await syncCompletionPoints(base);
    expect(db.pointEvent.upsert).toHaveBeenCalledWith({
      where: { entityType_entityId: { entityType: 'task', entityId: 't1' } },
      create: {
        userId: 'u1',
        holidayId: 'h1',
        entityType: 'task',
        entityId: 't1',
        points: 20,
        reason: 'task_high',
      },
      update: {},
    });
  });

  it('does nothing when completion did not change', async () => {
    await syncCompletionPoints({ ...base, wasCompleted: true });
    await syncCompletionPoints({ ...base, isCompleted: false, wasCompleted: false });
    expect(db.pointEvent.upsert).not.toHaveBeenCalled();
    expect(db.pointEvent.deleteMany).not.toHaveBeenCalled();
  });

  it('takes the points back when an item is un-completed', async () => {
    await syncCompletionPoints({ ...base, wasCompleted: true, isCompleted: false });
    expect(db.pointEvent.deleteMany).toHaveBeenCalledWith({
      where: { entityType: 'task', entityId: 't1' },
    });
  });

  it('trims the award to the daily cap and stops once it is reached', async () => {
    db.pointEvent.aggregate.mockResolvedValue({ _sum: { points: 190 } });
    await syncCompletionPoints(base);
    expect(db.pointEvent.upsert.mock.calls[0][0].create.points).toBe(10);

    db.pointEvent.upsert.mockClear();
    db.pointEvent.aggregate.mockResolvedValue({ _sum: { points: 200 } });
    await syncCompletionPoints(base);
    expect(db.pointEvent.upsert).not.toHaveBeenCalled();
  });

  it('never throws, so a points failure cannot fail a completion', async () => {
    db.pointEvent.aggregate.mockRejectedValue(new Error('db down'));
    await expect(syncCompletionPoints(base)).resolves.toBeUndefined();
  });
});

describe('badges after an award', () => {
  const ledger = (n: number, over = {}) =>
    Array.from({ length: n }, () => ({
      entityType: 'task',
      reason: 'task_low',
      points: 5,
      createdAt: new Date(),
      ...over,
    }));

  it('gives First Step for the first completed item', async () => {
    db.pointEvent.findMany.mockResolvedValue(ledger(1));
    await syncCompletionPoints(base);

    expect(db.userAchievement.createMany).toHaveBeenCalledWith({
      data: [{ userId: 'u1', key: 'first_step', scope: 'global' }],
      skipDuplicates: true,
    });
  });

  it('only writes badges that are new', async () => {
    db.pointEvent.findMany.mockResolvedValue(ledger(1));
    db.userAchievement.findMany.mockResolvedValue([
      { key: 'first_step', scope: 'global' },
    ]);
    await syncCompletionPoints(base);
    expect(db.userAchievement.createMany).not.toHaveBeenCalled();
  });

  it('gives Holiday Hero, scoped to the holiday, when everything is done', async () => {
    db.pointEvent.findMany.mockResolvedValue(ledger(3));
    db.userAchievement.findMany.mockResolvedValue([
      { key: 'first_step', scope: 'global' },
    ]);
    db.task.count.mockResolvedValue(3);
    await syncCompletionPoints(base);

    expect(db.userAchievement.createMany.mock.calls[0][0].data).toEqual([
      { userId: 'u1', key: 'holiday_hero', scope: 'h1' },
    ]);
  });

  it('skips the holiday counts once Holiday Hero is already earned there', async () => {
    db.pointEvent.findMany.mockResolvedValue(ledger(1));
    db.userAchievement.findMany.mockResolvedValue([
      { key: 'holiday_hero', scope: 'h1' },
      { key: 'first_step', scope: 'global' },
    ]);
    await syncCompletionPoints(base);
    expect(db.task.count).not.toHaveBeenCalled();
  });

  it('does not check badges when the item was un-completed or nothing was awarded', async () => {
    await syncCompletionPoints({ ...base, wasCompleted: true, isCompleted: false });
    db.pointEvent.aggregate.mockResolvedValue({ _sum: { points: 200 } });
    await syncCompletionPoints(base);
    expect(db.userAchievement.findMany).not.toHaveBeenCalled();
  });

  it('a badge failure keeps the points and does not throw', async () => {
    db.userAchievement.findMany.mockRejectedValue(new Error('db down'));
    await expect(syncCompletionPoints(base)).resolves.toBeUndefined();
    expect(db.pointEvent.upsert).toHaveBeenCalled();
  });
});

describe('getLeaderboard', () => {
  const person = (id: string, name: string, show?: boolean) => ({
    id,
    name,
    picture: null,
    preferences: show === undefined ? null : { showOnLeaderboard: show },
  });

  beforeEach(() => {
    db.task.count.mockResolvedValueOnce(4).mockResolvedValueOnce(2);
    db.gift.count.mockResolvedValueOnce(1).mockResolvedValueOnce(1);
    db.card.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    db.pointEvent.findMany.mockResolvedValue([
      {
        userId: 'me',
        points: 10,
        createdAt: new Date(),
        entityType: 'task',
        reason: 'task_medium',
      },
      {
        userId: 'friend',
        points: 25,
        createdAt: new Date(),
        entityType: 'gift',
        reason: 'gift',
      },
    ]);
  });

  it('returns null for an unknown holiday', async () => {
    db.holiday.findUnique.mockResolvedValue(null);
    expect(await getLeaderboard('nope', 'me')).toBeNull();
  });

  it('ranks account members, the share owner and share members, with team progress', async () => {
    db.holiday.findUnique.mockResolvedValue({
      account: { members: [{ user: person('me', 'Me') }] },
      shares: {
        owner: person('me', 'Me'),
        members: [{ user: person('friend', 'Friend') }],
      },
    });
    const board = await getLeaderboard('h1', 'me');

    expect(board?.entries.map(e => [e.userId, e.rank, e.points])).toEqual([
      ['friend', 1, 25],
      ['me', 2, 10],
    ]);
    expect(board?.me?.levelInfo.level).toBe(1);
    expect(board?.team).toEqual({
      completed: 3,
      total: 5,
      percent: 60,
      reached: false,
    });
    expect(board?.shared).toBe(true);
    expect(db.pointEvent.findMany.mock.calls[0][0].where.userId).toEqual({
      in: ['me', 'friend'],
    });
  });

  it('is not shared until someone else has joined the share', async () => {
    db.holiday.findUnique.mockResolvedValue({
      account: { members: [{ user: person('me', 'Me') }] },
      shares: { owner: person('me', 'Me'), members: [] },
    });
    expect((await getLeaderboard('h1', 'me'))?.shared).toBe(false);

    db.holiday.findUnique.mockResolvedValue({
      account: { members: [{ user: person('me', 'Me') }] },
      shares: null,
    });
    expect((await getLeaderboard('h1', 'me'))?.shared).toBe(false);
  });

  it("reports the viewer's badge progress, with this holiday's and global badges", async () => {
    db.holiday.findUnique.mockResolvedValue({
      account: { members: [{ user: person('me', 'Me') }] },
      shares: {
        owner: person('me', 'Me'),
        members: [{ user: person('friend', 'Friend') }],
      },
    });
    const earnedAt = new Date('2026-12-01T00:00:00.000Z');
    db.userAchievement.findMany.mockResolvedValue([
      { key: 'first_step', scope: 'global', earnedAt },
    ]);
    const board = await getLeaderboard('h1', 'me');

    expect(db.userAchievement.findMany.mock.calls[0][0].where).toEqual({
      userId: 'me',
      scope: { in: ['global', 'h1'] },
    });
    const first = board?.badges.find(b => b.key === 'first_step');
    expect(first).toMatchObject({ earned: true, earnedAt: earnedAt.toISOString() });
    const tackler = board?.badges.find(b => b.key === 'task_tackler');
    expect(tackler).toMatchObject({ earned: false, current: 1, target: 10 });
  });

  it('hides members who opted out, but always shows the viewer to themselves', async () => {
    db.holiday.findUnique.mockResolvedValue({
      account: { members: [{ user: person('me', 'Me', false) }] },
      shares: {
        owner: person('me', 'Me', false),
        members: [{ user: person('friend', 'Friend', false) }],
      },
    });
    const board = await getLeaderboard('h1', 'me');
    expect(board?.entries.map(e => e.userId)).toEqual(['me']);
  });

  it('limits points to a year when asked', async () => {
    db.holiday.findUnique.mockResolvedValue({
      account: { members: [{ user: person('me', 'Me') }] },
      shares: null,
    });
    const board = await getLeaderboard('h1', 'me', 2026);
    expect(board?.year).toBe(2026);
    expect(db.pointEvent.findMany.mock.calls[0][0].where.createdAt).toEqual({
      gte: new Date('2026-01-01T00:00:00.000Z'),
      lt: new Date('2027-01-01T00:00:00.000Z'),
    });
  });
});

describe('getUserProgress', () => {
  it('summarises the whole ledger with global badges and holidays completed', async () => {
    const earnedAt = new Date('2026-12-01T00:00:00.000Z');
    db.pointEvent.findMany.mockResolvedValue([
      { entityType: 'task', reason: 'task_high', points: 20, createdAt: new Date() },
      { entityType: 'gift', reason: 'gift', points: 10, createdAt: new Date() },
    ]);
    db.userAchievement.findMany.mockResolvedValue([
      { key: 'first_step', scope: 'global', earnedAt },
      { key: 'holiday_hero', scope: 'h1', earnedAt },
      { key: 'holiday_hero', scope: 'h2', earnedAt },
    ]);
    const progress = await getUserProgress('me');

    expect(db.pointEvent.findMany.mock.calls[0][0].where).toEqual({ userId: 'me' });
    expect(progress).toMatchObject({ points: 30, streak: 1, holidaysCompleted: 2 });
    expect(progress.levelInfo.level).toBe(1);
    expect(progress.badges.some(b => b.key === 'holiday_hero')).toBe(false);
    expect(progress.badges.find(b => b.key === 'first_step')?.earned).toBe(true);
    expect(progress.badges.find(b => b.key === 'task_tackler')).toMatchObject({
      earned: false,
      current: 1,
    });
  });
});
