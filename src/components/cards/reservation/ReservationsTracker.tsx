import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { getCardStyling } from '@/utils/cardShadows';

interface Guest {
  id: string;
  name: string;
  rsvpStatus: 'pending' | 'confirmed' | 'declined';
  numberOfGuests: number;
  isCompleted?: boolean;
}

interface ReservationsTrackerProps {
  guests?: Guest[];
  tasks?: any[];
  title?: string;
  accentColor?: string;
  gamified?: boolean; // New prop to control display mode
}

const ReservationsTracker: React.FC<ReservationsTrackerProps> = ({
  guests = [],
  tasks = [],
  title = 'Guest Tracker',
  accentColor = '#ec4899', // Default pink
  gamified = false,
}) => {
  // Get display mode from Redux settings (fallback to prop)
  const { settings } = useAppSelector((state: any) => state.theme);

  const isGamifiedMode = gamified || settings.displayMode === 'gamified';
  const isDarkMode = settings.theme === 'dark';

  // Use tasks if provided, otherwise use guests
  const totalItems =
    tasks.length > 0
      ? tasks.length
      : guests.reduce((sum, guest) => sum + guest.numberOfGuests, 0);
  const confirmedItems =
    tasks.length > 0
      ? tasks.filter(task => task.isCompleted).length
      : guests
          .filter(guest => guest.rsvpStatus === 'confirmed')
          .reduce((sum, guest) => sum + guest.numberOfGuests, 0);
  const pendingItems =
    tasks.length > 0
      ? tasks.filter(task => !task.isCompleted).length
      : guests
          .filter(guest => guest.rsvpStatus === 'pending')
          .reduce((sum, guest) => sum + guest.numberOfGuests, 0);
  const declinedItems =
    guests.length > 0
      ? guests
          .filter(guest => guest.rsvpStatus === 'declined')
          .reduce((sum, guest) => sum + guest.numberOfGuests, 0)
      : 0;

  const completionPercentage =
    totalItems > 0 ? Math.round((confirmedItems / totalItems) * 100) : 0;

  if (isGamifiedMode) {
    // Gamified mode design
    return (
      <div
        className="card rounded-2xl p-3 sm:p-4 transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden"
        style={{
          ...getCardStyling({
            isDarkMode,
            isGamified: true,
            intensity: 'heavy',
          }),
          border: `4px solid ${accentColor}`,
        }}
      >
        {/* Background texture overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-white opacity-20 pointer-events-none"></div>
          <div className="absolute top-8 right-6 w-4 h-4 rounded-full bg-white opacity-15 pointer-events-none"></div>
          <div className="absolute bottom-6 left-8 w-5 h-5 rounded-full bg-white opacity-10 pointer-events-none"></div>
          <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-white opacity-20 pointer-events-none"></div>
        </div>

        <div className="relative z-10">
          <h3
            className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4 text-center"
            style={{ fontFamily: 'var(--font-family-fredoka)' }}
          >
            {title}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-center mb-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Total Guests
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                {totalItems}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Confirmed
              </p>
              <p
                className="text-xl sm:text-2xl font-bold"
                style={{ color: accentColor }}
              >
                {confirmedItems}
              </p>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-3 gap-2 text-center mb-4">
            <div
              className="bg-yellow-100 dark:bg-yellow-900/20 rounded-lg p-2"
              style={{ border: '3px solid #eab308' }}
            >
              <p className="text-xs font-semibold" style={{ color: '#eab308' }}>
                Pending
              </p>
              <p
                className="text-base sm:text-lg font-bold"
                style={{ color: '#eab308' }}
              >
                {pendingItems}
              </p>
            </div>
            <div
              className="bg-green-100 dark:bg-green-900/20 rounded-lg p-2"
              style={{ border: '3px solid #16a34a' }}
            >
              <p className="text-xs font-semibold" style={{ color: '#16a34a' }}>
                Confirmed
              </p>
              <p
                className="text-base sm:text-lg font-bold"
                style={{ color: '#16a34a' }}
              >
                {confirmedItems}
              </p>
            </div>
            <div
              className="bg-red-100 dark:bg-red-900/20 rounded-lg p-2"
              style={{ border: '3px solid #dc2626' }}
            >
              <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>
                Declined
              </p>
              <p
                className="text-base sm:text-lg font-bold"
                style={{ color: '#dc2626' }}
              >
                {declinedItems}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {totalItems > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Confirmation Progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${completionPercentage}%`,
                    backgroundColor: accentColor,
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Professional mode (existing design)
  return (
    <div className="card rounded-2xl p-3 sm:p-4">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4 text-center">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-4 text-center mb-4">
        <div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Total Guests
          </p>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            {totalItems}
          </p>
        </div>
        <div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Confirmed
          </p>
          <p
            className="text-xl sm:text-2xl font-bold"
            style={{ color: accentColor }}
          >
            {confirmedItems}
          </p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-3 gap-2 text-center mb-4">
        <div className="bg-yellow-100 dark:bg-yellow-900/20 rounded-lg p-2">
          <p className="text-xs text-yellow-700 dark:text-yellow-300">Pending</p>
          <p className="text-base sm:text-lg font-bold text-yellow-700 dark:text-yellow-300">
            {pendingItems}
          </p>
        </div>
        <div className="bg-green-100 dark:bg-green-900/20 rounded-lg p-2">
          <p className="text-xs text-green-700 dark:text-green-300">Confirmed</p>
          <p className="text-base sm:text-lg font-bold text-green-700 dark:text-green-300">
            {confirmedItems}
          </p>
        </div>
        <div className="bg-red-100 dark:bg-red-900/20 rounded-lg p-2">
          <p className="text-xs text-red-700 dark:text-red-300">Declined</p>
          <p className="text-base sm:text-lg font-bold text-red-700 dark:text-red-300">
            {declinedItems}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {totalItems > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Confirmation Progress</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${completionPercentage}%`,
                backgroundColor: accentColor,
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsTracker;
