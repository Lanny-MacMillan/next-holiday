import { newBadgeNames, snapshotOf } from '@/lib/badgeNotice';
import type { UserProgress } from '@/types/points';

const badge = (key: string, name: string, earned: boolean) => ({
  key,
  name,
  description: '',
  earned,
  earnedAt: null,
  current: 0,
  target: 1,
});

const progress = (earned: string[], holidaysCompleted = 0): UserProgress => ({
  points: 0,
  levelInfo: { level: 1, pointsIntoLevel: 0, pointsForNext: 50, progress: 0 },
  streak: 0,
  holidaysCompleted,
  badges: [
    badge('first_step', 'First Step', earned.includes('first_step')),
    badge('gift_guru', 'Gift Guru', earned.includes('gift_guru')),
  ],
});

describe('newBadgeNames', () => {
  it('lists badges earned since the last snapshot', () => {
    const before = snapshotOf(progress(['first_step']));
    expect(newBadgeNames(before, progress(['first_step', 'gift_guru']))).toEqual([
      'Gift Guru',
    ]);
  });

  it('is empty when nothing changed', () => {
    const before = snapshotOf(progress(['first_step'], 1));
    expect(newBadgeNames(before, progress(['first_step'], 1))).toEqual([]);
  });

  it('reports Holiday Hero when the completed-holidays count rises', () => {
    const before = snapshotOf(progress([], 0));
    expect(newBadgeNames(before, progress([], 1))).toEqual(['Holiday Hero']);
  });
});
