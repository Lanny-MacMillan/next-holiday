'use client';

import { useGetUserProgressQuery } from '@/store/api';
import BadgeList from '@/components/common/BadgeList';

export default function ProgressCard() {
  const { data } = useGetUserProgressQuery();
  if (!data) return null;
  const { levelInfo, points, streak, holidaysCompleted, badges } = data;
  const percent = Math.round(levelInfo.progress * 100);

  return (
    <div className="card card-settings rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white  border-b border-gray-200 dark:border-gray-700 pb-4">
        Your progress
      </h2>
      <div className="text-gray-800 dark:text-gray-200">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">
            Level {levelInfo.level}, {points} pts
          </span>
          <span className="text-gray-700 dark:text-gray-300">
            {levelInfo.pointsForNext - levelInfo.pointsIntoLevel} pts to level{' '}
            {levelInfo.level + 1}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Progress to next level"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700"
        >
          <div
            className="h-2 rounded-full bg-emerald-600"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
          {streak > 0 ? `${streak}-day streak` : 'No streak yet'}
          {`, ${holidaysCompleted} ${holidaysCompleted === 1 ? 'holiday' : 'holidays'} completed`}
        </p>
        <BadgeList badges={badges} />
      </div>
    </div>
  );
}
