import BadgeIcon from '@/components/common/BadgeIcon';
import type { BadgeStatus } from '@/lib/badges';

const NEW_BADGE_MS = 48 * 60 * 60 * 1000;

export default function BadgeList({ badges }: { badges: BadgeStatus[] }) {
  if (badges.length === 0) return null;
  const earnedCount = badges.filter(b => b.earned).length;
  const now = Date.now();

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold">
        Badges ({earnedCount} of {badges.length})
      </h3>
      <ul className="mt-2 grid gap-3 sm:grid-cols-2">
        {badges.map(badge => {
          const isNew =
            badge.earnedAt !== null &&
            now - new Date(badge.earnedAt).getTime() < NEW_BADGE_MS;
          return (
            <li key={badge.key} className="flex items-center gap-3">
              <BadgeIcon badgeKey={badge.key} earned={badge.earned} />
              <div className="min-w-0 text-sm">
                <p className="font-medium">
                  {badge.name}
                  {isNew && (
                    <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
                      New
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  {badge.description}
                  {badge.earned
                    ? ' (earned)'
                    : ` (${badge.current}/${badge.target})`}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
