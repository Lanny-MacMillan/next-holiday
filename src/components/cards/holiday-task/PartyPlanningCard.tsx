import React from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { getCardStyling } from '@/utils/cardShadows';

export interface PartyPlanningCardProps {
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
  gamified?: boolean; // New prop to control display mode
  holidayColor?: string; // New prop for background color
}

export default function PartyPlanningCard({
  holidayName,
  sectionName,
  description,
  href,
  totalItems,
  completedItems,
  theme = {},
  className = '',
  gamified = false,
  holidayColor,
}: PartyPlanningCardProps) {
  const {
    primaryColor = '#f59e0b', // Default amber for birthday
    accentColor = '#f59e0b', // Default amber accent
    backgroundColor: themeBackgroundColor, // Don't provide default fallback
    progressColor = '#f59e0b', // Default amber for progress bar
  } = theme;

  // Get display mode from Redux settings (fallback to prop)
  const { settings } = useAppSelector((state: any) => state.theme);
  const isGamifiedMode = gamified || settings.displayMode === 'gamified';
  const isDarkMode = settings.theme === 'dark';

  const progress = totalItems > 0 ? completedItems / totalItems : 0;
  const progressPercentage = progress * 100;

  // Get gamified background gradient
  const gamifiedBackground =
    holidayColor || 'bg-gradient-to-br from-yellow-300 to-yellow-500';

  if (isGamifiedMode) {
    // Gamified mode design
    return (
      <Link
        href={href}
        className={`block card rounded-2xl p-3 sm:p-5 transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden tracking-widest text-white ${gamifiedBackground} ${className}`}
        style={getCardStyling({
          isDarkMode,
          isGamified: true,
          intensity: 'heavy',
        })}
      >
        {/* Background texture overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-white opacity-20 pointer-events-none"></div>
          <div className="absolute top-8 right-6 w-4 h-4 rounded-full bg-white opacity-15 pointer-events-none"></div>
          <div className="absolute bottom-6 left-8 w-5 h-5 rounded-full bg-white opacity-10 pointer-events-none"></div>
          <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-white opacity-20 pointer-events-none"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <h3
              className="text-base sm:text-lg font-bold text-white truncate flex-1 min-w-0 mr-2"
              style={{ fontFamily: 'var(--font-family-fredoka)' }}
            >
              {sectionName}
            </h3>
            <span
              className="text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full bg-white bg-opacity-20 text-white flex-shrink-0"
              style={{ fontFamily: 'var(--font-family-fredoka)' }}
            >
              {totalItems}
            </span>
          </div>
          <p
            className="text-white opacity-90 text-xs sm:text-sm line-clamp-2"
            style={{ fontFamily: 'var(--font-family-fredoka)' }}
          >
            {description}
          </p>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-white bg-opacity-20 rounded-full h-2 border border-white border-opacity-30">
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
            <span
              className="text-xs text-white opacity-80"
              style={{ fontFamily: 'var(--font-family-fredoka)' }}
            >
              {Math.round(progressPercentage)}% complete
            </span>
            <span
              className="text-xs text-white opacity-80"
              style={{ fontFamily: 'var(--font-family-fredoka)' }}
            >
              {completedItems}/{totalItems} items
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Professional mode (existing design)
  return (
    <Link
      href={href}
      className={`block card card-party-planning rounded-2xl p-3 sm:p-5 transition hover:scale-[1.02] active:scale-100 ${className}`}
      style={{
        ...(themeBackgroundColor && { backgroundColor: themeBackgroundColor }),
        borderLeftWidth: '4px',
        borderLeftStyle: 'solid' as const,
        borderLeftColor: primaryColor,
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
