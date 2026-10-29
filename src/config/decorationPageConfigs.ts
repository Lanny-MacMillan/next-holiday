import type { TaskPageConfig } from '@/config/taskPageConfigs';

type StarterItems = NonNullable<TaskPageConfig['starter']>['items'];

const common = {
  variant: 'decorations',
  taskCategory: 'Decorations',
  doneEmoji: '',
} as const;

const kwanzaaStarter: StarterItems = [
  {
    title: 'Kinara Candle Holder Setup',
    description: 'Set up the seven-branched kinara candle holder as centerpiece',
    priority: 'high',
  },
  {
    title: 'Mkeka Mat Placement',
    description: 'Place the mkeka (straw mat) as foundation for all decorations',
    priority: 'high',
  },
  {
    title: 'Unity Cup Display',
    description: 'Set up Kikombe cha Umoja (unity cup) for ceremonies',
    priority: 'high',
  },
  {
    title: 'African Decorative Elements',
    description: 'Add traditional African art, fabrics, and cultural displays',
    priority: 'medium',
  },
  {
    title: 'Red, Black, Green Color Scheme',
    description: 'Incorporate Kwanzaa colors throughout decoration scheme',
    priority: 'medium',
  },
  {
    title: 'Harvest Display Setup',
    description: 'Create display of fruits and vegetables (mazao)',
    priority: 'medium',
  },
  {
    title: 'Corn Decoration Arrangement',
    description: 'Place ears of corn (vibunzi) representing children',
    priority: 'low',
  },
  {
    title: 'Heritage Wall Creation',
    description: 'Create family heritage and ancestral photo display',
    priority: 'medium',
  },
  {
    title: 'Seven Principles Banners',
    description: 'Create and hang banners for each Kwanzaa principle',
    priority: 'low',
  },
  {
    title: 'Candle Lighting Area Setup',
    description: 'Prepare safe space for daily candle lighting ceremonies',
    priority: 'high',
  },
];

const newYearStarter: StarterItems = [
  {
    title: 'Set up New Year countdown display',
    description: 'Prepare countdown decorations for midnight celebration',
    priority: 'high',
  },
  {
    title: 'Hang New Year banners and streamers',
    description: 'Display festive New Year banners and colorful streamers',
    priority: 'medium',
  },
  {
    title: 'Arrange New Year centerpieces',
    description: 'Create elegant centerpieces with champagne glasses and confetti',
    priority: 'medium',
  },
  {
    title: 'Set up party decorations and balloons',
    description: 'Prepare gold, silver, and black balloons and party decorations',
    priority: 'high',
  },
  {
    title: 'Prepare confetti and sparklers',
    description: 'Set up confetti cannons and safe sparklers for celebration',
    priority: 'medium',
  },
  {
    title: 'Create photo booth backdrop',
    description: 'Set up New Year themed photo booth with props',
    priority: 'low',
  },
];

export const decorationPageConfigs = {
  easter: {
    ...common,
    holidayKey: 'easter',
    title: 'Easter Decorations',
    description: 'Plan your Easter decorations with festive flair!',
    gradientClass: 'easter-gradient',
    headerColor: 'purple-500',
    addButton: 'purple',
    accent: '#a855f7',
    border: 'rgb(168 85 247)',
    modalClassName: 'card-tasks',
  },
  'fourth-of-july': {
    ...common,
    holidayKey: 'fourth-of-july',
    title: 'Fourth of July Decorations',
    description: 'Plan your patriotic decorations!',
    gradientClass: 'fourth-of-july-gradient',
    headerColor: 'red-600',
    addButton: 'red',
    accent: '#dc2626',
    border: 'rgb(220 38 38)',
  },
  halloween: {
    ...common,
    holidayKey: 'halloween',
    title: 'Decorations',
    description: 'Keep track of Halloween decorations!',
    gradientClass: 'halloween-tasks-gradient',
    headerColor: 'orange-500',
    addButton: 'orange',
    accent: '#f97316',
    border: 'rgb(249 115 22)',
    modalClassName: 'card-tasks',
  },
  hanukkah: {
    ...common,
    holidayKey: 'hanukkah',
    title: 'Decorations Checklist',
    description: 'Stay on top of your Hanukkah decorations!',
    gradientClass: 'hanukkah-tasks-gradient',
    headerColor: 'blue-500',
    addButton: 'blue',
    accent: '#3b82f6',
    border: 'rgb(59 130 246)',
    modalClassName: 'card-tasks',
  },
  kwanzaa: {
    ...common,
    holidayKey: 'kwanzaa',
    title: 'Decorations Checklist',
    gradientClass: 'kwanzaa-gradient',
    headerColor: 'red-600',
    addButton: 'red',
    accent: '#dc2626',
    border: 'rgb(220 38 38)',
    submitColor: '#dc2626',
    modalClassName: 'card card-tasks',
    starter: {
      heading: '✨ Set Up Kwanzaa Decorations',
      question: 'Would you like to add common Kwanzaa decoration tasks?',
      button: 'Add Default Tasks',
      tone: 'blue',
      items: kwanzaaStarter,
    },
  },
  'new-year': {
    ...common,
    holidayKey: 'new-year',
    title: "New Year's Decorations",
    description: "Prepare your New Year's celebration decorations!",
    gradientClass: 'new-year-tasks-gradient',
    headerColor: 'amber-600',
    addButton: 'amber',
    accent: '#f59e0b',
    border: 'rgb(245 158 11)',
    modalClassName: 'card-tasks',
    starter: {
      heading: "🎊 Set Up New Year's Decorations",
      question: "Would you like to add some common New Year's decoration tasks?",
      button: 'Add Default Decorations',
      tone: 'amber',
      items: newYearStarter,
    },
  },
  thanksgiving: {
    ...common,
    holidayKey: 'thanksgiving',
    title: 'Decorations',
    description: 'Keep track of Thanksgiving decorations!',
    gradientClass: 'thanksgiving-tasks-gradient',
    headerColor: 'amber-500',
    addButton: 'amber',
    accent: '#d97706',
    border: 'rgb(217 119 6)',
    modalClassName: 'card-tasks',
  },
} satisfies Record<string, TaskPageConfig>;
