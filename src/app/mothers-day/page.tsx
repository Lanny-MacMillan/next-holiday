'use client';

import { HolidayPageTemplate } from '@/components/templates/HolidayPageTemplate';

const subsections = [
  {
    name: 'Gift Ideas',
    description: "Track gift ideas for Mother's Day",
    href: '/mothers-day/gift-list',
    sliceKey: 'giftList',
    category: 'Gifts',
    type: 'gift-list' as const,
  },
  {
    name: 'Card List',
    description: "Track cards to send on Mother's Day",
    href: '/mothers-day/cards',
    sliceKey: 'cards',
    type: 'task' as const,
  },
  {
    name: 'Event Planning',
    description: "Plan Mother's Day celebrations",
    href: '/mothers-day/events',
    sliceKey: 'events',
    type: 'task' as const,
  },
  {
    name: 'Tasks',
    description: "Stay on top of your Mother's Day to-dos",
    href: '/mothers-day/tasks',
    sliceKey: 'tasks',
    category: 'Tasks',
    type: 'task' as const,
  },
];

export default function MothersDayPage() {
  return (
    <HolidayPageTemplate
      holidayName="🌸 Mother's Day"
      description="Show your love and appreciation for mom!"
      subsections={subsections}
      theme={{
        primaryColor: '#ec4899', // Pink for Mother's Day
        accentColor: '#db2777', // Deeper pink accent
        progressColor: '#ec4899', // Pink for progress bar
      }}
      gradientClass="mothers-day-gradient"
      gamifiedBackgroundColor="bg-gradient-to-br from-pink-400 to-pink-600"
      holidayColor="bg-gradient-to-br from-pink-400 to-pink-600"
    />
  );
}
