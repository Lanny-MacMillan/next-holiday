export type BadgeStat =
  | 'total'
  | 'tasks'
  | 'gifts'
  | 'cards'
  | 'early'
  | 'streak'
  | 'level'
  | 'holidayComplete';

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  // 'holiday' badges are earned once per holiday, 'global' ones once per person
  scope: 'global' | 'holiday';
  stat: BadgeStat;
  target: number;
}

export const BADGES: BadgeDefinition[] = [
  {
    key: 'first_step',
    name: 'First Step',
    description: 'Complete your first item',
    scope: 'global',
    stat: 'total',
    target: 1,
  },
  {
    key: 'task_tackler',
    name: 'Task Tackler',
    description: 'Complete 10 tasks',
    scope: 'global',
    stat: 'tasks',
    target: 10,
  },
  {
    key: 'gift_guru',
    name: 'Gift Guru',
    description: 'Complete 10 gifts',
    scope: 'global',
    stat: 'gifts',
    target: 10,
  },
  {
    key: 'pen_pal',
    name: 'Pen Pal',
    description: 'Send 10 cards',
    scope: 'global',
    stat: 'cards',
    target: 10,
  },
  {
    key: 'early_bird',
    name: 'Early Bird',
    description: 'Finish 5 tasks before their due date',
    scope: 'global',
    stat: 'early',
    target: 5,
  },
  {
    key: 'on_a_roll',
    name: 'On a Roll',
    description: 'Complete something 3 days in a row',
    scope: 'global',
    stat: 'streak',
    target: 3,
  },
  {
    key: 'week_warrior',
    name: 'Week Warrior',
    description: 'Complete something 7 days in a row',
    scope: 'global',
    stat: 'streak',
    target: 7,
  },
  {
    key: 'rising_star',
    name: 'Rising Star',
    description: 'Reach level 5',
    scope: 'global',
    stat: 'level',
    target: 5,
  },
  {
    key: 'holiday_hero',
    name: 'Holiday Hero',
    description: 'Finish everything on a holiday (at least 3 items)',
    scope: 'holiday',
    stat: 'holidayComplete',
    target: 1,
  },
];
