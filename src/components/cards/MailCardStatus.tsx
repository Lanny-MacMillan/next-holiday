import { useAppSelector } from '@/store/hooks';
import { getCardStyling } from '@/utils/cardShadows';

interface MailCardStatusProps {
  totalCards: number;
  completedCards: number;
  incompleteCards: number;
  gamified?: boolean;
  holidayColor?: string;
}

export default function MailCardStatus({
  totalCards,
  completedCards,
  incompleteCards,
  gamified,
  holidayColor,
}: MailCardStatusProps) {
  const progressPercentage =
    totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

  // Get display mode from Redux settings and user preferences (fallback to prop)
  const { settings } = useAppSelector((state: any) => state.theme);
  const { preferences } = useAppSelector((state: any) => state.userPreferences);
  const isGamifiedMode =
    gamified ||
    preferences?.displayMode === 'gamified' ||
    settings.displayMode === 'gamified';
  const isDarkMode = preferences?.theme === 'dark' || settings.theme === 'dark';

  if (isGamifiedMode) {
    // Gamified mode design
    const backgroundColor =
      holidayColor || 'bg-gradient-to-br from-yellow-300 to-yellow-500';

    return (
      <div
        className={`relative card rounded-2xl p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden tracking-widest text-white border-2 border-white ${backgroundColor}`}
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
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
            <div>
              <p
                className="text-xs sm:text-sm text-white opacity-90"
                style={{ fontFamily: 'var(--font-family-fredoka)' }}
              >
                Total Cards
              </p>
              <p
                className="text-xl sm:text-2xl font-bold text-white"
                style={{ fontFamily: 'var(--font-family-fredoka)' }}
              >
                {totalCards}
              </p>
            </div>
            <div>
              <p
                className="text-xs sm:text-sm text-white opacity-90"
                style={{ fontFamily: 'var(--font-family-fredoka)' }}
              >
                Sent
              </p>
              <p
                className="text-xl sm:text-2xl font-bold text-white"
                style={{ fontFamily: 'var(--font-family-fredoka)' }}
              >
                {completedCards}
              </p>
            </div>
            <div>
              <p
                className="text-xs sm:text-sm text-white opacity-90"
                style={{ fontFamily: 'var(--font-family-fredoka)' }}
              >
                To Send
              </p>
              <p
                className="text-base sm:text-lg font-bold text-white"
                style={{ fontFamily: 'var(--font-family-fredoka)' }}
              >
                {incompleteCards}
              </p>
            </div>
            <div>
              <p
                className="text-xs sm:text-sm text-white opacity-90"
                style={{ fontFamily: 'var(--font-family-fredoka)' }}
              >
                Progress
              </p>
              <p
                className="text-base sm:text-lg font-bold text-white"
                style={{ fontFamily: 'var(--font-family-fredoka)' }}
              >
                {progressPercentage}%
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Professional mode (existing design)
  // Determine card class and colors based on holiday
  const getCardClass = () => {
    if (holidayColor?.includes('blue')) return 'card-events-fathers-day';
    if (holidayColor?.includes('green')) return 'card-events-christmas';
    if (holidayColor?.includes('red')) return 'card-events-fourth-of-july';
    if (holidayColor?.includes('purple')) {
      // Check if it's graduation specifically
      if (
        holidayColor?.includes('graduation') ||
        (typeof window !== 'undefined' &&
          window.location.pathname.includes('/graduation'))
      ) {
        return 'card-events-graduation';
      }
      return 'card-events-easter';
    }
    if (holidayColor?.includes('orange')) return 'card-events-new-year';
    if (holidayColor?.includes('yellow') || holidayColor?.includes('amber'))
      return 'card-events-birthday';
    return 'card-valentines'; // Default fallback
  };

  const getAccentColor = () => {
    if (holidayColor?.includes('blue')) return 'text-blue-600 dark:text-blue-400';
    if (holidayColor?.includes('green')) return 'text-green-600 dark:text-green-400';
    if (holidayColor?.includes('red')) return 'text-red-600 dark:text-red-400';
    if (holidayColor?.includes('purple'))
      return 'text-purple-600 dark:text-purple-400';
    if (holidayColor?.includes('orange'))
      return 'text-orange-600 dark:text-orange-400';
    if (holidayColor?.includes('yellow'))
      return 'text-yellow-600 dark:text-yellow-400';
    if (holidayColor?.includes('amber')) return 'text-amber-600 dark:text-amber-400';
    return 'text-pink-600 dark:text-pink-400'; // Default fallback
  };

  return (
    <div className={`card ${getCardClass()} rounded-2xl p-3 sm:p-4`}>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
        <div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Total Cards
          </p>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            {totalCards}
          </p>
        </div>
        <div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Sent</p>
          <p className={`text-xl sm:text-2xl font-bold ${getAccentColor()}`}>
            {completedCards}
          </p>
        </div>
        <div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            To Send
          </p>
          <p className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">
            {incompleteCards}
          </p>
        </div>
        <div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Progress
          </p>
          <p className={`text-base sm:text-lg font-bold ${getAccentColor()}`}>
            {progressPercentage}%
          </p>
        </div>
      </div>
    </div>
  );
}
