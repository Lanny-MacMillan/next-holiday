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
  },
  'baby-shower': {
    ...common,
    holidayKey: 'baby-shower',
    title: 'Baby Shower Tasks',
    gradientClass: 'baby-shower-gradient',
    addButton: 'cyan',
  },
  birthday: {
    ...common,
    holidayKey: 'birthday',
    title: 'Birthday Tasks',
    gradientClass: 'birthday-gradient',
    addButton: 'yellow',
  },
  christmas: {
    holidayKey: 'christmas',
    title: 'Tasks',
    description: 'Add tasks to your holiday to-do list',
    gradientClass: 'christmas-tasks-gradient',
    headerColor: 'red-500',
    addButton: 'green',
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
  },
  'fathers-day': {
    ...common,
    holidayKey: 'fathers-day',
    title: "Father's Day Tasks",
    gradientClass: 'fathers-day-gradient',
    addButton: 'blue',
  },
  'fourth-of-july': {
    ...common,
    holidayKey: 'fourth-of-july',
    title: 'Fourth of July Tasks',
    gradientClass: 'fourth-of-july-gradient',
    addButton: 'red',
  },
  graduation: {
    ...common,
    holidayKey: 'graduation',
    title: 'Graduation Tasks',
    gradientClass: 'graduation-gradient',
    addButton: 'purple',
  },
  halloween: {
    ...common,
    holidayKey: 'halloween',
    title: 'Halloween Tasks',
    gradientClass: 'halloween-gradient',
    addButton: 'orange',
    taskCategory: 'To-Do',
  },
  hanukkah: {
    ...common,
    holidayKey: 'hanukkah',
    title: 'Hanukkah Tasks',
    gradientClass: 'hanukkah-gradient',
    addButton: 'blue',
  },
  kwanzaa: {
    ...common,
    holidayKey: 'kwanzaa',
    title: 'Kwanzaa Tasks',
    gradientClass: 'kwanzaa-gradient',
    addButton: 'red',
    submitColor: '#dc2626',
  },
  'mothers-day': {
    ...common,
    holidayKey: 'mothers-day',
    title: "Mother's Day Tasks",
    gradientClass: 'mothers-day-gradient',
    addButton: 'pink',
  },
  'new-year': {
    ...common,
    holidayKey: 'new-year',
    title: 'New Year Tasks',
    gradientClass: 'new-year-gradient',
    headerColor: 'amber-600',
    addButton: 'yellow',
  },
  thanksgiving: {
    ...common,
    holidayKey: 'thanksgiving',
    title: 'Thanksgiving Tasks',
    gradientClass: 'thanksgiving-gradient',
    addButton: 'amber',
    taskCategory: 'To-Do',
  },
  valentines: {
    ...common,
    holidayKey: 'valentines',
    title: "Valentine's Tasks",
    gradientClass: 'valentines-gradient',
    addButton: 'pink',
  },
} satisfies Record<string, TaskPageConfig>;
