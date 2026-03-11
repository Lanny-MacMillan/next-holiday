'use client';

import { useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useAuth0 } from '@auth0/auth0-react';
import { BudgetDisplay } from '@/components/common/BudgetDisplay';
import GiftListCard from '@/components/cards/gift/GiftListCard';
import HolidayTaskCard from '@/components/cards/holiday-task/HolidayTaskCard';
import HolidayHeader from '@/components/common/HolidayHeader';
import Footer from '@/components/common/Footer';
import { getHolidayIdFromRoute } from '@/utils/holidayUtils';
import {
  selectHolidayPreferences,
  selectHomeInitialized,
  selectHomeData,
  selectHolidayPrefById,
} from '@/store/selectors/home';
import { getHolidayDataFromRedux } from '@/utils/holidayData';

const subsections = [
  {
    name: 'Resolution Tracker',
    description: 'Track your New Year resolutions and goals',
    href: '/new-year/resolution-tracker',
    sliceKey: 'resolutions',
    type: 'task',
  },
  {
    name: 'Supplies List',
    description: 'Plan your party supplies and fireworks',
    href: '/new-year/supplies-list',
    sliceKey: 'giftList',
    type: 'gift-list',
  },
  {
    name: 'Events',
    description: 'Plan your New Year events and celebrations',
    href: '/new-year/events',
    sliceKey: 'events',
    type: 'task',
  },
  {
    name: 'Decorations Checklist',
    description: 'Stay on top of your New Year decorations',
    href: '/new-year/decorations',
    sliceKey: 'decorations',
    type: 'task',
  },
];

export default function NewYearPage() {
  const { user: auth0User } = useAuth0();
  const holidayPreferences = useAppSelector(selectHolidayPreferences);
  const homeInitialized = useAppSelector(selectHomeInitialized);

  // Get holiday ID for New Year - only resolve if home data is initialized
  const holidayId = homeInitialized
    ? getHolidayIdFromRoute('/new-year', holidayPreferences)
    : getHolidayIdFromRoute('/new-year', holidayPreferences); // Allow fallback for cold entry

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
      case 'resolutions':
        // Resolutions are stored as tasks with category "Resolutions"
        const resolutionTasks =
          holidayData.tasks?.filter(
            (task: any) => task.category === 'Resolutions',
          ) || [];
        total = resolutionTasks.length;
        completed = resolutionTasks.filter((task: any) => task.isCompleted).length;
        break;
      case 'events':
        if (holidayData.tasks) {
          const eventTasks = holidayData.tasks.filter(
            (task: any) => task.category === 'Events',
          );
          total = eventTasks.length;
          completed = eventTasks.filter((event: any) => event.isCompleted).length;
        }
        break;
      case 'decorations':
        // Decorations are stored as tasks with category "Decorations"
        const decorationTasks =
          holidayData.tasks?.filter(
            (task: any) => task.category === 'Decorations',
          ) || [];
        total = decorationTasks.length;
        completed = decorationTasks.filter((task: any) => task.isCompleted).length;
        break;
      default:
        total = 0;
        completed = 0;
    }

    const progress = total > 0 ? completed / total : 0;

    return { total, completed, progress };
  }

  return (
    <div className="min-h-screen new-year-cards-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayHeader
        holidayName="New Year"
        description="Plan your New Year with ease!"
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
                    holiday="New Year"
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
                      primaryColor: '#d97706', // Amber for New Year
                      accentColor: '#d97706', // Amber accent
                    }}
                    gamifiedBackgroundColor="bg-gradient-to-br from-amber-400 to-amber-600"
                  />
                </li>
              );
            } else {
              // Use HolidayTaskCard for tasks and other sections
              return (
                <li key={section.name}>
                  <HolidayTaskCard
                    holidayName="New Year"
                    sectionName={section.name}
                    description={section.description}
                    href={section.href}
                    totalItems={total}
                    completedItems={completed}
                    theme={{
                      primaryColor: '#d97706', // Amber for New Year
                      accentColor: '#d97706', // Amber accent
                      progressColor: '#d97706', // Amber for progress bar
                    }}
                    gamifiedBackgroundColor="bg-gradient-to-br from-amber-400 to-amber-600"
                  />
                </li>
              );
            }
          })}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
