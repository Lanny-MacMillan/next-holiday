import { BADGES } from '@/config/badgeConfigs';
import {
  badgeScope,
  badgeStats,
  badgeStatuses,
  holidayComplete,
  newlyEarned,
} from '@/lib/badges';

const today = new Date('2026-12-10T12:00:00.000Z');
const row = (over = {}) => ({
  entityType: 'task',
  reason: 'task_low',
  points: 5,
  createdAt: today,
  ...over,
});

describe('badge definitions', () => {
  it('have unique keys and positive targets', () => {
    expect(new Set(BADGES.map(b => b.key)).size).toBe(BADGES.length);
    expect(BADGES.every(b => b.target > 0)).toBe(true);
  });
});

describe('holidayComplete', () => {
  it('needs at least three items, all done', () => {
    expect(holidayComplete(3, 3)).toBe(true);
    expect(holidayComplete(2, 2)).toBe(false);
    expect(holidayComplete(2, 3)).toBe(false);
    expect(holidayComplete(0, 0)).toBe(false);
  });
});

describe('badgeStats', () => {
  it('counts the ledger by kind, early finishes, streak and level', () => {
    const rows = [
      row({ points: 25, reason: 'task_high+early' }),
      row({ entityType: 'gift', reason: 'gift', points: 10 }),
      row({
        entityType: 'card',
        reason: 'card',
        points: 5,
        createdAt: new Date('2026-12-09T12:00:00.000Z'),
      }),
    ];
    expect(badgeStats(rows, today, true)).toEqual({
      total: 3,
      tasks: 1,
      gifts: 1,
      cards: 1,
      early: 1,
      streak: 2,
      level: 1,
      holidayComplete: 1,
    });
  });

  it('is all zero for an empty ledger', () => {
    expect(Object.values(badgeStats([], today, false)).filter(v => v !== 0)).toEqual(
      [1],
    );
  });
});

describe('newlyEarned', () => {
  const stats = badgeStats([row()], today, false);

  it('returns badges whose target is met', () => {
    expect(newlyEarned(stats, 'h1', [])).toEqual([
      { key: 'first_step', scope: 'global' },
    ]);
  });

  it('skips badges already earned', () => {
    expect(
      newlyEarned(stats, 'h1', [{ key: 'first_step', scope: 'global' }]),
    ).toEqual([]);
  });

  it('scopes holiday badges to the holiday, and earns them again on another one', () => {
    const done = badgeStats([row()], today, true);
    const earned = [
      { key: 'first_step', scope: 'global' },
      { key: 'holiday_hero', scope: 'h1' },
    ];
    expect(newlyEarned(done, 'h1', earned)).toEqual([]);
    expect(newlyEarned(done, 'h2', earned)).toEqual([
      { key: 'holiday_hero', scope: 'h2' },
    ]);
  });

  it('earns streak badges at their targets', () => {
    const days = Array.from({ length: 7 }, (_, i) =>
      row({ createdAt: new Date(today.getTime() - i * 86400000) }),
    );
    const keys = newlyEarned(badgeStats(days, today, false), 'h1', []).map(
      b => b.key,
    );
    expect(keys).toEqual(expect.arrayContaining(['on_a_roll', 'week_warrior']));
  });
});

describe('badgeScope', () => {
  it('uses global for personal badges and the holiday id for holiday ones', () => {
    expect(
      badgeScope(
        BADGES.find(b => b.key === 'first_step')!,
        'h1',
      ),
    ).toBe('global');
    expect(
      badgeScope(
        BADGES.find(b => b.key === 'holiday_hero')!,
        'h1',
      ),
    ).toBe('h1');
  });
});

describe('badgeStatuses', () => {
  it('marks earned badges and caps progress at the target', () => {
    const stats = badgeStats(
      Array.from({ length: 12 }, () => row()),
      today,
      false,
    );
    const earnedAt = new Date('2026-12-01T00:00:00.000Z');
    const list = badgeStatuses(stats, 'h1', [
      { key: 'first_step', scope: 'global', earnedAt },
    ]);

    expect(list).toHaveLength(BADGES.length);
    expect(list.find(b => b.key === 'first_step')).toMatchObject({
      earned: true,
      earnedAt: earnedAt.toISOString(),
    });
    expect(list.find(b => b.key === 'task_tackler')).toMatchObject({
      earned: false,
      current: 10,
      target: 10,
    });
    expect(list.find(b => b.key === 'holiday_hero')).toMatchObject({
      earned: false,
      current: 0,
    });
  });

  it('does not count another holiday’s Holiday Hero', () => {
    const list = badgeStatuses(badgeStats([], today, false), 'h1', [
      { key: 'holiday_hero', scope: 'h2', earnedAt: today },
    ]);
    expect(list.find(b => b.key === 'holiday_hero')?.earned).toBe(false);
  });
});
