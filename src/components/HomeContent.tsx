'use client';

import Link from 'next/link';
import HolidayCard from '@/components/cards/HolidayCard';
import HolidayHeader from '@/components/common/HolidayHeader';
import Footer from '@/components/common/Footer';
import { holidayData } from '@/data/holidayData';
import { getHolidayCountdownTime } from '@/utils/holidayUtils';
import { HomeData } from '@/types/home';
import { useHomePageData } from '@/hooks/useHomePageData';

interface HomeContentProps {
  homeData: HomeData;
}

export default function HomeContent({ homeData }: HomeContentProps) {
  // Use the new hook to get all holiday data from the database
  const { isLoading, createLegacyStateObject, holidayPreferences } =
    useHomePageData(homeData);

  // Filter holidays based on server data
  const getSelectedHolidays = () => {
    if (!holidayPreferences || holidayPreferences.length === 0) {
      return [];
    }

    const selectedHolidayNames = holidayPreferences.map(
      (choice: any) => choice.holiday,
    );

    const holidayNameMap: { [key: string]: string } = {
      christmas: 'Christmas',
      hanukkah: 'Hanukkah',
      kwanzaa: 'Kwanzaa',
      'new-year': 'New Year',
      valentines: "Valentine's Day",
      easter: 'Easter',
      halloween: 'Halloween',
      thanksgiving: 'Thanksgiving',
      'mothers-day': "Mother's Day",
      'fathers-day': "Father's Day",
      'fourth-of-july': 'Fourth of July',
      birthday: 'Birthday',
      anniversary: 'Anniversary',
      graduation: 'Graduation',
      'baby-shower': 'Baby Shower',
    };

    return holidayData.filter(holiday => {
      const holidayDisplayName = holidayNameMap[holiday.id];
      return selectedHolidayNames.includes(holidayDisplayName);
    });
  };

  const filteredHolidays = getSelectedHolidays();

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="min-h-screen christmas-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Loading your holiday data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen christmas-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayHeader
        holidayName="Next Holiday"
        description="Plan your holidays, stay organized, and have fun!"
        showBackButton={false}
        cycleIcons={true}
        availableHolidays={filteredHolidays.map(h => h.id)}
      />
      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        {filteredHolidays.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Welcome! To get started, select which holidays you'd like to plan for.
            </p>
            <Link
              href="/settings"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              Go to Settings to select holidays
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {filteredHolidays.map(holiday => {
              const holidayPreference = holidayPreferences?.find(
                (pref: any) => pref.holiday === holiday.name,
              );

              // Create state object using the new hook for this specific holiday
              const state = createLegacyStateObject(
                holidayPreference?.holidayId || '',
                holiday.name,
              );

              const progress = holiday.getProgress(state);
              const completedItems = holiday.getCompletedItems(state);
              const totalItems = holiday.getTotalItems(state);

              return (
                <HolidayCard
                  key={holiday.id}
                  id={holiday.id}
                  name={holiday.name}
                  description={holiday.description}
                  route={holiday.route}
                  color={holiday.color}
                  progress={progress}
                  completedItems={completedItems}
                  totalItems={totalItems}
                  holidayId={holidayPreference?.holidayId}
                  countdownTimer={holidayPreference?.countdownTimer}
                />
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
