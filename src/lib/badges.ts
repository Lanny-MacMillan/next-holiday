import { BADGES, type BadgeDefinition, type BadgeStat } from '@/config/badgeConfigs';
import { levelFor, streakFor, type PointEntity } from '@/lib/points';

export type BadgeStats = Record<BadgeStat, number>;

interface LedgerRow {
  entityType: string;
  reason: string;
  points: number;
  createdAt: Date;
}

// A holiday only counts as finished once it has at least this many items, so a lone item doesn't earn it.
const MIN_ITEMS_FOR_HOLIDAY_BADGE = 3;

export function holidayComplete(completed: number, total: number): boolean {
  return total >= MIN_ITEMS_FOR_HOLIDAY_BADGE && completed === total;
}

export function badgeStats(
  rows: LedgerRow[],
  today: Date,
  isHolidayComplete: boolean,
): BadgeStats {
  const count = (type: PointEntity) =>
    rows.filter(r => r.entityType === type).length;
  const points = rows.reduce((sum, r) => sum + r.points, 0);
  return {
    total: rows.length,
    tasks: count('task'),
    gifts: count('gift'),
    cards: count('card'),
    early: rows.filter(r => r.reason.endsWith('+early')).length,
    streak: streakFor(
      rows.map(r => r.createdAt),
      today,
    ),
    level: levelFor(points).level,
    holidayComplete: isHolidayComplete ? 1 : 0,
  };
}

export const badgeScope = (badge: BadgeDefinition, holidayId: string) =>
  badge.scope === 'global' ? 'global' : holidayId;

export interface EarnedBadge {
  key: string;
  scope: string;
}

// Badges whose target is met and which are not already earned. Earned badges are
// never taken back, even if the items behind them are later un-completed.
export function newlyEarned(
  stats: BadgeStats,
  holidayId: string,
  already: EarnedBadge[],
): EarnedBadge[] {
  const have = new Set(already.map(a => `${a.key}:${a.scope}`));
  return BADGES.filter(b => stats[b.stat] >= b.target)
    .map(b => ({ key: b.key, scope: badgeScope(b, holidayId) }))
    .filter(b => !have.has(`${b.key}:${b.scope}`));
}

export interface BadgeStatus {
  key: string;
  name: string;
  description: string;
  earned: boolean;
  earnedAt: string | null;
  current: number;
  target: number;
}

export function badgeStatuses(
  stats: BadgeStats,
  holidayId: string,
  earned: Array<EarnedBadge & { earnedAt: Date }>,
): BadgeStatus[] {
  return BADGES.map(badge => {
    const scope = badgeScope(badge, holidayId);
    const hit = earned.find(e => e.key === badge.key && e.scope === scope);
    return {
      key: badge.key,
      name: badge.name,
      description: badge.description,
      earned: !!hit,
      earnedAt: hit ? hit.earnedAt.toISOString() : null,
      current: Math.min(stats[badge.stat], badge.target),
      target: badge.target,
    };
  });
}
