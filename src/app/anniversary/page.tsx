'use client';

import { HolidayPageTemplate } from '@/components/templates/HolidayPageTemplate';

const subsections = [
  {
    name: 'Gift Ideas',
    description: 'Track anniversary gift ideas',
    href: '/anniversary/gift-list',
    sliceKey: 'giftList',
    category: 'Gifts',
    type: 'gift-list' as const,
  },
  {
    name: 'Date Ideas',
    description: 'Plan special anniversary dates',
    href: '/anniversary/date-ideas',
    sliceKey: 'dateIdeas',
    type: 'task' as const,
  },
];

export default function AnniversaryPage() {
  return (
    <HolidayPageTemplate
      holidayName="💕 Anniversary"
      description="Celebrate your special milestones with love and romance!"
      subsections={subsections}
      theme={{
        primaryColor: '#ec4899', // Pink for Anniversary
        accentColor: '#db2777', // Deeper pink accent
        progressColor: '#ec4899', // Pink for progress bar
      }}
      gradientClass="anniversary-gradient"
      gamifiedBackgroundColor="bg-gradient-to-br from-pink-400 to-pink-600"
      holidayColor="bg-gradient-to-br from-pink-400 to-pink-600"
    />
  );
}
