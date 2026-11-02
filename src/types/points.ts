import type { LeaderboardEntry, Level, TeamGoal } from '@/lib/points';

export interface LeaderboardData {
  year: number | null;
  entries: LeaderboardEntry[];
  me: (LeaderboardEntry & { levelInfo: Level }) | null;
  team: TeamGoal;
}
