'use client';

import { useGetLeaderboardQuery } from '@/store/api';
import UserAvatar from '@/components/common/UserAvatar';

interface LeaderboardProps {
  holidayId: string | null;
  holidayName: string;
}

export default function Leaderboard({ holidayId, holidayName }: LeaderboardProps) {
  const { data } = useGetLeaderboardQuery(
    { holidayId: holidayId ?? '' },
    { skip: !holidayId },
  );

  if (!data) return null;
  const { me, entries, team } = data;
  const alone = entries.length <= 1;

  return (
    <section
      aria-labelledby="leaderboard-heading"
      className="rounded-xl bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-gray-100 shadow p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="leaderboard-heading" className="text-lg font-semibold">
          {alone ? `Your ${holidayName} points` : `${holidayName} leaderboard`}
        </h2>
        {me && me.streak > 0 && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {me.streak}-day streak
          </span>
        )}
      </div>

      {me && (
        <div className="mt-3">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">Level {me.levelInfo.level}</span>
            <span className="text-gray-700 dark:text-gray-300">
              {me.points} pts,{' '}
              {me.levelInfo.pointsForNext - me.levelInfo.pointsIntoLevel} to level{' '}
              {me.levelInfo.level + 1}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Progress to next level"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(me.levelInfo.progress * 100)}
            className="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700"
          >
            <div
              className="h-2 rounded-full bg-emerald-600"
              style={{ width: `${Math.round(me.levelInfo.progress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {!alone && (
        <ol className="mt-4 flex flex-col gap-2">
          {entries.map(entry => (
            <li
              key={entry.userId}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                entry.isYou ? 'bg-emerald-50 dark:bg-emerald-950' : ''
              }`}
            >
              <span className="w-6 text-sm font-semibold tabular-nums">
                {entry.rank}
              </span>
              <UserAvatar
                userId={entry.userId}
                name={entry.name}
                picture={entry.picture}
                size="sm"
              />
              <span className="flex-1 truncate text-sm">
                {entry.name ?? 'Member'}
                {entry.isYou && ' (you)'}
              </span>
              <span className="text-xs text-gray-700 dark:text-gray-300">
                Lv {entry.level}
              </span>
              <span className="w-16 text-right text-sm font-semibold tabular-nums">
                {entry.points} pts
              </span>
            </li>
          ))}
        </ol>
      )}

      {team.total > 0 && (
        <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">
          {team.reached
            ? `Everything for ${holidayName} is done.`
            : `Team progress: ${team.completed} of ${team.total} items done (${team.percent}%).`}
        </p>
      )}
    </section>
  );
}
