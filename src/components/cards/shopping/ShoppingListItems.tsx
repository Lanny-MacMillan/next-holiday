import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { getCardStyling } from '@/utils/cardShadows';

export interface ShoppingItem {
  id: string;
  name: string;
  description?: string;
  amount: number;
  category: string;
  date: string;
  isExpense: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ShoppingListItemsProps<T extends ShoppingItem = ShoppingItem> {
  items: T[];
  title?: string;
  emptyMessage?: string;
  onEditItem: (item: T) => void;
  onDeleteItem: (itemId: string) => void;
  accentColor?: string;
  accentColorLight?: string;
  accentColorDark?: string;
  gamified?: boolean;
  holidayColor?: string;
}

// Shopping-themed icons for gamified mode
const ShoppingIcon = ({
  amount,
  className = '',
}: {
  amount: number;
  className?: string;
}) => {
  const getIcon = (amount: number) => {
    if (amount >= 100) return '🛒';
    if (amount >= 50) return '🛍️';
    if (amount >= 25) return '📦';
    return '🛒';
  };

  return <div className={`text-xl sm:text-2xl ${className}`}>{getIcon(amount)}</div>;
};

export default function ShoppingListItems<T extends ShoppingItem = ShoppingItem>({
  items,
  title = 'Shopping Items',
  emptyMessage = 'No shopping items yet. Add your first item!',
  onEditItem,
  onDeleteItem,
  accentColor = 'amber',
  accentColorLight = 'amber-100',
  accentColorDark = 'amber-800',
  gamified = false,
  holidayColor = 'bg-amber-600',
}: ShoppingListItemsProps<T>) {
  // Get display mode from Redux settings and user preferences (fallback to prop)
  const { settings } = useAppSelector((state: any) => state.theme);
  const { preferences } = useAppSelector((state: any) => state.userPreferences);
  const isGamifiedMode =
    gamified ||
    preferences?.displayMode === 'gamified' ||
    settings.displayMode === 'gamified';
  const isDarkMode = preferences?.theme === 'dark' || settings.theme === 'dark';

  return (
    <div className="space-y-4">
      <h2 className="text-base sm:text-lg font-semibold text-gray-800">{title}</h2>
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
          {emptyMessage}
        </div>
      ) : (
        items.map((item: T) => {
          if (isGamifiedMode) {
            // Gamified mode design
            return (
              <div
                key={item.id}
                className={`relative card rounded-2xl p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden ${holidayColor} text-white tracking-wide border-2 border-white`}
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
                      onDeleteItem(item.id);
                    }}
                    className="text-red-700 hover:text-red-900 text-xl sm:text-2xl font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors cursor-pointer"
                    title="Delete item"
                    style={{
                      pointerEvents: 'auto',
                    }}
                  >
                    <span className="text-2xl sm:text-3xl font-bold select-none">
                      ×
                    </span>
                  </button>
                </div>

                <div className="relative z-10">
                  <div className="flex items-start space-x-3">
                    {/* Shopping Icon */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                      <ShoppingIcon amount={item.amount} />
                    </div>

                    {/* Shopping Content */}
                    <div
                      className="flex-1 min-w-0"
                      style={{ fontFamily: 'var(--font-family-fredoka)' }}
                    >
                      <div className="font-semibold text-white text-sm sm:text-base">
                        {item.name}
                      </div>
                      {item.description && (
                        <div className="text-xs sm:text-sm text-white opacity-90 mt-1">
                          {item.description}
                        </div>
                      )}
                      <div className="flex gap-2 sm:gap-4 text-xs text-white opacity-80 mt-1">
                        <span>${item.amount.toFixed(2)}</span>
                        <span>{item.category}</span>
                      </div>
                      <div className="text-xs text-white opacity-90 mt-1">
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 mt-3">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onEditItem(item);
                      }}
                      className="text-white border border-yellow-300 hover:bg-yellow-300 hover:text-white text-xs sm:text-sm px-2 py-1 rounded transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          // Professional mode (existing design)
          return (
            <div
              key={item.id}
              className={`bg-white rounded-lg shadow-md p-3 sm:p-4 border-l-4 border-${accentColor}-500`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500">
                    <span
                      className={`bg-${accentColorLight} text-${accentColorDark} px-2 py-1 rounded text-xs sm:text-sm`}
                    >
                      {item.category}
                    </span>
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-base sm:text-lg font-bold text-${accentColor}-600`}
                  >
                    ${item.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onEditItem(item)}
                    className={`text-gray-400 hover:text-${accentColor}-600 transition-colors text-sm sm:text-base`}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors text-sm sm:text-base"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
