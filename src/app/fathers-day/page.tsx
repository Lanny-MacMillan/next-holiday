'use client';

import { HolidayPageTemplate } from '@/components/templates/HolidayPageTemplate';

const subsections = [
  {
    name: 'Gift Ideas',
    description: "Track gift ideas for Father's Day",
    href: '/fathers-day/gift-list',
    sliceKey: 'gifts',
    category: 'Gifts',
    type: 'gift-list' as const,
  },
  {
    name: 'Tasks',
    description: "Stay on top of your Father's Day to-dos",
    href: '/fathers-day/tasks',
    sliceKey: 'tasks',
    category: 'Tasks',
    type: 'task' as const,
  },
  {
    name: 'Card List',
    description: "Track cards to send on Father's Day",
    href: '/fathers-day/cards',
    sliceKey: 'cards',
    category: 'Cards',
    type: 'task' as const,
  },
  {
    name: 'Event Planning',
    description: "Plan Father's Day celebrations",
    href: '/fathers-day/events',
    sliceKey: 'events',
    category: 'Events',
    type: 'task' as const,
  },
];

export default function FathersDayPage() {
  return (
    <HolidayPageTemplate
      holidayName="👨 Father's Day"
      description="Honor and celebrate dad with thoughtful gifts and memories!"
      subsections={subsections}
      theme={{
        primaryColor: '#3b82f6', // Blue for Father's Day
        accentColor: '#2563eb', // Darker blue accent
        progressColor: '#3b82f6', // Blue for progress bar
      }}
      gradientClass="fathers-day-gradient"
      gamifiedBackgroundColor="bg-gradient-to-br from-blue-400 to-blue-600"
      holidayColor="bg-gradient-to-br from-blue-400 to-blue-600"
    />
  );
}
