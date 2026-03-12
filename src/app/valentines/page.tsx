'use client';

import { HolidayPageTemplate } from '@/components/templates/HolidayPageTemplate';

const subsections = [
  {
    name: 'Gift List',
    description: "Track your Valentine's gift ideas",
    href: '/valentines/gift-list',
    sliceKey: 'giftList',
    category: 'Gifts',
    type: 'gift-list' as const,
  },
  {
    name: 'Date Ideas',
    description: 'Plan romantic activities and dates',
    href: '/valentines/date-ideas',
    sliceKey: 'dateIdeas',
    type: 'task' as const,
  },
  {
    name: 'Card List',
    description: "Track your Valentine's cards",
    href: '/valentines/cards',
    sliceKey: 'cards',
    category: 'Cards',
    type: 'task' as const,
  },
  {
    name: 'Reservations Tracker',
    description: 'Track restaurant and activity reservations',
    href: '/valentines/reservations',
    sliceKey: 'reservations',
    type: 'task' as const,
  },
];

export default function ValentinesPage() {
  return (
    <HolidayPageTemplate
      holidayName="❤️ Valentine's Day"
      description="Plan your romantic celebration with love and care!"
      subsections={subsections}
      theme={{
        primaryColor: '#ec4899', // Pink for Valentine's Day
        accentColor: '#db2777', // Deeper pink accent
        progressColor: '#ec4899', // Pink for progress bar
      }}
      gradientClass="valentines-gradient"
      gamifiedBackgroundColor="bg-gradient-to-br from-pink-400 to-pink-600"
      holidayColor="bg-gradient-to-br from-pink-400 to-pink-600"
    />
  );
}
