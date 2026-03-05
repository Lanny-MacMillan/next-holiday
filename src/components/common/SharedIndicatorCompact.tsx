'use client';

import { useAppSelector } from '@/store/hooks';
import { selectShareByHolidayKey, selectMembers } from '@/store/slices/sharesSlice';
import { createSelector } from '@reduxjs/toolkit';

interface SharedIndicatorCompactProps {
  holidayKey: string;
  className?: string;
}

// Create a memoized selector that handles the conditional logic for members
const selectMembersForDisplay = createSelector(
  [
    (state: any, holidayKey: string) => selectShareByHolidayKey(state, holidayKey),
    (state: any, holidayKey: string) => state,
  ],
  (share, state) => {
    if (share) {
      return selectMembers(state, share.shareId);
    }
    return [];
  },
);

export default function SharedIndicatorCompact({
  holidayKey,
  className = '',
}: SharedIndicatorCompactProps) {
  const share = useAppSelector(state => selectShareByHolidayKey(state, holidayKey));
  const members = useAppSelector(state =>
    selectMembersForDisplay(state, holidayKey),
  );

  if (!share) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Compact shared pill */}
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        <svg className="w-2.5 h-2.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Shared
      </span>

      {/* Compact member avatars */}
      <div className="flex -space-x-1">
        {members.slice(0, 2).map((memberId: string, index: number) => (
          <div
            key={memberId}
            className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300 border border-white dark:border-gray-800"
            title={`Member ${index + 1}`}
          >
            {memberId.charAt(0).toUpperCase()}
          </div>
        ))}
        {members.length > 2 && (
          <div
            className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400 border border-white dark:border-gray-800"
            title={`${members.length - 2} more members`}
          >
            +{members.length - 2}
          </div>
        )}
      </div>
    </div>
  );
}
