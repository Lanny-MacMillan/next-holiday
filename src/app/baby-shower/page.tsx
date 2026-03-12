'use client';

import { HolidayPageTemplate } from '@/components/templates/HolidayPageTemplate';

const subsections = [
  {
    name: 'Gift Registry Tracker',
    description: 'Track baby shower gifts and registry items',
    href: '/baby-shower/gift-list',
    sliceKey: 'giftList',
    type: 'gift-list' as const,
  },
  {
    name: 'Guest List',
    description: 'Manage your baby shower guest list',
    href: '/baby-shower/guest-list',
    sliceKey: 'guestList',
    type: 'guest-list' as const,
  },
  {
    name: 'Games & Activities',
    description: 'Plan fun baby shower games and activities',
    href: '/baby-shower/games',
    sliceKey: 'tasks',
    category: 'Games',
    type: 'task' as const,
  },
];

export default function BabyShowerPage() {
  return (
    <HolidayPageTemplate
      holidayName="👶 Baby Shower"
      description="Celebrate new beginnings with joyful baby shower planning!"
      subsections={subsections}
      theme={{
        primaryColor: '#0891b2', // Cyan for Baby Shower (matches header mapping)
        accentColor: '#0e7490', // Darker cyan accent
        progressColor: '#0891b2', // Cyan for progress bar
      }}
      gradientClass="baby-shower-gradient"
      gamifiedBackgroundColor="bg-gradient-to-br from-cyan-400 to-cyan-600"
      holidayColor="bg-gradient-to-br from-cyan-400 to-cyan-600"
    />
  );
}
