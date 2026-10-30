import type { HolidayKey } from '@/config/baseFormConfigs';

export interface GiftListConfig {
  holidayKey: HolidayKey;
  budgetName: string;
  title: string;
  description: string;
  gradientClass: string;
  // What the list holds, e.g. "Gift" and "gifts"
  itemName: string;
  itemPlural: string;
  cardClassName?: string;
  // Supplies lists use the gift list with a form that has no recipient
  formType?: 'gifts' | 'supplies';
  theme: {
    header: string;
    addButton:
      | 'red'
      | 'green'
      | 'blue'
      | 'purple'
      | 'pink'
      | 'orange'
      | 'yellow'
      | 'amber'
      | 'cyan';
    budget: string;
    accent: string;
    border: string;
    gamified: string;
    submit?: string;
  };
}

const purple: GiftListConfig['theme'] = {
  header: 'purple-500',
  addButton: 'purple',
  budget: 'bg-gradient-to-br from-purple-400 to-purple-600',
  accent: '#a855f7',
  border: 'rgb(var(--color-purple-500))',
  gamified: 'bg-gradient-to-br from-purple-400 to-purple-600',
};

export const giftListConfigs = {
  anniversary: {
    holidayKey: 'anniversary',
    budgetName: 'Anniversary',
    title: 'Anniversary Gift List',
    description: 'Track your Anniversary gift ideas!',
    gradientClass: 'anniversary-gradient',
    itemName: 'Gift',
    itemPlural: 'gifts',
    theme: {
      header: 'pink-500',
      addButton: 'pink',
      budget: 'bg-gradient-to-br from-pink-400 to-pink-600',
      accent: '#ec4899',
      border: 'rgb(var(--color-pink-500))',
      gamified: 'bg-gradient-to-br from-pink-400 to-pink-600',
    },
  },
  'baby-shower': {
    holidayKey: 'baby-shower',
    budgetName: 'Baby Shower',
    title: 'Baby Shower Gift List',
    description: 'Track your Baby Shower gift ideas!',
    gradientClass: 'baby-shower-gradient',
    itemName: 'Gift',
    itemPlural: 'gifts',
    theme: {
      header: 'cyan-500',
      addButton: 'cyan',
      budget: 'bg-gradient-to-br from-cyan-300 to-cyan-500',
      accent: '#06b6d4',
      border: 'rgb(var(--color-cyan-500))',
      gamified: 'bg-gradient-to-br from-cyan-300 to-cyan-500',
    },
  },
  birthday: {
    holidayKey: 'birthday',
    budgetName: 'Birthday',
    title: 'Birthday Gift List',
    description: 'Track your Birthday gift ideas!',
    gradientClass: 'birthday-gradient',
    itemName: 'Gift',
    itemPlural: 'gifts',
    theme: {
      header: 'yellow-500',
      addButton: 'yellow',
      budget: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
      accent: '#f59e0b',
      border: 'rgb(var(--color-yellow-500))',
      gamified: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
      submit: '#3b82f6',
    },
  },
  christmas: {
    holidayKey: 'christmas',
    budgetName: 'Christmas',
    title: 'Gift List',
    description: 'Keep track of gift ideas and purchases!',
    gradientClass: 'christmas-gifts-gradient',
    itemName: 'Gift',
    itemPlural: 'gifts',
    theme: {
      header: 'red-500',
      addButton: 'green',
      budget: 'bg-gradient-to-br from-red-400 to-red-600',
      accent: '#22c55e',
      border: 'rgb(var(--color-green-500))',
      gamified: 'bg-gradient-to-br from-red-400 to-red-600',
    },
  },
  easter: {
    holidayKey: 'easter',
    budgetName: 'Easter',
    title: 'Easter Basket',
    description: 'Keep track of Easter basket items and purchases!',
    gradientClass: 'easter-gradient',
    itemName: 'Basket Item',
    itemPlural: 'basket items',
    theme: {
      header: 'purple-500',
      addButton: 'purple',
      budget: 'bg-gradient-to-br from-purple-300 to-purple-500',
      accent: '#a855f7',
      border: 'rgb(var(--color-purple-500))',
      gamified: 'bg-gradient-to-br from-purple-300 to-purple-500',
    },
  },
  'fathers-day': {
    holidayKey: 'fathers-day',
    budgetName: "Father's Day",
    title: "Father's Day Gift List",
    description: "Track your Father's Day gift ideas!",
    gradientClass: 'fathers-day-gradient',
    itemName: 'Gift',
    itemPlural: 'gifts',
    theme: {
      header: 'blue-500',
      addButton: 'blue',
      budget: 'bg-gradient-to-br from-blue-400 to-blue-600',
      accent: '#3b82f6',
      border: 'rgb(var(--color-blue-500))',
      gamified: 'bg-gradient-to-br from-blue-400 to-blue-600',
    },
  },
  graduation: {
    holidayKey: 'graduation',
    budgetName: 'Graduation',
    title: 'Graduation Gift List',
    description: 'Track graduation gifts for your loved ones!',
    gradientClass: 'graduation-gradient',
    itemName: 'Gift',
    itemPlural: 'gifts',
    cardClassName: 'card-gifts-graduation',
    theme: purple,
  },
  halloween: {
    holidayKey: 'halloween',
    budgetName: 'Halloween',
    title: 'Gift List',
    description: 'Track Halloween gifts and treats!',
    gradientClass: 'halloween-tasks-gradient',
    itemName: 'Gift',
    itemPlural: 'gifts',
    theme: {
      header: 'orange-500',
      addButton: 'orange',
      budget: 'bg-gradient-to-br from-orange-400 to-orange-600',
      accent: '#f97316',
      border: 'rgb(249 115 22)',
      gamified: 'bg-gradient-to-br from-orange-400 to-orange-600',
    },
  },
  hanukkah: {
    holidayKey: 'hanukkah',
    budgetName: 'Hanukkah',
    title: 'Hanukkah Gift List',
    description: 'Track your Hanukkah gift ideas!',
    gradientClass: 'hanukkah-gifts-gradient',
    itemName: 'Gift',
    itemPlural: 'gifts',
    theme: {
      header: 'blue-500',
      addButton: 'blue',
      budget: 'bg-gradient-to-br from-blue-400 to-blue-600',
      accent: '#3b82f6',
      border: 'rgb(var(--color-blue-500))',
      gamified: 'bg-gradient-to-br from-blue-400 to-blue-600',
      submit: '#2563eb',
    },
  },
  kwanzaa: {
    holidayKey: 'kwanzaa',
    budgetName: 'Kwanzaa',
    title: 'Gift List',
    description: 'Keep track of gift ideas and purchases!',
    gradientClass: 'kwanzaa-gradient',
    itemName: 'Gift',
    itemPlural: 'gifts',
    theme: {
      header: 'red-500',
      addButton: 'red',
      budget: 'bg-gradient-to-br from-red-400 to-red-600',
      accent: '#dc2626',
      border: 'rgb(var(--color-red-500))',
      gamified: 'bg-gradient-to-br from-red-400 to-red-600',
    },
  },
  'mothers-day': {
    holidayKey: 'mothers-day',
    budgetName: "Mother's Day",
    title: "Mother's Day Gift List",
    description: "Track your Mother's Day gift ideas!",
    gradientClass: 'mothers-day-gradient',
    itemName: 'Gift',
    itemPlural: 'gifts',
    theme: {
      header: 'pink-500',
      addButton: 'pink',
      budget: 'bg-gradient-to-br from-pink-300 to-pink-500',
      accent: '#ec4899',
      border: 'rgb(var(--color-pink-500))',
      gamified: 'bg-gradient-to-br from-pink-300 to-pink-500',
    },
  },
  thanksgiving: {
    holidayKey: 'thanksgiving',
    budgetName: 'Thanksgiving',
    title: '🛒 Shopping List',
    description: 'Keep track of your Thanksgiving shopping items!',
    gradientClass: 'thanksgiving-gradient',
    itemName: 'Item',
    itemPlural: 'shopping items',
    theme: {
      header: 'amber-500',
      addButton: 'amber',
      budget: 'bg-gradient-to-br from-amber-400 to-amber-600',
      accent: '#d97706',
      border: 'rgb(var(--color-amber-500))',
      gamified: 'bg-gradient-to-br from-amber-400 to-amber-600',
    },
  },
  valentines: {
    holidayKey: 'valentines',
    budgetName: "Valentine's Day",
    title: 'Valentines Gift List',
    description: 'Track your Valentines gift ideas!',
    gradientClass: 'valentines-gradient',
    itemName: 'Gift',
    itemPlural: 'gifts',
    theme: {
      header: 'pink-500',
      addButton: 'pink',
      budget: 'bg-gradient-to-br from-pink-400 to-pink-600',
      accent: '#ec4899',
      border: 'rgb(var(--color-pink-500))',
      gamified: 'bg-gradient-to-br from-pink-400 to-pink-600',
    },
  },
  'new-year-supplies': {
    holidayKey: 'new-year',
    budgetName: 'New Year',
    title: 'Supply List',
    description: 'Track your New Year supply ideas!',
    gradientClass: 'new-year-gradient',
    itemName: 'Supply',
    itemPlural: 'supplies',
    formType: 'supplies',
    theme: {
      header: 'amber-500',
      addButton: 'amber',
      budget: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
      accent: '#f59e0b',
      border: 'rgb(var(--color-amber-500))',
      gamified: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    },
  },
  'fourth-of-july-supplies': {
    holidayKey: 'fourth-of-july',
    budgetName: 'Fourth of July',
    title: 'Fourth of July Supply List',
    description: 'Track your Fourth of July supply ideas!',
    gradientClass: 'fourth-of-july-gradient',
    itemName: 'Supply',
    itemPlural: 'supplies',
    formType: 'supplies',
    theme: {
      header: 'red-500',
      addButton: 'red',
      budget: 'bg-gradient-to-br from-red-400 to-red-600',
      accent: '#dc2626',
      border: 'rgb(var(--color-red-500))',
      gamified: 'bg-gradient-to-br from-red-400 to-red-600',
    },
  },
} satisfies Record<string, GiftListConfig>;
