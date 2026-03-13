'use client';

import { HolidayPageTemplate } from '@/components/templates/HolidayPageTemplate';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';

const subsections = [
  {
    name: 'Gift List',
    description: 'Track Halloween treats and costume supplies',
    href: '/halloween/gift-list',
    sliceKey: 'giftList',
    category: 'Gift List',
    type: 'gift-list' as const,
  },
  {
    name: 'Trick-or-Treat Prep',
    description: 'List of things needed for trick-or-treating',
    href: '/halloween/trick-or-treat-prep',
    sliceKey: 'trickOrTreatPrep',
    category: 'Trick or Treat Prep',
    type: 'task' as const,
  },
  {
    name: 'Costume Ideas',
    description: 'List of possible costume ideas and who they may be for',
    href: '/halloween/costume-ideas',
    sliceKey: 'costumeIdeas',
    category: 'Costume Ideas',
    type: 'task' as const,
  },
  {
    name: 'Decorations Checklist',
    description: 'Stay on top of your Halloween decorations',
    href: '/halloween/decorations',
    sliceKey: 'decorations',
    category: 'Decorations',
    type: 'task' as const,
  },
  {
    name: 'Tasks',
    description: 'Stay on top of your Halloween to-dos',
    href: '/halloween/tasks',
    sliceKey: 'tasks',
    category: 'To-Do',
    type: 'task' as const,
  },
];

export default function HalloweenPage() {
  return (
    <HolidayPageTemplate
      holidayName="🎃 Halloween"
      description="Plan your spooky celebrations and trick-or-treating adventures!"
      subsections={subsections}
      theme={{
        primaryColor: '#f97316', // Orange for Halloween
        accentColor: '#ea580c', // Darker orange accent
        progressColor: '#f97316', // Orange for progress bar
      }}
      gradientClass="halloween-gradient"
      gamifiedBackgroundColor="bg-gradient-to-br from-orange-400 to-orange-600"
      holidayColor="bg-gradient-to-br from-orange-400 to-orange-600"
    />
  );
}
