import { useAppSelector } from '@/store/hooks';
import { useAuth0 } from '@auth0/auth0-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useHolidayBudget } from '@/hooks/useHolidayBudget';
import { getCardStyling } from '@/utils/cardShadows';
import { getHolidayAccentColor } from '@/utils/holidayUtils';
import { getHolidayIdFromRoute } from '@/utils/holidayUtils';
import { usePathname } from 'next/navigation';

interface BudgetInfo {
  budgetLimit: number;
  totalSpent: number;
  totalPlanned: number;
  remaining: number;
  percentageUsed: number;
  colorClass: string;
  statusText: string;
  progressBarColor: string;
}

interface BudgetDisplayProps {
  holiday?: string;
  holidayColor?: string;
  holidayId?: string; // New prop for DB-backed budgets
}

export function useBudgetInfo(holiday?: string, holidayId?: string): BudgetInfo {
  // Fallback to old logic for backward compatibility
  const { settings } = useAppSelector((state: any) => state.theme);

  // Get auth0User and holiday preferences for RTK Query
  const { user: auth0User } = useAuth0();
  const holidayPreferences = useAppSelector(
    (state: any) => state.home.data?.holidayPreferences || [],
  );

  // Determine holiday ID for RTK Query
  let queryHolidayId = holidayId;
  if (!queryHolidayId && holiday) {
    const routeHolidayId = getHolidayIdFromRoute(
      `/${holiday.toLowerCase()}`,
      holidayPreferences,
    );
    queryHolidayId = routeHolidayId || undefined;
  }

  // Use the new centralized budget hook (always call, hook handles undefined holidayId)
  const { budget, loading, error } = useHolidayBudget({
    holidayId: queryHolidayId,
  });

  // Use home data for gifts instead of RTK Query
  const homeData = useAppSelector((state: any) => state.home.data);
  const homeInitialized = useAppSelector((state: any) => state.home.initialized);

  // Get gifts from home data
  const gifts = (() => {
    if (!homeInitialized || !homeData?.holidayPreferences || !queryHolidayId) {
      return [];
    }

    const holidayPref = homeData.holidayPreferences.find(
      (h: any) => h.holidayId === queryHolidayId,
    );

    return holidayPref?.gifts || [];
  })();

  // Always use Redux home data for budget, fallback to DB budget if needed
  let budgetLimit = 0;
  let totalSpent = 0;
  let totalPlanned = 0;

  // Always calculate spent amount from completed gifts
  totalSpent = gifts.reduce((sum: number, gift: any) => {
    const price =
      typeof gift.price === 'number' ? gift.price : parseFloat(gift.price) || 0;
    // Only count completed gifts as purchased/spent
    return gift.isCompleted ? sum + price : sum;
  }, 0);

  // Always calculate planned amount from all gifts with prices
  totalPlanned = gifts.reduce((sum: number, gift: any) => {
    const price =
      typeof gift.price === 'number' ? gift.price : parseFloat(gift.price) || 0;
    return sum + price;
  }, 0);

  // Priority: 1. Redux home data, 2. DB budget, 3. Default
  if (queryHolidayId) {
    // Try to get budget from Redux home data first
    const holidayPref = holidayPreferences.find(
      (h: any) => h.holidayId === queryHolidayId,
    );
    if (holidayPref?.budget) {
      budgetLimit = holidayPref.budget;
    } else if (budget?.targetAmount) {
      // Fallback to DB budget
      budgetLimit = budget.targetAmount;
    } else {
      // Final fallback - use the budget from the user's data example
      budgetLimit = 100;
    }
  } else if (holiday) {
    // Fallback for legacy holiday prop usage
    const holidayPref = holidayPreferences.find((h: any) => h.holiday === holiday);
    if (holidayPref?.budget) {
      budgetLimit = holidayPref.budget;
    }
  }

  // Note: Removed special Thanksgiving budget slice handling
  // Now using home data for all holidays including Thanksgiving

  const remaining = budgetLimit - totalSpent;
  const percentageUsed = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;

  let colorClass = '';
  let statusText = '';
  let progressBarColor = '';

  if (percentageUsed <= 50) {
    colorClass =
      'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    statusText = 'Plenty of budget left';
    progressBarColor = 'bg-green-500';
  } else if (percentageUsed <= 75) {
    colorClass = 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/30';
    statusText = 'Budget getting tight';
    progressBarColor = 'bg-yellow-500';
  } else if (percentageUsed <= 100) {
    colorClass = 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
    statusText = 'Almost out of budget';
    progressBarColor = 'bg-red-500';
  } else {
    colorClass = 'text-red-800 dark:text-red-300 bg-red-200 dark:bg-red-900/50';
    statusText = 'Over budget!';
    progressBarColor = 'bg-red-700';
  }

  return {
    budgetLimit,
    totalSpent,
    totalPlanned,
    remaining,
    percentageUsed,
    colorClass,
    statusText,
    progressBarColor,
  };
}

export function BudgetDisplay({
  holiday,
  holidayColor,
  holidayId,
}: BudgetDisplayProps) {
  // Call ALL hooks first before any conditional logic
  const budgetInfo = useBudgetInfo(holiday, holidayId);
  const pathname = usePathname();
  const { settings } = useAppSelector((state: any) => state.theme);
  const { preferences } = useAppSelector((state: any) => state.userPreferences);
  const { isUserPlusMember, hasSubscription } = useSubscription();

  const isAuthorizedPlusMember = hasSubscription && isUserPlusMember;

  const isGamified =
    preferences?.displayMode === 'gamified' || settings.displayMode === 'gamified';

  // No early return - always render but conditionally show content
  const displayTitle = holiday ? `${holiday} Budget` : 'Gift Budget';

  if (!isAuthorizedPlusMember) return;
  // Don't render anything if no budget is set
  if (budgetInfo.budgetLimit === 0) {
    return null;
  }

  // If gamified is true, render the playful design
  if (isGamified) {
    const backgroundColor = holidayColor || getHolidayAccentColor(pathname);

    return (
      <div
        className={`relative card rounded-2xl p-3 sm:p-4 mb-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden tracking-widest text-white ${holidayColor}`}
        style={{
          ...getCardStyling({
            isDarkMode: false,
            isGamified: true,
            intensity: 'heavy',
          }),
        }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-white opacity-20 pointer-events-none"></div>
          <div className="absolute top-8 right-6 w-4 h-4 rounded-full bg-white opacity-15 pointer-events-none"></div>
          <div className="absolute bottom-6 left-8 w-5 h-5 rounded-full bg-white opacity-10 pointer-events-none"></div>
          <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-white opacity-20 pointer-events-none"></div>
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-3">
            <h3
              className="font-semibold text-white text-sm sm:text-base"
              style={{ fontFamily: 'var(--font-family-fredoka)' }}
            >
              {displayTitle}
            </h3>
            <span
              className="text-xs sm:text-sm font-medium text-white opacity-90"
              style={{ fontFamily: 'var(--font-family-fredoka)' }}
            >
              {budgetInfo.statusText}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs sm:text-sm mb-3">
            <div>
              <span
                className="font-medium text-white opacity-90"
                style={{ fontFamily: 'var(--font-family-fredoka)' }}
              >
                Spent:{' '}
              </span>
              <span
                className="font-bold text-white"
                style={{ fontFamily: 'var(--font-family-fredoka)' }}
              >
                ${budgetInfo.totalSpent.toFixed(2)}
              </span>
            </div>
            <div>
              <span
                className="font-medium text-white opacity-90"
                style={{ fontFamily: 'var(--font-family-fredoka)' }}
              >
                Remaining:{' '}
              </span>
              <span
                className={`font-bold ${
                  budgetInfo.remaining < 0 ? 'text-red-200' : 'text-white'
                }`}
                style={{ fontFamily: 'var(--font-family-fredoka)' }}
              >
                ${budgetInfo.remaining.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-xs mb-2">
              <span
                className="text-white opacity-90"
                style={{ fontFamily: 'var(--font-family-fredoka)' }}
              >
                Budget: ${budgetInfo.budgetLimit.toFixed(2)}
              </span>
              <span
                className="text-white opacity-90"
                style={{ fontFamily: 'var(--font-family-fredoka)' }}
              >
                {budgetInfo.percentageUsed.toFixed(1)}% used
              </span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2 sm:h-3 border border-white border-opacity-30">
              <div
                className={`h-2 sm:h-3 rounded-full transition-all ${budgetInfo.progressBarColor}`}
                style={{
                  width: `${Math.min(budgetInfo.percentageUsed, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Original clean, professional design
  return (
    <div
      className={`card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 mb-4 ${budgetInfo.colorClass}`}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
          {displayTitle}
        </h3>
        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
          {budgetInfo.statusText}
        </span>
      </div>
      <div className="flex justify-between items-center text-xs sm:text-sm">
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Spent:{' '}
          </span>
          <span className="font-bold text-gray-900 dark:text-white">
            ${budgetInfo.totalSpent.toFixed(2)}
          </span>
        </div>
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Remaining:{' '}
          </span>
          <span
            className={`font-bold ${
              budgetInfo.remaining < 0
                ? 'text-red-700 dark:text-red-300'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            ${budgetInfo.remaining.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="mt-2">
        <div className="flex justify-between text-xs mb-1 text-gray-600 dark:text-gray-400">
          <span>Budget: ${budgetInfo.budgetLimit.toFixed(2)}</span>
          <span>{budgetInfo.percentageUsed.toFixed(1)}% used</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 border border-gray-300 dark:border-gray-600">
          <div
            className={`h-2 rounded-full transition-all ${budgetInfo.progressBarColor}`}
            style={{ width: `${Math.min(budgetInfo.percentageUsed, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
