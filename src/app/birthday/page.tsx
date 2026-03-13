'use client';

import { HolidayPageTemplate } from '@/components/templates/HolidayPageTemplate';

const subsections = [
  {
    name: 'Gift List',
    description: 'Track birthday gift ideas',
    href: '/birthday/gift-list',
    sliceKey: 'giftList',
    category: 'Gifts',
    type: 'gift-list' as const,
  },
  {
    name: 'Guest List',
    description: 'Track your birthday guests',
    href: '/birthday/guest-list',
    sliceKey: 'guestList',
    type: 'guest-list' as const,
  },
  {
    name: 'Party Planning',
    description: 'Plan birthday parties and celebrations',
    href: '/birthday/party-planning',
    sliceKey: 'partyPlanning',
    category: 'Party Planning',
    type: 'task' as const,
  },
  {
    name: 'Cards List',
    description: 'Track birthday cards to send',
    href: '/birthday/cards',
    sliceKey: 'cards',
    category: 'Cards',
    type: 'task' as const,
  },
];

export default function BirthdayPage() {
  return (
    <HolidayPageTemplate
      holidayName="🎉 Birthday"
      description="Plan your birthday celebrations with style and joy!"
      subsections={subsections}
      theme={{
        primaryColor: '#f59e0b', // Amber for Birthday
        accentColor: '#d97706', // Darker amber accent
        progressColor: '#f59e0b', // Amber for progress bar
      }}
      gradientClass="birthday-gradient"
      gamifiedBackgroundColor="bg-gradient-to-br from-yellow-400 to-yellow-600"
      holidayColor="bg-gradient-to-br from-yellow-400 to-yellow-600"
    />
  );
}
