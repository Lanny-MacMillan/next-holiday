import {
  buildLeaderboard,
  capAward,
  DAILY_CAP,
  levelFor,
  pointsFor,
  startOfUtcDay,
  streakFor,
  teamGoal,
  yearWindow,
} from '@/lib/points';

const day = (s: string) => new Date(`${s}T12:00:00.000Z`);

describe('pointsFor', () => {
  it.each([
    ['low', 5],
    ['medium', 10],
    ['high', 20],
  ] as const)('gives a %s priority task %i points', (priority, points) => {
    expect(
      pointsFor({ entityType: 'task', priority, completedAt: day('2026-12-01') }),
    ).toEqual({ points, reason: `task_${priority}` });
  });

  it('treats a task with no priority as low', () => {
    expect(
      pointsFor({ entityType: 'task', completedAt: day('2026-12-01') }).points,
    ).toBe(5);
  });

  it('adds an early bonus only when finished on an earlier day than the due date', () => {
    const base = {
      entityType: 'task',
      priority: 'high',
      dueDate: day('2026-12-10'),
    } as const;
    expect(pointsFor({ ...base, completedAt: day('2026-12-09') })).toEqual({
      points: 25,
      reason: 'task_high+early',
    });
    expect(pointsFor({ ...base, completedAt: day('2026-12-10') }).points).toBe(20);
    expect(pointsFor({ ...base, completedAt: day('2026-12-11') }).points).toBe(20);
  });

  it('gives gifts and cards a flat amount', () => {
    const completedAt = day('2026-12-01');
    expect(pointsFor({ entityType: 'gift', completedAt })).toEqual({
      points: 10,
      reason: 'gift',
    });
    expect(pointsFor({ entityType: 'card', completedAt })).toEqual({
      points: 5,
      reason: 'card',
    });
  });
});

describe('capAward', () => {
  const award = { points: 20, reason: 'task_high' as const };

  it('passes an award through while there is room', () => {
    expect(capAward(award, 0)).toBe(award);
    expect(capAward(award, DAILY_CAP - 20)).toBe(award);
  });

  it('trims an award that would cross the cap', () => {
    expect(capAward(award, DAILY_CAP - 8)).toEqual({ ...award, points: 8 });
  });

  it('drops the award once the cap is reached', () => {
    expect(capAward(award, DAILY_CAP)).toBeNull();
    expect(capAward(award, DAILY_CAP + 50)).toBeNull();
  });
});

describe('levelFor', () => {
  it.each([
    [0, 1],
    [49, 1],
    [50, 2],
    [199, 2],
    [200, 3],
    [450, 4],
  ])('%i points is level %i', (points, level) => {
    expect(levelFor(points).level).toBe(level);
  });

  it('reports progress within the level', () => {
    expect(levelFor(125)).toEqual({
      level: 2,
      pointsIntoLevel: 75,
      pointsForNext: 150,
      progress: 0.5,
    });
  });

  it('never goes below level 1 for bad input', () => {
    expect(levelFor(-30).level).toBe(1);
  });
});

describe('streakFor', () => {
  const today = day('2026-12-10');

  it('is zero with no awards', () => {
    expect(streakFor([], today)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    expect(
      streakFor([day('2026-12-10'), day('2026-12-09'), day('2026-12-08')], today),
    ).toBe(3);
  });

  it('keeps a streak alive when the last award was yesterday', () => {
    expect(streakFor([day('2026-12-09'), day('2026-12-08')], today)).toBe(2);
  });

  it('breaks on a missed day', () => {
    expect(streakFor([day('2026-12-10'), day('2026-12-08')], today)).toBe(1);
    expect(streakFor([day('2026-12-07')], today)).toBe(0);
  });

  it('counts several awards on one day once', () => {
    expect(streakFor([day('2026-12-10'), day('2026-12-10')], today)).toBe(1);
  });
});

describe('buildLeaderboard', () => {
  const members = [
    { userId: 'a', name: 'Ada', picture: null },
    { userId: 'b', name: 'Ben', picture: null },
    { userId: 'c', name: 'Cy', picture: null },
  ];
  const today = day('2026-12-10');

  it('ranks by points, lists members with none, and flags the viewer', () => {
    const board = buildLeaderboard(
      members,
      [
        { userId: 'b', points: 20, createdAt: today },
        { userId: 'a', points: 5, createdAt: today },
        { userId: 'a', points: 10, createdAt: today },
      ],
      'a',
      today,
    );
    expect(board.map(e => [e.userId, e.points, e.rank])).toEqual([
      ['b', 20, 1],
      ['a', 15, 2],
      ['c', 0, 3],
    ]);
    expect(board.find(e => e.isYou)?.userId).toBe('a');
  });

  it('gives tied members the same rank and skips the next', () => {
    const board = buildLeaderboard(
      members,
      [
        { userId: 'a', points: 10, createdAt: today },
        { userId: 'b', points: 10, createdAt: today },
      ],
      'c',
      today,
    );
    expect(board.map(e => e.rank)).toEqual([1, 1, 3]);
  });

  it('includes level and streak', () => {
    const [first] = buildLeaderboard(
      members,
      [{ userId: 'a', points: 60, createdAt: today }],
      'a',
      today,
    );
    expect(first).toMatchObject({ level: 2, streak: 1 });
  });
});

describe('teamGoal', () => {
  it('rounds the percentage and flags completion', () => {
    expect(teamGoal(1, 3)).toEqual({
      completed: 1,
      total: 3,
      percent: 33,
      reached: false,
    });
    expect(teamGoal(4, 4)).toEqual({
      completed: 4,
      total: 4,
      percent: 100,
      reached: true,
    });
  });

  it('is not reached with nothing to do', () => {
    expect(teamGoal(0, 0)).toEqual({
      completed: 0,
      total: 0,
      percent: 0,
      reached: false,
    });
  });
});

describe('date helpers', () => {
  it('finds the start of a UTC day', () => {
    expect(startOfUtcDay(day('2026-12-10')).toISOString()).toBe(
      '2026-12-10T00:00:00.000Z',
    );
  });

  it('builds a year window', () => {
    expect(yearWindow(2026)).toEqual({
      gte: new Date('2026-01-01T00:00:00.000Z'),
      lt: new Date('2027-01-01T00:00:00.000Z'),
    });
  });
});
