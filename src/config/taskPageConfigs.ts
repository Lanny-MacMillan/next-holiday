import type { HolidayKey } from '@/config/baseFormConfigs';

export interface TaskPageConfig {
  holidayKey: HolidayKey;
  title: string;
  description?: string;
  gradientClass: string;
  headerColor?: string;
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
  doneEmoji: string;
  // Tasks of one category are shown and created; null shows every task and lets the user pick one
  taskCategory: string | null;
  // Accent for the checkboxes, left borders and buttons, where the holiday sets one
  accent?: string;
  border?: string;
  submitColor?: string;
  // Events are tasks in their own category, shown with their own wording and a summary
  variant?: 'tasks' | 'events' | 'decorations';
  // Wording for pages that are neither tasks, events nor decorations
  labels?: {
    noun: string;
    plural: string;
    pending: string;
    completed: string;
    empty: string;
    completedEmpty: string;
  };
  summary?: boolean;
  footer?: boolean;
  modalClassName?: string;
  // A starter list offered on an empty page
  starter?: {
    heading: string;
    question: string;
    items: {
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
    }[];
  };
}

const common = {
  description: 'Stay on top of your holiday to-dos',
  taskCategory: 'Tasks',
} as const;

export const taskPageConfigs = {
  anniversary: {
    ...common,
    holidayKey: 'anniversary',
    title: 'Anniversary Tasks',
    gradientClass: 'anniversary-gradient',
    addButton: 'pink',
    doneEmoji: '💕',
  },
  'baby-shower': {
    ...common,
    holidayKey: 'baby-shower',
    title: 'Baby Shower Tasks',
    gradientClass: 'baby-shower-gradient',
    addButton: 'cyan',
    doneEmoji: '👶',
  },
  birthday: {
    ...common,
    holidayKey: 'birthday',
    title: 'Birthday Tasks',
    gradientClass: 'birthday-gradient',
    addButton: 'yellow',
    doneEmoji: '🎂',
  },
  christmas: {
    holidayKey: 'christmas',
    title: 'Tasks',
    description: 'Add tasks to your holiday to-do list',
    gradientClass: 'christmas-tasks-gradient',
    headerColor: 'red-500',
    addButton: 'green',
    doneEmoji: '🎉',
    taskCategory: null,
    accent: '#22c55e',
    border: 'rgb(var(--color-green-500))',
    submitColor: '#22c55e',
  },
  easter: {
    ...common,
    holidayKey: 'easter',
    title: 'Easter Tasks',
    gradientClass: 'easter-gradient',
    addButton: 'purple',
    doneEmoji: '🐰',
  },
  'fathers-day': {
    ...common,
    holidayKey: 'fathers-day',
    title: "Father's Day Tasks",
    gradientClass: 'fathers-day-gradient',
    addButton: 'blue',
    doneEmoji: '👨‍👧‍👦',
  },
  'fourth-of-july': {
    ...common,
    holidayKey: 'fourth-of-july',
    title: 'Fourth of July Tasks',
    gradientClass: 'fourth-of-july-gradient',
    addButton: 'red',
    doneEmoji: '🎆',
  },
  graduation: {
    ...common,
    holidayKey: 'graduation',
    title: 'Graduation Tasks',
    gradientClass: 'graduation-gradient',
    addButton: 'purple',
    doneEmoji: '🎓',
  },
  halloween: {
    ...common,
    holidayKey: 'halloween',
    title: 'Halloween Tasks',
    gradientClass: 'halloween-gradient',
    addButton: 'orange',
    doneEmoji: '🎃',
    taskCategory: 'To-Do',
  },
  hanukkah: {
    ...common,
    holidayKey: 'hanukkah',
    title: 'Hanukkah Tasks',
    gradientClass: 'hanukkah-gradient',
    addButton: 'blue',
    doneEmoji: '🕎',
  },
  kwanzaa: {
    ...common,
    holidayKey: 'kwanzaa',
    title: 'Kwanzaa Tasks',
    gradientClass: 'kwanzaa-gradient',
    addButton: 'red',
    doneEmoji: '🕯️',
    submitColor: '#dc2626',
  },
  'mothers-day': {
    ...common,
    holidayKey: 'mothers-day',
    title: "Mother's Day Tasks",
    gradientClass: 'mothers-day-gradient',
    addButton: 'pink',
    doneEmoji: '🌸',
  },
  'new-year': {
    ...common,
    holidayKey: 'new-year',
    title: 'New Year Tasks',
    gradientClass: 'new-year-gradient',
    headerColor: 'amber-600',
    addButton: 'yellow',
    doneEmoji: '🎊',
  },
  thanksgiving: {
    ...common,
    holidayKey: 'thanksgiving',
    title: 'Thanksgiving Tasks',
    gradientClass: 'thanksgiving-gradient',
    addButton: 'amber',
    doneEmoji: '🦃',
    taskCategory: 'To-Do',
  },
  valentines: {
    ...common,
    holidayKey: 'valentines',
    title: "Valentine's Tasks",
    gradientClass: 'valentines-gradient',
    addButton: 'pink',
    doneEmoji: '💕',
  },
} satisfies Record<string, TaskPageConfig>;
