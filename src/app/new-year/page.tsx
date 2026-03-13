'use client';

import { HolidayPageTemplate } from '@/components/templates/HolidayPageTemplate';

const subsections = [
  {
    name: 'Supplies List',
    description: 'Plan your party supplies and fireworks',
    href: '/new-year/supplies-list',
    sliceKey: 'giftList',
    category: 'Supplies List',
    type: 'gift-list' as const,
  },
  {
    name: 'Resolution Tracker',
    description: 'Track your New Year resolutions and goals',
    href: '/new-year/resolution-tracker',
    sliceKey: 'Resolutions',
    type: 'task' as const,
  },
  {
    name: 'Events',
    description: 'Plan your New Year events and celebrations',
    href: '/new-year/events',
    sliceKey: 'Events',
    type: 'task' as const,
  },
  {
    name: 'Decorations Checklist',
    description: 'Stay on top of your New Year decorations',
    href: '/new-year/decorations',
    sliceKey: 'Decorations',
    type: 'task' as const,
  },
];

export default function NewYearPage() {
  return (
    <HolidayPageTemplate
      holidayName="New Year"
      description="Ring in the new year with resolutions and celebrations!"
      subsections={subsections}
      theme={{
        primaryColor: '#fbbf24', // Golden for New Year
        accentColor: '#f59e0b', // Darker gold accent
        progressColor: '#fbbf24', // Golden for progress bar
      }}
      gradientClass="new-year-cards-gradient"
      gamifiedBackgroundColor="bg-gradient-to-br from-yellow-400 to-yellow-600"
      holidayColor="bg-gradient-to-br from-yellow-400 to-yellow-600"
    />
  );
}
