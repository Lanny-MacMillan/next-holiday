import {
  getDefaultHolidayDate,
  getHolidayAccentColor,
  getHolidayCountdownTime,
  getHolidayIdFromRoute,
  isNationalHoliday,
} from '@/utils/holidayUtils';

describe('getHolidayAccentColor', () => {
  it.each([
    ['/christmas/gift-list', '#dc2626'],
    ['/valentines', '#ec4899'],
    ['/easter/tasks', '#8b5cf6'],
    ['/halloween', '#f97316'],
    ['/thanksgiving/guest-list', '#d97706'],
    ['/hanukkah', '#3b82f6'],
    ['/kwanzaa', '#059669'],
    ['/new-year/tasks', '#eab308'],
  ])('%s uses %s', (path, colour) => {
    expect(getHolidayAccentColor(path)).toBe(colour);
  });

  it('falls back to the Christmas colour elsewhere', () => {
    expect(getHolidayAccentColor('/settings')).toBe('#dc2626');
    expect(getHolidayAccentColor('/')).toBe('#dc2626');
  });
});

describe('getHolidayIdFromRoute', () => {
  const prefs = [
    { holiday: 'Christmas', holidayId: 'h-xmas' },
    { holiday: "Valentine's Day", holidayId: 'h-val' },
    { holiday: 'baby-shower', holidayId: 'h-baby' },
  ];

  it('finds the holiday for a route', () => {
    expect(getHolidayIdFromRoute('/christmas', prefs)).toBe('h-xmas');
    expect(getHolidayIdFromRoute('/christmas/gift-list', prefs)).toBe('h-xmas');
  });

  it('maps a route name to its display name', () => {
    expect(getHolidayIdFromRoute('/valentines/cards', prefs)).toBe('h-val');
  });

  it('also finds a holiday stored under its route name', () => {
    expect(getHolidayIdFromRoute('/baby-shower', prefs)).toBe('h-baby');
  });

  it('returns null when the user has not set that holiday up', () => {
    expect(getHolidayIdFromRoute('/easter', prefs)).toBeNull();
    expect(getHolidayIdFromRoute('/christmas', [])).toBeNull();
  });

  it('returns null for pages that are not holidays', () => {
    expect(getHolidayIdFromRoute('/settings', prefs)).toBeNull();
    expect(getHolidayIdFromRoute('/', prefs)).toBeNull();
    expect(getHolidayIdFromRoute('', prefs)).toBeNull();
  });
});

describe('isNationalHoliday', () => {
  it.each(['Christmas', 'Easter', "Mother's Day", 'Fourth of July'])(
    '%s is national',
    name => {
      expect(isNationalHoliday(name)).toBe(true);
    },
  );

  it.each(['Birthday', 'Anniversary', 'Graduation', 'Baby Shower', '', undefined])(
    '%p is not',
    name => {
      expect(isNationalHoliday(name)).toBe(false);
    },
  );
});

describe('getDefaultHolidayDate', () => {
  const at = (y: number, m: number, d: number) =>
    jest.setSystemTime(new Date(y, m - 1, d, 12, 0, 0));

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  describe('early in the year (nothing has passed yet)', () => {
    beforeEach(() => at(2026, 1, 15));

    it.each([
      ['Christmas', '2026-12-25T00:00'],
      ["Valentine's Day", '2026-02-14T00:00'],
      ['Halloween', '2026-10-31T00:00'],
      ['Fourth of July', '2026-07-04T00:00'],
      ['Kwanzaa', '2026-12-26T00:00'],
      ['Hanukkah', '2026-12-12T00:00'],
      ["Mother's Day", '2026-05-10T00:00'],
      ["Father's Day", '2026-06-21T00:00'],
      ['Thanksgiving', '2026-11-26T00:00'],
      ['Easter', '2026-04-05T00:00'],
      ['New Year', '2027-01-01T00:00'],
    ])('%s is %s', (name, expected) => {
      expect(getDefaultHolidayDate(name)).toBe(expected);
    });
  });

  describe('late in the year (dates roll to next year)', () => {
    beforeEach(() => at(2026, 12, 30));

    it.each([
      ['Christmas', '2027-12-25T00:00'],
      ["Valentine's Day", '2027-02-14T00:00'],
      ['Halloween', '2027-10-31T00:00'],
      ['Fourth of July', '2027-07-04T00:00'],
      ['Kwanzaa', '2027-12-26T00:00'],
      ['Hanukkah', '2027-12-02T00:00'],
      ["Mother's Day", '2027-05-09T00:00'],
      ["Father's Day", '2027-06-20T00:00'],
      ['Thanksgiving', '2027-11-25T00:00'],
      ['Easter', '2027-03-28T00:00'],
    ])('%s is %s', (name, expected) => {
      expect(getDefaultHolidayDate(name)).toBe(expected);
    });

    it('keeps New Year on 1 January of next year rather than rolling again', () => {
      expect(getDefaultHolidayDate('New Year')).toBe('2027-01-01T00:00');
    });
  });

  it('uses early December for Hanukkah in years it has no exact date for', () => {
    at(2030, 1, 5);
    expect(getDefaultHolidayDate('Hanukkah')).toBe('2030-12-10T00:00');
  });

  it('returns null for holidays with no fixed date, or none given', () => {
    at(2026, 1, 15);
    expect(getDefaultHolidayDate('Birthday')).toBeNull();
    expect(getDefaultHolidayDate('')).toBeNull();
    expect(getDefaultHolidayDate(undefined)).toBeNull();
  });
});

describe('getHolidayCountdownTime', () => {
  const NOW = new Date('2026-06-01T12:00:00Z');
  const active = (offsetMs: number) => ({
    targetDate: new Date(NOW.getTime() + offsetMs).toISOString(),
    isActive: true,
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });
  afterEach(() => jest.useRealTimers());

  it('returns the milliseconds remaining', () => {
    expect(
      getHolidayCountdownTime('Halloween', { halloweenCountdown: active(90_000) }),
    ).toBe(90_000);
  });

  it('returns 0 once the date has passed (sorts first)', () => {
    expect(
      getHolidayCountdownTime('Halloween', { halloweenCountdown: active(-5000) }),
    ).toBe(0);
  });

  it.each([
    ['no countdown', undefined],
    ['no target date', { isActive: true }],
    ['an inactive countdown', { targetDate: '2026-12-25', isActive: false }],
  ])('returns Infinity for %s (sorts last)', (_, countdown) => {
    expect(
      getHolidayCountdownTime('Halloween', { halloweenCountdown: countdown }),
    ).toBe(Infinity);
  });

  it.each([
    ['Hanukkah', 'hanukkahCountdown'],
    ['Kwanzaa', 'kwanzaaCountdown'],
    ['New Year', 'newYearCountdown'],
    ["Valentine's Day", 'valentinesCountdown'],
    ['Easter', 'easterCountdown'],
    ['Halloween', 'halloweenCountdown'],
    ['Thanksgiving', 'thanksgivingCountdown'],
    ['Christmas', 'countdown'],
  ])('reads %s from state.%s', (holiday, key) => {
    expect(getHolidayCountdownTime(holiday, { [key]: active(1000) })).toBe(1000);
  });

  it('does not mix up holidays', () => {
    expect(
      getHolidayCountdownTime('Easter', { halloweenCountdown: active(1000) }),
    ).toBe(Infinity);
  });
});
