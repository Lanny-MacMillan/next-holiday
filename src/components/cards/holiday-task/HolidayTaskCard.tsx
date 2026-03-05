import React from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { getCardStyling } from '@/utils/cardShadows';

export interface HolidayTaskCardProps {
  holidayName: string;
  sectionName: string;
  description: string;
  href: string;
  totalItems: number;
  completedItems: number;
  theme?: {
    primaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    progressColor?: string;
  };
  className?: string;
  gamified?: boolean;
  gamifiedBackgroundColor?: string; // New prop for background color
}

export default function HolidayTaskCard({
  holidayName,
  sectionName,
  description,
  href,
  totalItems,
  completedItems,
  theme = {},
  className = '',
  gamified = false,
  gamifiedBackgroundColor,
}: HolidayTaskCardProps) {
  const {
    primaryColor = '#22c55e', // Default green
    accentColor = '#eab308', // Default yellow
    backgroundColor: themeBackgroundColor,
    progressColor = '#22c55e', // Default green for progress bar
  } = theme;

  // Get display mode from Redux settings
  const { settings } = useAppSelector((state: any) => state.theme);
  const isGamifiedMode = settings.displayMode === 'gamified';
  const isDarkMode = settings.theme === 'dark';

  const progress = totalItems > 0 ? completedItems / totalItems : 0;
  const progressPercentage = progress * 100;

  // Use provided background color or fallback to default
  const backgroundColor =
    gamifiedBackgroundColor || 'bg-gradient-to-br from-gray-400 to-gray-600';

  if (isGamifiedMode) {
    // Gamified mode design - NO green border
    return (
      <Link
        href={href}
        className={`block card card-cards rounded-2xl p-3 sm:p-5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] overflow-hidden ${backgroundColor} text-white ${className}`}
        style={{
          borderWidth: isDarkMode ? '3px' : '0',
          borderStyle: 'solid',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 1)' : 'transparent',
          filter: getCardStyling({
            isDarkMode,
            isGamified: true,
            intensity: 'heavy',
          }).filter,
        }}
      >
        {/* Background texture overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white opacity-20"></div>
          <div className="absolute top-12 right-8 w-6 h-6 rounded-full bg-white opacity-15"></div>
          <div className="absolute bottom-8 left-12 w-10 h-10 rounded-full bg-white opacity-10"></div>
          <div className="absolute bottom-4 right-4 w-4 h-4 rounded-full bg-white opacity-20"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base sm:text-lg font-bold text-white truncate flex-1 min-w-0 mr-2">
              {sectionName}
            </h3>
            <span className="text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full bg-white bg-opacity-20 text-white flex-shrink-0">
              {totalItems}
            </span>
          </div>
          <p className="text-white opacity-90 text-xs sm:text-sm line-clamp-2">
            {description}
          </p>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-white bg-opacity-20 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: primaryColor,
              }}
            />
          </div>
          {/* Progress text */}
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-white opacity-80">
              {Math.round(progressPercentage)}% complete
            </span>
            <span className="text-xs text-white opacity-80">
              {completedItems}/{totalItems} items
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Professional mode (existing design) - WITH green border
  return (
    <Link
      href={href}
      className={`block card card-cards rounded-2xl p-3 sm:p-5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${className}`}
      style={{
        ...(themeBackgroundColor && { backgroundColor: themeBackgroundColor }),
        borderLeftWidth: '4px',
        borderLeftStyle: 'solid',
        borderLeftColor: primaryColor,
        filter: getCardStyling({
          isDarkMode,
          isGamified: false,
          intensity: 'medium',
        }).filter,
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white truncate flex-1 min-w-0 mr-2">
          {sectionName}
        </h3>
        <span
          className="text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: `${primaryColor}20`,
            color: primaryColor,
          }}
        >
          {totalItems}
        </span>
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm line-clamp-2">
        {description}
      </p>
      {/* Progress bar */}
      <div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: `${progressPercentage}%`,
            backgroundColor: progressColor,
          }}
        />
      </div>
      {/* Progress text */}
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-gray-500 dark:text-gray-500">
          {Math.round(progressPercentage)}% complete
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-500">
          {completedItems}/{totalItems} items
        </span>
      </div>
    </Link>
  );
}
