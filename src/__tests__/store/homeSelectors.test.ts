import {
  selectContactById,
  selectContacts,
  selectHolidayBudgetById,
  selectHolidayIdByKey,
  selectHolidayIdByRoute,
  selectHolidayPrefById,
  selectHolidayPreferences,
  selectHomeData,
  selectHomeInitialized,
} from '@/store/selectors/home';

const prefs = [
  { holiday: 'Christmas', holidayId: 'h-xmas', budget: { totalBudget: 100 } },
  { holiday: "Valentine's Day", holidayId: 'h-val' },
  { holiday: 'New Year', holidayId: 'h-ny' },
  { holiday: 'Easter' },
];
const stateWith = (data: unknown, initialized = true) =>
  ({ home: { data, initialized } }) as never;
const full = stateWith({
  holidayPreferences: prefs,
  contacts: [{ id: 'c1', name: 'Ada' }],
});
const empty = stateWith(null, false);

describe('base selectors', () => {
  it('read the data and initialized flag', () => {
    expect(selectHomeData(full)).toEqual({
      holidayPreferences: prefs,
      contacts: [{ id: 'c1', name: 'Ada' }],
    });
    expect(selectHomeInitialized(full)).toBe(true);
    expect(selectHomeInitialized(empty)).toBe(false);
  });

  it('list holiday preferences and contacts, or nothing', () => {
    expect(selectHolidayPreferences(full)).toBe(prefs);
    expect(selectHolidayPreferences(empty)).toEqual([]);
    expect(selectContacts(empty)).toEqual([]);
  });
});

describe('selectHolidayPrefById and budget', () => {
  it('finds a preference by holiday id', () => {
    expect(selectHolidayPrefById(full, 'h-ny')?.holiday).toBe('New Year');
    expect(selectHolidayPrefById(full, 'nope')).toBeNull();
    expect(selectHolidayPrefById(full, null)).toBeNull();
    expect(selectHolidayPrefById(full, undefined)).toBeNull();
  });

  it('returns its budget, when it has one', () => {
    expect(selectHolidayBudgetById(full, 'h-xmas')).toEqual({ totalBudget: 100 });
    expect(selectHolidayBudgetById(full, 'h-ny')).toBeUndefined();
    expect(selectHolidayBudgetById(full, 'nope')).toBeUndefined();
  });
});

describe('selectContactById', () => {
  it('finds the contact or returns null', () => {
    expect(selectContactById(full, 'c1')?.name).toBe('Ada');
    expect(selectContactById(full, 'zzz')).toBeNull();
  });
});

describe('selectHolidayIdByKey', () => {
  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it('matches the exact holiday name', () => {
    expect(selectHolidayIdByKey(full, 'Christmas')).toBe('h-xmas');
  });

  it('maps the valentines key to its display name', () => {
    expect(selectHolidayIdByKey(full, 'valentines')).toBe('h-val');
  });

  it('falls back to ignoring case, spaces and punctuation', () => {
    expect(selectHolidayIdByKey(full, 'new-year')).toBe('h-ny');
    expect(selectHolidayIdByKey(full, 'CHRISTMAS')).toBe('h-xmas');
  });

  it('is null for a holiday with no id, an unknown key, an empty key or no preferences', () => {
    expect(selectHolidayIdByKey(full, 'Easter')).toBeNull();
    expect(selectHolidayIdByKey(full, 'diwali')).toBeNull();
    expect(selectHolidayIdByKey(full, '')).toBeNull();
    expect(selectHolidayIdByKey(empty, 'Christmas')).toBeNull();
  });
});

describe('selectHolidayIdByRoute', () => {
  it('maps a route to its holiday id', () => {
    expect(selectHolidayIdByRoute(full, '/christmas')).toBe('h-xmas');
    expect(selectHolidayIdByRoute(full, '/valentines')).toBe('h-val');
    expect(selectHolidayIdByRoute(full, '/new-year')).toBe('h-ny');
  });

  it('is null for unknown routes, holidays without an id, or no preferences', () => {
    expect(selectHolidayIdByRoute(full, '/nowhere')).toBeNull();
    expect(selectHolidayIdByRoute(full, '/easter')).toBeNull();
    expect(selectHolidayIdByRoute(full, '/halloween')).toBeNull();
    expect(selectHolidayIdByRoute(empty, '/christmas')).toBeNull();
  });
});
