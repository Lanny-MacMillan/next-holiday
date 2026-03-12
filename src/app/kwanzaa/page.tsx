'use client';

import { HolidayPageTemplate } from '@/components/templates/HolidayPageTemplate';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';

const subsections = [
  {
    name: 'Gift List',
    description: 'Track your Kwanzaa gift ideas',
    href: '/kwanzaa/gift-list',
    sliceKey: 'giftList',
    category: 'Gift List',
    type: 'gift-list' as const,
  },
  {
    name: 'Daily Principle Tracker',
    description: 'Track the seven principles of Kwanzaa',
    href: '/kwanzaa/daily-principles',
    sliceKey: 'kwanzaaPrinciples',
    type: 'task' as const,
  },
  {
    name: 'Events',
    description: 'Plan your Kwanzaa events and celebrations',
    href: '/kwanzaa/events',
    sliceKey: 'events',
    type: 'task' as const,
  },
  {
    name: 'Decorations Checklist',
    description: 'Stay on top of your Kwanzaa decorations',
    href: '/kwanzaa/decorations',
    sliceKey: 'decorations',
    type: 'task' as const,
  },
];

export default function KwanzaaPage() {
  return (
    <HolidayPageTemplate
      holidayName="🕯️ Kwanzaa"
      description="Celebrate unity, heritage, and the seven principles!"
      subsections={subsections}
      theme={{
        primaryColor: '#dc2626', // Red for Kwanzaa
        accentColor: '#b91c1c', // Darker red accent
        progressColor: '#dc2626', // Red for progress bar
      }}
      gradientClass="kwanzaa-gradient"
      gamifiedBackgroundColor="bg-gradient-to-br from-red-400 to-red-600"
      holidayColor="bg-gradient-to-br from-red-400 to-red-600"
    />
  );
}
