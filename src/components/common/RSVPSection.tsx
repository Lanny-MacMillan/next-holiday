import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { getCardStyling } from '@/utils/cardShadows';

interface RSVPSectionProps {
  title: string;
  items: any[];
  rsvpStatus: 'pending' | 'confirmed' | 'declined';
  emptyMessage: string;
  renderItem: (item: any) => React.ReactNode;
  cardClassName?: string;
  borderColor?: string;
  customTitle?: string; // Optional custom title override
  gamified?: boolean; // New prop to control display mode
  holidayColor?: string; // New prop for background color in gamified mode
}

const RSVPSection: React.FC<RSVPSectionProps> = ({
  title,
  items,
  rsvpStatus,
  emptyMessage,
  renderItem,
  cardClassName = '',
  borderColor,
  customTitle,
  gamified = false,
  holidayColor,
}) => {
  // Get display mode from Redux settings (fallback to prop)
  const { settings } = useAppSelector((state: any) => state.theme);
  const isGamifiedMode = gamified || settings.displayMode === 'gamified';
  const isDarkMode = settings.theme === 'dark';

  // Calculate total guests for this section
  const totalGuests = items.reduce(
    (sum, item) => sum + (item.numberOfGuests || 1),
    0,
  );

  const getTitleColor = () => {
    if (isGamifiedMode) {
      // In gamified mode, use dark text for light mode, white text for dark mode
      return 'text-gray-800 dark:text-white';
    }
    // All RSVP statuses use black text in light mode, white in dark mode
    return 'text-black dark:text-white';
  };

  const getEmptyMessageColor = () => {
    if (isGamifiedMode) {
      return 'text-white opacity-80';
    }
    switch (rsvpStatus) {
      case 'confirmed':
        return 'text-green-300 dark:text-green-600';
      case 'declined':
        return 'text-red-300 dark:text-red-600';
      case 'pending':
      default:
        return 'text-yellow-300 dark:text-yellow-600';
    }
  };

  const getStatusLabel = () => {
    switch (rsvpStatus) {
      case 'confirmed':
        return 'RSVP: Confirmed';
      case 'declined':
        return 'RSVP: Declined';
      case 'pending':
      default:
        return 'RSVP: Not-Confirmed';
    }
  };

  // Create title with guest count information
  const getSectionTitle = () => {
    const baseTitle = customTitle || getStatusLabel();
    const partyCount = items.length;
    const guestCount = totalGuests;

    if (partyCount === 0) {
      return `${baseTitle} (0)`;
    }

    // Show both party count and total guests if they differ
    if (partyCount === guestCount) {
      return `${baseTitle} (${partyCount})`;
    } else {
      return `${baseTitle} (${partyCount} party${
        partyCount !== 1 ? 'ies' : ''
      }, ${guestCount} guests)`;
    }
  };
  console.log('borderColor', borderColor);
  if (isGamifiedMode) {
    // Gamified mode design
    return (
      <div>
        <h2
          className={`font-semibold mb-2 text-base sm:text-lg ${getTitleColor()}`}
          style={{ fontFamily: 'var(--font-family-fredoka)' }}
        >
          {getSectionTitle()}
        </h2>
        {items.length === 0 ? (
          // Empty state - always use clean white card styling
          <div
            className={`card ${cardClassName} rounded-lg shadow-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700`}
            style={{
              ...getCardStyling({
                isDarkMode,
                isGamified: false,
                intensity: 'medium',
              }),
            }}
          >
            <div className="px-3 py-3 sm:px-4 sm:py-3 text-center">
              <div className="w-full text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                {emptyMessage}
              </div>
            </div>
          </div>
        ) : (
          // Non-empty state - render items in a card container with white border in dark mode
          <div
            className={`card ${cardClassName} rounded-lg shadow-sm overflow-hidden`}
            // style={{
            //   borderLeftWidth: isDarkMode ? '4px' : '0',
            //   borderLeftStyle: 'solid' as const,
            //   borderLeftColor: isDarkMode ? 'white' : 'transparent',
            //   ...getCardStyling({
            //     isDarkMode,
            //     isGamified: true,
            //     intensity: 'heavy',
            //   }),
            // }}
          >
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((item, index) => (
                <div key={item.id || item.email || index}>{renderItem(item)}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Professional mode (existing design)
  return (
    <div>
      <h2 className={`font-semibold mb-2 text-base sm:text-lg ${getTitleColor()}`}>
        {getSectionTitle()}
      </h2>
      {items.length === 0 ? (
        <div
          className={`card ${cardClassName} rounded-lg shadow-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700`}
          style={{
            ...getCardStyling({
              isDarkMode,
              isGamified: false,
              intensity: 'medium',
            }),
          }}
        >
          <div className="px-3 py-3 sm:px-4 sm:py-3 text-center">
            <div className={`${getEmptyMessageColor()} text-sm sm:text-base`}>
              {emptyMessage}
            </div>
          </div>
        </div>
      ) : (
        <div className={`card ${cardClassName} rounded shadow`}>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item, index) => (
              <li key={item.id || item.email || index}>{renderItem(item)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RSVPSection;
