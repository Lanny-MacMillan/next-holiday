'use client';

import { HolidayPageTemplate } from '@/components/templates/HolidayPageTemplate';

const subsections = [
  {
    name: 'Shopping List',
    description: 'List of ingredients and supplies needed',
    href: '/thanksgiving/shopping-list',
    sliceKey: 'giftList',
    category: 'Shopping List',
    type: 'gift-list' as const,
  },
  {
    name: 'Meal Planning',
    description: 'Plan your Thanksgiving menu and dishes',
    href: '/thanksgiving/meal-planning',
    sliceKey: 'mealPlanning',
    type: 'task' as const,
  },
  {
    name: 'Guest List',
    description: 'Manage your Thanksgiving guest list',
    href: '/thanksgiving/guest-list',
    sliceKey: 'guestList',
    type: 'guest-list' as const,
  },
  {
    name: 'Decorations',
    description: 'Stay on top of your Thanksgiving decorations',
    href: '/thanksgiving/decorations',
    sliceKey: 'decorations',
    type: 'task' as const,
  },
  {
    name: 'Tasks',
    description: 'Stay on top of your Thanksgiving to-dos',
    href: '/thanksgiving/tasks',
    sliceKey: 'tasks',
    category: 'To-Do',
    type: 'task' as const,
  },
];

export default function ThanksgivingPage() {
  return (
    <HolidayPageTemplate
      holidayName="Thanksgiving"
      description="Plan your feast, guests, and gratitude!"
      subsections={subsections}
      theme={{
        primaryColor: '#d97706', // Amber for Thanksgiving
        accentColor: '#eab308', // Brighter amber accent
        progressColor: '#d97706', // Amber for progress bar
      }}
      gradientClass="thanksgiving-gradient"
      gamifiedBackgroundColor="bg-gradient-to-br from-amber-400 to-amber-600"
      holidayColor="bg-gradient-to-br from-amber-400 to-amber-600"
    />
  );
}
