import type { HolidayKey } from '@/config/baseFormConfigs';

export interface CardPageConfig {
  holidayKey: HolidayKey;
  title: string;
  description: string;
  gradientClass: string;
  headerColor: string;
  addButton: 'red' | 'blue' | 'purple' | 'pink' | 'amber';
  // Gradient for the summary and the cards, and the accent for buttons and the spinner
  gradient: string;
  accent: string;
}

export const cardPageConfigs = {
  birthday: {
    holidayKey: 'birthday',
    title: 'Birthday Cards',
    description: 'Keep track of your Birthday cards!',
    gradientClass: 'birthday-gradient',
    headerColor: 'yellow-500',
    addButton: 'amber',
    gradient: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    accent: '#f59e0b',
  },
  christmas: {
    holidayKey: 'christmas',
    title: 'Christmas Cards',
    description: 'Keep track of your cards!',
    gradientClass: 'christmas-cards-gradient',
    headerColor: 'red-500',
    addButton: 'red',
    gradient: 'bg-gradient-to-br from-red-300 to-red-500',
    accent: '#ef4444',
  },
  'fathers-day': {
    holidayKey: 'fathers-day',
    title: 'Fathers Day Cards',
    description: 'Keep track of your Fathers Day cards!',
    gradientClass: 'fathers-day-gradient',
    headerColor: 'blue-500',
    addButton: 'blue',
    gradient: 'bg-gradient-to-br from-blue-400 to-blue-600',
    accent: '#3b82f6',
  },
  graduation: {
    holidayKey: 'graduation',
    title: 'Graduation Cards',
    description: 'Keep track of your Graduation cards!',
    gradientClass: 'graduation-gradient',
    headerColor: 'purple-500',
    addButton: 'purple',
    gradient: 'bg-gradient-to-br from-purple-400 to-purple-600',
    accent: '#8b5cf6',
  },
  'mothers-day': {
    holidayKey: 'mothers-day',
    title: "Mother's Day Cards",
    description: "Keep track of your Mother's Day cards!",
    gradientClass: 'mothers-day-gradient',
    headerColor: 'pink-500',
    addButton: 'pink',
    gradient: 'bg-gradient-to-br from-pink-300 to-pink-500',
    accent: '#ec4899',
  },
  valentines: {
    holidayKey: 'valentines',
    title: 'Valentines Cards',
    description: 'Keep track of your Valentines cards!',
    gradientClass: 'valentines-gradient',
    headerColor: 'pink-500',
    addButton: 'pink',
    gradient: 'bg-gradient-to-br from-pink-400 to-pink-600',
    accent: '#ec4899',
  },
} satisfies Record<string, CardPageConfig>;
