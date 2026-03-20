'use client';

import { HolidayPageTemplate } from '@/components/templates/HolidayPageTemplate';

const subsections = [
  {
    name: 'Basket List',
    description: 'Track your Easter basket items',
    href: '/easter/basket-list',
    sliceKey: 'giftList',
    category: 'Basket List',
    type: 'gift-list' as const,
  },
  {
    name: 'Tasks',
    description: 'Stay on top of your Easter to-dos',
    href: '/easter/tasks',
    sliceKey: 'tasks',
    type: 'task' as const,
  },
  {
    name: 'Event Planning',
    description: 'Plan your Easter events and celebrations',
    href: '/easter/events',
    sliceKey: 'events',
    type: 'task' as const,
  },
  {
    name: 'Decorations Checklist',
    description: 'Stay on top of your Easter decorations',
    href: '/easter/decorations',
    sliceKey: 'decorations',
    type: 'task' as const,
  },
];

export default function EasterPage() {
  return (
    <HolidayPageTemplate
      holidayName="Easter"
      description="Celebrate renewal and joy with family traditions!"
      subsections={subsections}
      theme={{
        primaryColor: '#a855f7', // Purple for Easter
        accentColor: '#9333ea', // Deeper purple accent
        progressColor: '#a855f7', // Purple for progress bar
      }}
      gradientClass="easter-gradient"
      gamifiedBackgroundColor="bg-gradient-to-br from-purple-400 to-purple-600"
      holidayColor="bg-gradient-to-br from-purple-400 to-purple-600"
    />
  );
}
