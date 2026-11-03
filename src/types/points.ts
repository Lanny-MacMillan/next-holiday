import type { BadgeStatus } from '@/lib/badges';
import type { LeaderboardEntry, Level, TeamGoal } from '@/lib/points';

export interface LeaderboardData {
  year: number | null;
  // false when nobody else has joined a share of this holiday; the card is then hidden
  shared: boolean;
  entries: LeaderboardEntry[];
  me: (LeaderboardEntry & { levelInfo: Level }) | null;
  team: TeamGoal;
  badges: BadgeStatus[];
}

export interface UserProgress {
  points: number;
  levelInfo: Level;
  streak: number;
  holidaysCompleted: number;
  badges: BadgeStatus[];
}
