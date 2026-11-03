import type { UserProgress } from '@/types/points';

export interface ProgressSnapshot {
  earned: Set<string>;
  holidaysCompleted: number;
}

export const snapshotOf = (progress: UserProgress): ProgressSnapshot => ({
  earned: new Set(progress.badges.filter(b => b.earned).map(b => b.key)),
  holidaysCompleted: progress.holidaysCompleted,
});

// Names of badges earned since the previous snapshot. Holiday Hero is per holiday,
// so it shows up as a rise in the completed-holidays count.
export function newBadgeNames(
  previous: ProgressSnapshot,
  progress: UserProgress,
): string[] {
  const names = progress.badges
    .filter(b => b.earned && !previous.earned.has(b.key))
    .map(b => b.name);
  if (progress.holidaysCompleted > previous.holidaysCompleted) {
    names.push('Holiday Hero');
  }
  return names;
}
