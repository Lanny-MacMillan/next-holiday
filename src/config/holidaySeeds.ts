// Items that are part of a holiday's tradition. They are added when the holiday is added
// (see lib/server/seedHoliday.ts), and the pages still offer them on an empty page.

type SeedPriority = 'low' | 'medium' | 'high';

export interface SeedItem {
  title: string;
  description: string;
  priority: SeedPriority;
}

export interface KwanzaaPrinciple {
  dayNumber: number;
  name: string;
  description: string;
  priority: SeedPriority;
}

export const CANDLE_LIGHTING_TASKS: SeedItem[] = [
  {
    title: 'Light 1st Candle',
    description: 'First night of Hanukkah - Light the shamash and first candle',
    priority: 'high',
  },
  {
    title: 'Light 2nd Candle',
    description: 'Second night of Hanukkah - Light the shamash and two candles',
    priority: 'high',
  },
  {
    title: 'Light 3rd Candle',
    description: 'Third night of Hanukkah - Light the shamash and three candles',
    priority: 'high',
  },
  {
    title: 'Light 4th Candle',
    description: 'Fourth night of Hanukkah - Light the shamash and four candles',
    priority: 'high',
  },
  {
    title: 'Light 5th Candle',
    description: 'Fifth night of Hanukkah - Light the shamash and five candles',
    priority: 'high',
  },
  {
    title: 'Light 6th Candle',
    description: 'Sixth night of Hanukkah - Light the shamash and six candles',
    priority: 'high',
  },
  {
    title: 'Light 7th Candle',
    description: 'Seventh night of Hanukkah - Light the shamash and seven candles',
    priority: 'high',
  },
  {
    title: 'Light 8th Candle',
    description: 'Eighth night of Hanukkah - Light the shamash and eight candles',
    priority: 'high',
  },
];

export const KWANZAA_PRINCIPLES: KwanzaaPrinciple[] = [
  {
    dayNumber: 1,
    name: 'Umoja (Unity)',
    description: 'First day of Kwanzaa - focus on unity',
    priority: 'high',
  },
  {
    dayNumber: 2,
    name: 'Kujichagulia (Self-Determination)',
    description: 'Second day of Kwanzaa - focus on self-determination',
    priority: 'high',
  },
  {
    dayNumber: 3,
    name: 'Ujima (Collective Work and Responsibility)',
    description: 'Third day of Kwanzaa - focus on collective work',
    priority: 'high',
  },
  {
    dayNumber: 4,
    name: 'Ujamaa (Cooperative Economics)',
    description: 'Fourth day of Kwanzaa - focus on cooperative economics',
    priority: 'high',
  },
  {
    dayNumber: 5,
    name: 'Nia (Purpose)',
    description: 'Fifth day of Kwanzaa - focus on purpose',
    priority: 'high',
  },
  {
    dayNumber: 6,
    name: 'Kuumba (Creativity)',
    description: 'Sixth day of Kwanzaa - focus on creativity',
    priority: 'high',
  },
  {
    dayNumber: 7,
    name: 'Imani (Faith)',
    description: 'Seventh day of Kwanzaa - focus on faith',
    priority: 'high',
  },
];

export const KWANZAA_DECORATIONS: SeedItem[] = [
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

// Kwanzaa runs from 26 December to 1 January. This is the 26 December that starts the
// season now under way, or the next one to come.
export function nextKwanzaaStart(now: Date = new Date()) {
  const inJanuarySeason = now.getUTCMonth() === 0 && now.getUTCDate() <= 1;
  const year = inJanuarySeason ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
  return new Date(Date.UTC(year, 11, 26));
}

export interface SeedTask extends SeedItem {
  category: string;
  dueDate: Date | null;
}

// What to add to a new holiday of this type; most holidays have nothing.
export function seedTasksFor(
  holidayType: string,
  now: Date = new Date(),
): SeedTask[] {
  switch (holidayType.toLowerCase()) {
    case 'hanukkah':
      return CANDLE_LIGHTING_TASKS.map(item => ({
        ...item,
        category: 'Candle Lighting',
        dueDate: null,
      }));
    case 'kwanzaa': {
      const start = nextKwanzaaStart(now);
      return [
        ...KWANZAA_PRINCIPLES.map(principle => ({
          title: principle.name,
          description: principle.description,
          priority: principle.priority,
          category: 'Daily Principles',
          dueDate: new Date(
            start.getTime() + (principle.dayNumber - 1) * 86_400_000,
          ),
        })),
        ...KWANZAA_DECORATIONS.map(item => ({
          ...item,
          category: 'Decorations',
          dueDate: null,
        })),
      ];
    }
    default:
      return [];
  }
}
