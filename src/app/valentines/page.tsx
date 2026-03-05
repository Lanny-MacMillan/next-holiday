'use client';

import { useAppSelector } from '@/store/hooks';
import { useAuth0 } from '@auth0/auth0-react';
import GiftListCard from '@/components/cards/gift/GiftListCard';
import HolidayTaskCard from '@/components/cards/holiday-task/HolidayTaskCard';
import HolidayHeader from '@/components/common/HolidayHeader';
import { getHolidayIdFromRoute } from '@/utils/holidayUtils';
import { getHolidayDataFromRedux } from '@/utils/holidayData';
import {
  selectHolidayPreferences,
  selectHomeInitialized,
  selectHomeData,
  selectHolidayPrefById,
} from '@/store/selectors/home';

const subsections = [
  {
    name: 'Gift List',
    description: "Track your Valentine's gift ideas",
    href: '/valentines/gift-list',
    sliceKey: 'giftList',
    category: 'Gifts',
    type: 'gift-list',
  },
  {
    name: 'Date Ideas',
    description: 'Plan romantic activities and dates',
    href: '/valentines/date-ideas',
    sliceKey: 'dateIdeas',
    type: 'task',
  },
  {
    name: 'Card List',
    description: "Track your Valentine's cards",
    href: '/valentines/cards',
    sliceKey: 'cards',
    category: 'Cards',
    type: 'task',
  },
  {
    name: 'Reservations Tracker',
    description: 'Track restaurant and activity reservations',
    href: '/valentines/reservations',
    sliceKey: 'reservations',
    type: 'task',
  },
];

export default function ValentinesPage() {
  const { user: auth0User } = useAuth0();
  const holidayPreferences = useAppSelector(selectHolidayPreferences);
  const homeInitialized = useAppSelector(selectHomeInitialized);

  // Get holiday ID for Valentine's Day - only resolve if home data is initialized
  const holidayId = homeInitialized
    ? getHolidayIdFromRoute('/valentines', holidayPreferences)
    : getHolidayIdFromRoute('/valentines', holidayPreferences); // Allow fallback for cold entry

  // Get data from Redux home state first, fallback to RTK Query if needed
  const homeData = useAppSelector(selectHomeData);

  // Get holiday data from Redux using memoized selector
  const holidayData = useAppSelector(state =>
    selectHolidayPrefById(state, holidayId),
  );

  // Use only Redux data - no API calls on holiday pages

  function getProgressData(sliceKey: string): {
    total: number;
    completed: number;
    progress: number;
  } {
    let total = 0;
    let completed = 0;

    // Use only Redux data - no fallback to API calls
    if (!holidayData || !homeInitialized) {
      return { total: 0, completed: 0, progress: 0 };
    }

    switch (sliceKey) {
      case 'cards':
        if (holidayData.cards) {
          total = holidayData.cards.length;
          completed = holidayData.cards.filter(
            (card: any) => card.isCompleted,
          ).length;
        }
        break;
      case 'giftList':
        if (holidayData.gifts) {
          total = holidayData.gifts.length;
          completed = holidayData.gifts.filter(
            (gift: any) => gift.isCompleted,
          ).length;
        }
        break;
      case 'dateIdeas':
        // Filter tasks by category for date ideas
        if (holidayData.tasks) {
          const dateTasks = holidayData.tasks.filter(
            (task: any) => task.category === 'Date Ideas',
          );
          total = dateTasks.length;
          completed = dateTasks.filter((task: any) => task.isCompleted).length;
        }
        break;
      case 'reservations':
        // Filter tasks by category for reservations
        if (holidayData.tasks) {
          const reservationTasks = holidayData.tasks.filter(
            (task: any) => task.category === 'Reservations',
          );
          total = reservationTasks.length;
          completed = reservationTasks.filter(
            (task: any) => task.isCompleted,
          ).length;
        }
        break;
      default:
        total = 0;
        completed = 0;
    }

    const progress = total > 0 ? completed / total : 0;

    return { total, completed, progress };
  }

  return (
    <div className="min-h-screen valentines-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayHeader
        holidayName="Valentine's Day"
        description="Plan your romantic celebration with ease!"
      />
      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        <ul className="flex flex-col gap-4">
          {subsections.map(section => {
            const { total, completed, progress } = getProgressData(section.sliceKey);

            // Determine which card component to use based on type
            if (section.type === 'gift-list') {
              // Calculate budget data from Redux
              const budgetLimit = holidayData?.budget || 0;
              const gifts = holidayData?.gifts || [];

              // Calculate spent amount from completed gifts
              const totalSpent = gifts.reduce((sum: number, gift: any) => {
                const price = parseFloat(gift.price) || 0;
                return gift.isCompleted ? sum + price : sum;
              }, 0);

              // Calculate total planned (all gifts with prices)
              const totalPlanned = gifts.reduce((sum: number, gift: any) => {
                return sum + (parseFloat(gift.price) || 0);
              }, 0);

              const remaining = budgetLimit - totalSpent;
              const budgetPercentage =
                budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;

              const getBudgetStatus = () => {
                if (budgetPercentage >= 80) return 'Budget nearly exhausted';
                if (budgetPercentage >= 60) return 'Moderate budget remaining';
                return 'Plenty of budget left';
              };

              return (
                <li key={section.name}>
                  <GiftListCard
                    holiday="Valentine's Day"
                    href={section.href}
                    budget={{
                      spent: totalSpent,
                      planned: totalPlanned,
                      total: budgetLimit,
                      remaining,
                      percentage: budgetPercentage,
                    }}
                    giftList={{
                      totalItems: total,
                      completedItems: completed,
                    }}
                    theme={{
                      primaryColor: '#ec4899', // Pink for Valentine's Day
                      accentColor: '#eab308',
                    }}
                    gamifiedBackgroundColor="bg-gradient-to-br from-pink-300 to-pink-500"
                  />
                </li>
              );
            } else {
              // Use HolidayTaskCard for tasks and other sections
              return (
                <li key={section.name}>
                  <HolidayTaskCard
                    holidayName="Valentine's Day"
                    sectionName={section.name}
                    description={section.description}
                    href={section.href}
                    totalItems={total}
                    completedItems={completed}
                    theme={{
                      primaryColor: '#ec4899', // Pink for Valentine's Day
                      accentColor: '#eab308',
                      progressColor: '#ec4899',
                    }}
                    gamifiedBackgroundColor="bg-gradient-to-br from-pink-300 to-pink-500"
                  />
                </li>
              );
            }
          })}
        </ul>
      </main>
      <footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
        &copy; {new Date().getFullYear()} Next Holiday
      </footer>
    </div>
  );
}
