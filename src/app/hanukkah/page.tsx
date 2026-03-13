'use client';

import { HolidayPageTemplate } from '@/components/templates/HolidayPageTemplate';

const subsections = [
  {
    name: 'Gift List',
    description: 'Track your Hanukkah gift ideas',
    href: '/hanukkah/gift-list',
    sliceKey: 'giftList',
    type: 'gift-list' as const,
  },
  {
    name: 'Candle Lighting Tracker',
    description: 'Track the lighting of candles over the 8 days',
    href: '/hanukkah/candle-lighting',
    sliceKey: 'candleLighting',
    type: 'task' as const,
  },
  {
    name: 'Events',
    description: 'Plan your Hanukkah events and celebrations',
    href: '/hanukkah/events',
    sliceKey: 'events',
    type: 'task' as const,
  },
  {
    name: 'Decorations Checklist',
    description: 'Stay on top of your Hanukkah decorations',
    href: '/hanukkah/decorations',
    sliceKey: 'decorations',
    type: 'task' as const,
  },
  {
    name: 'Tasks',
    description: 'Stay on top of your holiday to-dos',
    href: '/hanukkah/tasks',
    sliceKey: 'tasks',
    type: 'task' as const,
  },
];

export default function HanukkahPage() {
  return (
    <HolidayPageTemplate
      holidayName="Hanukkah"
      description="Plan your Hanukkah with ease!"
      subsections={subsections}
      theme={{
        primaryColor: '#3b82f6', // Blue for Hanukkah
        accentColor: '#3b82f6', // Blue accent
        progressColor: '#3b82f6', // Blue for progress bar
      }}
      gradientClass="hanukkah-cards-gradient"
      gamifiedBackgroundColor="bg-gradient-to-br from-blue-400 to-blue-600"
    />
  );
}
