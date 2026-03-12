'use client';

import { HolidayPageTemplate } from '@/components/templates/HolidayPageTemplate';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';

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
    sliceKey: 'events', // Changed from 'tasks' to 'events'
    category: 'Events',
    type: 'task' as const,
  },
  {
    name: 'Cards List',
    description: 'Track graduation cards to send',
    href: '/graduation/cards',
    sliceKey: 'cards',
    type: 'gift-list' as const, // Changed from 'task' to 'gift-list'
  },
];

export default function GraduationPage() {
  console.log('GraduationPage component rendered');

  // Debug: Add logging to see what data the template is using
  try {
    const { holidayData, getProgressData } = useHolidayPageData();

    console.log('Graduation Page Debug:', {
      holidayData,
      giftListProgress: getProgressData('giftList'),
      guestListProgress: getProgressData('guestList'),
      tasksProgress: getProgressData('tasks'),
      cardsProgress: getProgressData('cards'),
    });
  } catch (error) {
    console.error('Error in useHolidayPageData:', error);
  }

  return (
    <HolidayPageTemplate
      holidayName="🎓 Graduation"
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
