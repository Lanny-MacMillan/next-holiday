import React from 'react';
import HolidayTaskCard from './HolidayTaskCard';

export default function HolidayTaskCardExample() {
  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        HolidayTaskCard Component Examples
      </h2>

      {/* Christmas Examples */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Christmas Theme</h3>
        <div className="space-y-4">
          <HolidayTaskCard
            holidayName="Christmas"
            sectionName="Cards"
            description="Track your holiday cards"
            href="/christmas/cards"
            totalItems={5}
            completedItems={2}
            theme={{
              primaryColor: '#22c55e',
              progressColor: '#22c55e',
            }}
          />
          <HolidayTaskCard
            holidayName="Christmas"
            sectionName="Tasks"
            description="Stay on top of your holiday to-dos"
            href="/christmas/tasks"
            totalItems={8}
            completedItems={6}
            theme={{
              primaryColor: '#22c55e',
              progressColor: '#22c55e',
            }}
          />
        </div>
      </div>

      {/* Valentine's Day Examples */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Valentine's Day Theme
        </h3>
        <div className="space-y-4">
          <HolidayTaskCard
            holidayName="Valentine's Day"
            sectionName="Cards"
            description="Track your Valentine's cards"
            href="/valentines/cards"
            totalItems={3}
            completedItems={1}
            theme={{
              primaryColor: '#ec4899',
              progressColor: '#ec4899',
            }}
          />
          <HolidayTaskCard
            holidayName="Valentine's Day"
            sectionName="Tasks"
            description="Stay on top of your Valentine's to-dos"
            href="/valentines/tasks"
            totalItems={6}
            completedItems={4}
            theme={{
              primaryColor: '#ec4899',
              progressColor: '#ec4899',
            }}
          />
        </div>
      </div>
    </div>
  );
}
