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

const fathersDaySubsections = [
  {
    name: 'Gift Ideas',
    description: "Track gift ideas for Father's Day",
    href: '/fathers-day/gift-list',
    sliceKey: 'giftList',
    type: 'gift',
    category: 'Gifts',
  },
  {
    name: 'Card List',
    description: "Track cards to send on Father's Day",
    href: '/fathers-day/cards',
    sliceKey: 'cards',
    type: 'card',
  },
  {
    name: 'Event Planning',
    description: "Plan Father's Day celebrations",
    href: '/fathers-day/events',
    sliceKey: 'events',
    type: 'task',
  },
];

export default function FathersDayPage() {
  const { user: auth0User } = useAuth0();
  const holidayPreferences = useAppSelector(selectHolidayPreferences);
  const homeInitialized = useAppSelector(selectHomeInitialized);

  // Get holiday ID for Father's Day - only resolve if home data is initialized
  const holidayId = homeInitialized
    ? getHolidayIdFromRoute('/fathers-day', holidayPreferences)
    : getHolidayIdFromRoute('/fathers-day', holidayPreferences); // Allow fallback for cold entry

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
      case 'giftList':
        if (holidayData.gifts) {
          total = holidayData.gifts.length;
          completed = holidayData.gifts.filter(
            (gift: any) => gift.isCompleted,
          ).length;
        }
        break;
      case 'cards':
        if (holidayData.cards) {
          total = holidayData.cards.length;
          completed = holidayData.cards.filter(
            (card: any) => card.isCompleted,
          ).length;
        }
        break;
      case 'events':
        // Events are stored as tasks with category "Events" (like New Year)
        const eventTasks =
          holidayData.tasks?.filter((task: any) => task.category === 'Events') || [];
        total = eventTasks.length;
        completed = eventTasks.filter((task: any) => task.isCompleted).length;
        break;
      default:
        total = 0;
        completed = 0;
    }

    const progress = total > 0 ? completed / total : 0;
    return { total, completed, progress };
  }

  return (
    <div className="min-h-screen fathers-day-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayHeader
        holidayName="👨 Father's Day"
        description="Honor and celebrate Dad!"
      />
      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        <ul className="flex flex-col gap-4">
          {fathersDaySubsections.map(section => {
            const { total, completed } = getProgressData(section.sliceKey);

            // Use GiftListCard for gift list sections
            if (section.type === 'gift') {
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
                    holiday="Father's Day"
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
                      primaryColor: '#3b82f6', // Blue for Father's Day
                      accentColor: '#60a5fa',
                    }}
                    gamifiedBackgroundColor="bg-gradient-to-br from-blue-300 to-blue-500"
                  />
                </li>
              );
            }

            // Use HolidayTaskCard for task sections
            return (
              <li key={section.name}>
                <HolidayTaskCard
                  holidayName="Father's Day"
                  sectionName={section.name}
                  description={section.description}
                  href={section.href}
                  totalItems={total}
                  completedItems={completed}
                  theme={{
                    primaryColor: '#3b82f6', // Blue for Father's Day
                    accentColor: '#60a5fa',
                    progressColor: '#3b82f6',
                  }}
                  gamifiedBackgroundColor="bg-gradient-to-br from-blue-300 to-blue-500"
                />
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
