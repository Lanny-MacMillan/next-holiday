'use client';

import { useEffect } from 'react';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { BudgetDisplay } from '@/components/common/BudgetDisplay';
import HolidayTaskCard from '@/components/cards/holiday-task/HolidayTaskCard';
import GuestListCard from '@/components/cards/guest/GuestListCard';
import GiftListCard from '@/components/cards/gift/GiftListCard';
import HolidayHeader from '@/components/common/HolidayHeader';
import CountdownWithInvite from '@/components/common/CountdownWithInvite';
import SharedIndicator from '@/components/common/SharedIndicator';

const fourthOfJulySubsections = [
  {
    name: 'Supplies List',
    description: 'Track all your Fourth of July supplies',
    href: '/fourth-of-july/supplies-list',
    sliceKey: 'gifts',
    type: 'gift-list',
  },
  {
    name: 'Tasks',
    description: 'Stay on top of your Fourth of July to-dos',
    href: '/fourth-of-july/tasks',
    sliceKey: 'tasks',
    category: 'Tasks',
    type: 'task' as const,
  },
  {
    name: 'Event Planning',
    description: 'Plan your Fourth of July celebrations',
    href: '/fourth-of-july/events',
    sliceKey: 'tasks',
    category: 'Events',
  },
  {
    name: 'Guest List',
    description: 'Manage your Fourth of July guest list',
    href: '/fourth-of-july/guest-list',
    sliceKey: 'guestList',
    type: 'guest-list',
  },
  {
    name: 'Decorations Checklist',
    description: 'Track decorations and supplies',
    href: '/fourth-of-july/decorations',
    sliceKey: 'tasks',
    category: 'Decorations',
  },
];

export default function FourthOfJulyPage() {
  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();
  // Show message if holiday doesn't exist
  if (!holidayId) {
    return (
      <div className="min-h-screen fourth-of-july-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
        <HolidayHeader
          holidayName="Fourth of July"
          description="Celebrate independence and freedom!"
        />
        <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Fourth of July Holiday Not Set Up
            </h3>
            <p className="text-red-700 mb-4">
              To use Fourth of July features, you need to add Fourth of July to your
              holiday preferences first.
            </p>
            <p className="text-red-600 text-sm">
              Please go to your home page and add Fourth of July to your holiday
              list.
            </p>
          </div>
        </main>
      </div>
    );
  }

  function getProgressData(
    sliceKey: string,
    category?: string,
  ): {
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
      case 'tasks':
        // Filter tasks by category - for events, look for category "Events"
        if (holidayData.tasks) {
          const filteredTasks = category
            ? holidayData.tasks.filter((task: any) => task.category === category)
            : holidayData.tasks;
          total = filteredTasks.length;
          completed = filteredTasks.filter((task: any) => task.isCompleted).length;
        }
        break;
      case 'gifts':
        if (holidayData.gifts) {
          total = holidayData.gifts.length;
          completed = holidayData.gifts.filter(
            (gift: any) => gift.isCompleted,
          ).length;
        }
        break;
      case 'guestList':
        // Guest lists are stored separately from tasks
        if (holidayData.guestLists) {
          const guestLists = holidayData.guestLists || [];
          total = guestLists.length;
          completed = guestLists.filter(
            (guest: any) => guest.rsvpStatus === 'confirmed',
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
    <div className="min-h-screen fourth-of-july-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayHeader
        holidayName="🎆 Fourth of July"
        description="Celebrate independence and freedom!"
      />
      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        <ul className="flex flex-col gap-4">
          {fourthOfJulySubsections.map(section => {
            const { total, completed } = getProgressData(
              section.sliceKey,
              section.category,
            );

            // Use GiftListCard for gift list sections
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
                    holiday="Fourth of July"
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
                      primaryColor: '#dc2626', // Red for Fourth of July
                      accentColor: '##f87171', // Red accent
                    }}
                    gamifiedBackgroundColor="bg-gradient-to-br from-red-400 to-red-600"
                  />
                </li>
              );
            }

            // Use GuestListCard for guest list section
            if (section.sliceKey === 'guestList') {
              return (
                <li key={section.name}>
                  <GuestListCard
                    holiday="Fourth of July"
                    href={section.href}
                    theme={{
                      primaryColor: '#dc2626', // Red for Fourth of July
                      accentColor: '#f87171',
                    }}
                    holidayColor="bg-gradient-to-br from-red-400 to-red-600"
                  />
                </li>
              );
            }

            // Use HolidayTaskCard for task sections
            return (
              <li key={section.name}>
                <HolidayTaskCard
                  holidayName="Fourth of July"
                  sectionName={section.name}
                  description={section.description}
                  href={section.href}
                  totalItems={total}
                  completedItems={completed}
                  theme={{
                    primaryColor: '#dc2626', // Red for Fourth of July
                    accentColor: '#f87171',
                    progressColor: '#dc2626',
                  }}
                  gamifiedBackgroundColor="bg-gradient-to-br from-red-400 to-red-600"
                />
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
