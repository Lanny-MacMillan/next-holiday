/** @jest-environment node */
import { prismaMock as db, resetPrismaMock } from '@/__tests__/support/api';
import { getLeaderboard, syncCompletionPoints } from '@/lib/server/points';

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
      { userId: 'me', points: 10, createdAt: new Date() },
      { userId: 'friend', points: 25, createdAt: new Date() },
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
    expect(db.pointEvent.findMany.mock.calls[0][0].where.userId).toEqual({
      in: ['me', 'friend'],
    });
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
