'use client';

import { HolidayPageTemplate } from '@/components/templates/HolidayPageTemplate';

const subsections = [
  {
    name: 'Gift List',
    description: 'Track graduation gift ideas',
    href: '/graduation/gift-list',
    sliceKey: 'giftList',
    category: 'Gifts',
    type: 'gift-list' as const,
  },
  {
    name: 'Guest List',
    description: 'Manage guests for graduation parties',
    href: '/graduation/guest-list',
    sliceKey: 'guestList',
    type: 'guest-list' as const,
  },
  {
    name: 'Event Planning',
    description: 'Plan graduation ceremonies or parties',
    href: '/graduation/events',
    sliceKey: 'events',
    category: 'Events',
    type: 'task' as const,
  },
  {
    name: 'Cards List',
    description: 'Track graduation cards to send',
    href: '/graduation/cards',
    sliceKey: 'cards',
    category: 'Cards',
    type: 'task' as const,
  },
  {
    name: 'Tasks',
    description: 'Stay on top of your graduation to-dos',
    href: '/graduation/tasks',
    sliceKey: 'tasks',
    category: 'Tasks',
    type: 'task' as const,
  },
];

export default function GraduationPage() {
  return (
    <HolidayPageTemplate
      holidayName="Graduation"
      description="Celebrate achievements and plan memorable graduation events!"
      subsections={subsections}
      theme={{
        primaryColor: '#8b5cf6', // Purple for Graduation
        accentColor: '#7c3aed', // Darker purple accent
        progressColor: '#4f358a', // Purple for progress bar
      }}
      gradientClass="graduation-gradient"
      gamifiedBackgroundColor="bg-gradient-to-br from-purple-400 to-purple-600"
      holidayColor="bg-gradient-to-br from-purple-400 to-purple-600"
    />
  );
}
