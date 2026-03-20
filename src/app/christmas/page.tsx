'use client';

import { HolidayPageTemplate } from '@/components/templates/HolidayPageTemplate';

const subsections = [
  {
    name: 'Gift List',
    description: 'Track your gift ideas',
    href: '/christmas/gift-list',
    sliceKey: 'giftList',
    type: 'gift-list' as const,
  },
  {
    name: 'Cards',
    description: 'Track your Christmas cards',
    href: '/christmas/cards',
    sliceKey: 'cards',
    type: 'task' as const,
  },
  {
    name: 'Tasks',
    description: 'Stay on top of your Christmas to-dos',
    href: '/christmas/tasks',
    sliceKey: 'tasks',
    type: 'task' as const,
  },
];

export default function ChristmasPage() {
  return (
    <HolidayPageTemplate
      holidayName="Christmas"
      description="Make this Christmas magical!"
      subsections={subsections}
      theme={{
        primaryColor: '#dc2626', // Red for Christmas
        accentColor: '#16a34a', // Green accent
        progressColor: '#dc2626', // Red for progress bar
      }}
      gradientClass="christmas-gradient"
      gamifiedBackgroundColor="bg-gradient-to-br from-red-400 to-red-600"
      holidayColor="bg-gradient-to-br from-red-400 to-red-600"
    />
  );
}
