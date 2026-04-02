import React from 'react';
import { Card } from '@/store/slices/cardsSlice';
import { useAppSelector } from '@/store/hooks';
import { getCardStyling } from '@/utils/cardShadows';
import { getCardGamifiedBackgroundColor } from '@/utils/gamifiedUtils';

interface HolidayCardProps {
  card: Card;
  onToggle: (cardId: string) => void;
  onEdit: (card: Card) => void;
  onDelete: (cardId: string) => void;
  loading?: boolean;
  theme?: {
    accentColor?: string;
    hoverColor?: string;
  };
  borderColor?: string; // Border color for the left border
  gamified?: boolean; // New prop to control display mode
  gamifiedBackgroundColor?: string; // New prop for background color
}

// Card-themed icons for gamified mode
const CardIcon = ({
  hasAddress,
  className = '',
}: {
  hasAddress: boolean;
  className?: string;
}) => {
  return <div className={`text-2xl ${className}`}>{hasAddress ? '📮' : '💌'}</div>;
};

const HolidayCard: React.FC<HolidayCardProps> = ({
  card,
  onToggle,
  onEdit,
  onDelete,
  loading = false,
  theme = {},
  borderColor,
  gamified = false,
  gamifiedBackgroundColor,
}) => {
  const { settings } = useAppSelector((state: any) => state.theme);
  const { preferences } = useAppSelector((state: any) => state.userPreferences);
  const isGamifiedMode =
    gamified ||
    preferences?.displayMode === 'gamified' ||
    settings.displayMode === 'gamified';
  const isDarkMode = preferences?.theme === 'dark' || settings.theme === 'dark';

  const accentColor = theme.accentColor;
  const hoverColor =
    theme.hoverColor || 'hover:bg-green-50 dark:hover:bg-green-900/20';

  const borderStyle: React.CSSProperties = borderColor
    ? {
        borderLeftWidth: '4px',
        borderLeftStyle: 'solid' as const,
        borderLeftColor: borderColor,
      }
    : {};
  const backgroundColor =
    gamifiedBackgroundColor || getCardGamifiedBackgroundColor();

  if (isGamifiedMode) {
    return (
      <li
        className={`relative card rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden ${backgroundColor} text-white ${
          card.isCompleted ? 'opacity-60' : ''
        }`}
        style={getCardStyling({
          isDarkMode,
          isGamified: true,
          intensity: 'heavy',
        })}
        onClick={() => onToggle(card.id)}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-white opacity-20 pointer-events-none"></div>
          <div className="absolute top-8 right-6 w-4 h-4 rounded-full bg-white opacity-15 pointer-events-none"></div>
          <div className="absolute bottom-6 left-8 w-5 h-5 rounded-full bg-white opacity-10 pointer-events-none"></div>
          <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-white opacity-20 pointer-events-none"></div>
        </div>

        {/* Delete Button - Top Right Corner */}
        <div
          className="absolute top-2 right-2 z-50"
          onClick={e => {
            e.stopPropagation();
          }}
        >
          <button
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(card.id);
            }}
            className="text-red-700 hover:text-red-900 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors cursor-pointer"
            title="Delete card"
            style={{
              pointerEvents: 'auto',
            }}
          >
            <span className="text-3xl font-bold select-none">×</span>
          </button>
        </div>

        <div className="relative z-10">
          <div className="flex items-start space-x-3">
            {/* Card Icon */}
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
              <CardIcon hasAddress={!!card.address} />
            </div>

            {/* Card Content */}
            <div className="flex-1 min-w-0">
              <div
                className={`font-semibold text-white ${
                  card.isCompleted ? 'line-through opacity-60' : ''
                }`}
              >
                To: {card.recipient}
              </div>
              {card.address && (
                <div
                  className={`text-xs mt-1 text-white opacity-90 ${
                    card.isCompleted ? 'line-through opacity-60' : ''
                  }`}
                >
                  📍 {card.address}
                </div>
              )}
              {card.message && (
                <div
                  className={`text-xs mt-1 text-white opacity-90 ${
                    card.isCompleted ? 'line-through opacity-60' : ''
                  }`}
                >
                  {card.message}
                </div>
              )}
              {card.isCompleted && card.completedDate && (
                <div className="text-xs text-green-200 mt-1">
                  Completed: {new Date(card.completedDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1 mt-3">
            <button
              onClick={e => {
                e.stopPropagation();
                onEdit(card);
              }}
              className="text-white border border-yellow-300 hover:bg-yellow-300 hover:text-white text-sm px-2 py-1 rounded transition-colors"
              disabled={loading}
            >
              Edit
            </button>
          </div>
        </div>
      </li>
    );
  }

  // Professional mode
  return (
    <li
      className={`flex items-center px-4 py-3 cursor-pointer ${hoverColor} ${
        card.isCompleted ? 'opacity-60' : ''
      }`}
      style={borderStyle}
      onClick={() => onToggle(card.id)}
    >
      <input
        type="checkbox"
        checked={card.isCompleted}
        readOnly
        className="mr-3"
        style={{ accentColor }}
      />
      <div className="flex-1">
        <div
          className={`text-gray-800 dark:text-white ${
            card.isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : ''
          }`}
        >
          To: {card.recipient}
        </div>
        {card.address && (
          <div
            className={`text-xs mt-1 ${
              card.isCompleted
                ? 'text-gray-400 dark:text-gray-500 line-through'
                : 'text-gray-500 dark:text-gray-500'
            }`}
          >
            📍 {card.address}
          </div>
        )}
        {card.message && (
          <div
            className={`text-xs mt-1 ${
              card.isCompleted
                ? 'text-gray-400 dark:text-gray-500 line-through'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {card.message}
          </div>
        )}
        {card.isCompleted && card.completedDate && (
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            Completed: {new Date(card.completedDate).toLocaleDateString()}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={e => {
            e.stopPropagation();
            onEdit(card);
          }}
          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
          disabled={loading}
        >
          Edit
        </button>
        <button
          onClick={e => {
            e.stopPropagation();
            onDelete(card.id);
          }}
          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
          disabled={loading}
        >
          Delete
        </button>
      </div>
    </li>
  );
};

export default HolidayCard;
