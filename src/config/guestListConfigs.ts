import type { HolidayKey } from '@/config/baseFormConfigs';

export interface GuestListConfig {
  holidayKey: HolidayKey;
  // Used for the guest card colours and the tracker title, e.g. "Fourth of July"
  holidayName: string;
  title: string;
  description: string;
  gradientClass: string;
  headerColor: string;
  addButton: 'red' | 'purple' | 'yellow' | 'cyan' | 'amber';
  accent: string;
  border: string;
  cardClassName?: string;
}

export const guestListConfigs = {
  'baby-shower': {
    holidayKey: 'baby-shower',
    holidayName: 'Baby Shower',
    title: 'Guest List',
    description: 'Keep track of your Baby Shower guests!',
    gradientClass: 'baby-shower-gradient',
    headerColor: 'cyan-500',
    addButton: 'cyan',
    accent: '#06b6d4',
    border: 'rgb(var(--color-cyan-500))',
  },
  birthday: {
    holidayKey: 'birthday',
    holidayName: 'Birthday',
    title: 'Guest List',
    description: 'Keep track of your Birthday guests!',
    gradientClass: 'birthday-gradient',
    headerColor: 'yellow-500',
    addButton: 'yellow',
    accent: '#f59e0b',
    border: 'rgb(var(--color-yellow-500))',
  },
  'fourth-of-july': {
    holidayKey: 'fourth-of-july',
    holidayName: 'Fourth of July',
    title: 'Guest List',
    description: 'Keep track of your Fourth of July guests!',
    gradientClass: 'fourth-of-july-gradient',
    headerColor: '#dc2626',
    addButton: 'red',
    accent: '#dc2626',
    border: 'rgb(var(--color-red-500))',
  },
  graduation: {
    holidayKey: 'graduation',
    holidayName: 'Graduation',
    title: 'Graduation Guest List',
    description: 'Manage your graduation celebration guest list!',
    gradientClass: 'graduation-gradient',
    headerColor: 'purple-500',
    addButton: 'purple',
    accent: '#8b5cf6',
    border: 'rgb(var(--color-purple-500))',
    cardClassName: 'card-guests-graduation',
  },
  thanksgiving: {
    holidayKey: 'thanksgiving',
    holidayName: 'Thanksgiving',
    title: 'Guest List',
    description: 'Keep track of your Thanksgiving guests!',
    gradientClass: 'thanksgiving-gradient',
    headerColor: 'amber-600',
    addButton: 'amber',
    accent: '#f97316',
    border: 'rgb(var(--color-orange-500))',
  },
} satisfies Record<string, GuestListConfig>;
