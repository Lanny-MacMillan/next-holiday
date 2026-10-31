import {
  CANDLE_LIGHTING_TASKS,
  KWANZAA_DECORATIONS,
  KWANZAA_PRINCIPLES,
  nextKwanzaaStart,
  seedTasksFor,
} from '@/config/holidaySeeds';

const day = (iso: string) => new Date(`${iso}T12:00:00Z`);
const date = (d: Date | null) => d?.toISOString().slice(0, 10);

describe('nextKwanzaaStart', () => {
  it.each([
    ['a few months before', '2027-06-01', '2027-12-26'],
    ['the week before it begins', '2026-12-20', '2026-12-26'],
    ['the first day', '2026-12-26', '2026-12-26'],
    ['part-way through', '2026-12-28', '2026-12-26'],
    ['the last day, 1 January', '2027-01-01', '2026-12-26'],
    ['the day after it ends', '2027-01-02', '2027-12-26'],
  ])('is the right 26 December %s', (_label, now, expected) => {
    expect(date(nextKwanzaaStart(day(now)))).toBe(expected);
  });

  it('starts at midnight UTC, so dates do not shift with the time zone', () => {
    expect(nextKwanzaaStart(day('2027-06-01')).toISOString()).toBe(
      '2027-12-26T00:00:00.000Z',
    );
  });
});

describe('the lists', () => {
  it('has the eight nights of candle lighting', () => {
    expect(CANDLE_LIGHTING_TASKS).toHaveLength(8);
    expect(CANDLE_LIGHTING_TASKS[0].title).toBe('Light 1st Candle');
    expect(CANDLE_LIGHTING_TASKS[7].title).toBe('Light 8th Candle');
  });

  it('has the seven Kwanzaa principles in order, one per day', () => {
    expect(KWANZAA_PRINCIPLES.map(p => p.dayNumber)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(KWANZAA_PRINCIPLES[0].name).toBe('Umoja (Unity)');
  });

  it('has ten Kwanzaa decorations', () => {
    expect(KWANZAA_DECORATIONS).toHaveLength(10);
  });

  it.each([...CANDLE_LIGHTING_TASKS, ...KWANZAA_DECORATIONS])(
    'gives %j a title, a description and a priority',
    item => {
      expect(item.title).toBeTruthy();
      expect(item.description).toBeTruthy();
      expect(['low', 'medium', 'high']).toContain(item.priority);
    },
  );
});

describe('seedTasksFor', () => {
  it('gives Hanukkah the eight candle nights, with no dates', () => {
    const tasks = seedTasksFor('Hanukkah', day('2027-06-01'));

    expect(tasks).toHaveLength(8);
    expect(
      tasks.every(t => t.category === 'Candle Lighting' && t.dueDate === null),
    ).toBe(true);
  });

  it('gives Kwanzaa its principles, each due on its day, and its decorations', () => {
    const tasks = seedTasksFor('Kwanzaa', day('2027-06-01'));

    const principles = tasks.filter(t => t.category === 'Daily Principles');
    expect(principles.map(t => date(t.dueDate))).toEqual([
      '2027-12-26',
      '2027-12-27',
      '2027-12-28',
      '2027-12-29',
      '2027-12-30',
      '2027-12-31',
      '2028-01-01',
    ]);
    expect(principles[0]).toMatchObject({
      title: 'Umoja (Unity)',
      priority: 'high',
    });

    const decorations = tasks.filter(t => t.category === 'Decorations');
    expect(decorations).toHaveLength(10);
    expect(decorations.every(t => t.dueDate === null)).toBe(true);
    expect(tasks).toHaveLength(17);
  });

  it('dates the principles from the season under way, not the next one', () => {
    const tasks = seedTasksFor('Kwanzaa', day('2026-12-28'));

    expect(date(tasks[0].dueDate)).toBe('2026-12-26');
  });

  it('does not mind the case of the holiday name', () => {
    expect(seedTasksFor('hanukkah')).toHaveLength(8);
    expect(seedTasksFor('KWANZAA')).toHaveLength(17);
  });

  it.each(['Christmas', 'New Year', 'Halloween', 'custom', ''])(
    'gives %p nothing',
    type => {
      expect(seedTasksFor(type)).toEqual([]);
    },
  );
});
