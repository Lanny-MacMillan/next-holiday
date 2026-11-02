export type PointEntity = 'task' | 'gift' | 'card';
type PointReason = 'task_low' | 'task_medium' | 'task_high' | 'gift' | 'card';

const TASK_POINTS = { low: 5, medium: 10, high: 20 } as const;
const GIFT_POINTS = 10;
const CARD_POINTS = 5;
const EARLY_BONUS = 5;
export const DAILY_CAP = 200;
// Points needed for level n are POINTS_PER_LEVEL * (n - 1)^2.
const POINTS_PER_LEVEL = 50;

export interface CompletionInput {
  entityType: PointEntity;
  priority?: keyof typeof TASK_POINTS | null;
  dueDate?: Date | null;
  completedAt: Date;
}

export interface Award {
  points: number;
  reason: PointReason | `${PointReason}+early`;
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export function startOfUtcDay(d: Date): Date {
  return new Date(`${dayKey(d)}T00:00:00.000Z`);
}

export function pointsFor(input: CompletionInput): Award {
  if (input.entityType === 'gift') return { points: GIFT_POINTS, reason: 'gift' };
  if (input.entityType === 'card') return { points: CARD_POINTS, reason: 'card' };

  const priority = input.priority ?? 'low';
  const base = TASK_POINTS[priority] ?? TASK_POINTS.low;
  const early = !!input.dueDate && dayKey(input.completedAt) < dayKey(input.dueDate);
  return {
    points: base + (early ? EARLY_BONUS : 0),
    reason: early ? `task_${priority}+early` : `task_${priority}`,
  };
}

// How many of the points still fit under today's cap, given what the user already earned today.
export function capAward(award: Award, earnedToday: number): Award | null {
  const room = DAILY_CAP - earnedToday;
  if (room <= 0) return null;
  return room >= award.points ? award : { ...award, points: room };
}

export interface Level {
  level: number;
  pointsIntoLevel: number;
  pointsForNext: number;
  progress: number;
}

export function levelFor(total: number): Level {
  const safe = Math.max(0, Math.floor(total));
  const level = Math.floor(Math.sqrt(safe / POINTS_PER_LEVEL)) + 1;
  const floor = POINTS_PER_LEVEL * (level - 1) ** 2;
  const ceiling = POINTS_PER_LEVEL * level ** 2;
  return {
    level,
    pointsIntoLevel: safe - floor,
    pointsForNext: ceiling - floor,
    progress: (safe - floor) / (ceiling - floor),
  };
}

// Consecutive UTC days with at least one award, counting back from today.
// A streak is still alive if the last award was yesterday.
export function streakFor(dates: Date[], today: Date): number {
  const days = new Set(dates.map(dayKey));
  const cursor = new Date(startOfUtcDay(today));
  if (!days.has(dayKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export interface PointRow {
  userId: string;
  points: number;
  createdAt: Date;
}

export interface Member {
  userId: string;
  name: string | null;
  picture: string | null;
}

export interface LeaderboardEntry extends Member {
  rank: number;
  points: number;
  level: number;
  streak: number;
  isYou: boolean;
}

// Standard competition ranking: equal points share a rank and the next rank is skipped.
export function buildLeaderboard(
  members: Member[],
  rows: PointRow[],
  viewerId: string,
  today: Date,
): LeaderboardEntry[] {
  const byUser = new Map<string, PointRow[]>();
  for (const row of rows) {
    const list = byUser.get(row.userId) ?? [];
    list.push(row);
    byUser.set(row.userId, list);
  }

  const entries = members.map(member => {
    const mine = byUser.get(member.userId) ?? [];
    const points = mine.reduce((sum, r) => sum + r.points, 0);
    return {
      ...member,
      points,
      level: levelFor(points).level,
      streak: streakFor(
        mine.map(r => r.createdAt),
        today,
      ),
      isYou: member.userId === viewerId,
    };
  });

  entries.sort(
    (a, b) => b.points - a.points || (a.name ?? '').localeCompare(b.name ?? ''),
  );

  let rank = 0;
  return entries.map((entry, i) => {
    if (i === 0 || entry.points !== entries[i - 1].points) rank = i + 1;
    return { ...entry, rank };
  });
}

export interface TeamGoal {
  completed: number;
  total: number;
  percent: number;
  reached: boolean;
}

export function teamGoal(completed: number, total: number): TeamGoal {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent, reached: total > 0 && completed === total };
}

export function yearWindow(year: number): { gte: Date; lt: Date } {
  return {
    gte: new Date(Date.UTC(year, 0, 1)),
    lt: new Date(Date.UTC(year + 1, 0, 1)),
  };
}
