/**
 * @jest-environment jsdom
 */
import themeReducer, {
  clearCachedData,
  initializeTheme,
  toggleTheme,
  updateSettings,
} from '@/store/slices/themeSlice';

const start = () => themeReducer(undefined, { type: 'init' });

beforeEach(() => {
  localStorage.clear();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('theme', () => {
  it('starts light and professional, not yet initialized', () => {
    expect(start()).toMatchObject({
      settings: { theme: 'light', displayMode: 'professional', giftBudgetLimit: 0 },
      initialized: false,
    });
  });

  it('toggleTheme flips between light and dark and remembers it', () => {
    const dark = themeReducer(start(), toggleTheme());
    expect(dark.settings.theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(themeReducer(dark, toggleTheme()).settings.theme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});

describe('updateSettings', () => {
  it('merges into the settings', () => {
    const next = themeReducer(start(), updateSettings({ displayMode: 'gamified' }));
    expect(next.settings).toMatchObject({ displayMode: 'gamified', theme: 'light' });
  });

  it('saves the settings but leaves the budget fields to the database', () => {
    themeReducer(
      start(),
      updateSettings({
        displayMode: 'gamified',
        giftBudgetLimit: 500,
        holidayChoices: [{ holiday: 'x', budget: 1 }],
      }),
    );
    const saved = JSON.parse(localStorage.getItem('userSettings')!);
    expect(saved.displayMode).toBe('gamified');
    expect(saved).not.toHaveProperty('giftBudgetLimit');
    expect(saved).not.toHaveProperty('holidayChoices');
  });
});

describe('initializeTheme', () => {
  it('initializes with defaults when nothing is saved', () => {
    expect(themeReducer(start(), initializeTheme())).toMatchObject({
      initialized: true,
      settings: { theme: 'light' },
    });
  });

  it('restores the saved theme and settings', () => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem(
      'userSettings',
      JSON.stringify({ displayMode: 'gamified' }),
    );
    const next = themeReducer(start(), initializeTheme());
    expect(next.settings).toMatchObject({ theme: 'dark', displayMode: 'gamified' });
  });

  it('ignores budget data in storage', () => {
    localStorage.setItem(
      'userSettings',
      JSON.stringify({
        giftBudgetLimit: 999,
        holidayChoices: [{ holiday: 'x', budget: 1 }],
      }),
    );
    const next = themeReducer(start(), initializeTheme());
    expect(next.settings.giftBudgetLimit).toBe(0);
    expect(next.settings.holidayChoices).toEqual([]);
  });

  it('survives corrupt saved settings', () => {
    localStorage.setItem('userSettings', '{nope');
    const next = themeReducer(start(), initializeTheme());
    expect(next.initialized).toBe(true);
    expect(console.error).toHaveBeenCalled();
  });
});

describe('clearCachedData', () => {
  const withBudget = () =>
    themeReducer(
      start(),
      updateSettings({
        giftBudgetLimit: 300,
        holidayChoices: [{ holiday: 'x', budget: 1 }],
      }),
    );

  it('zeroes the budget fields in state', () => {
    const next = themeReducer(withBudget(), clearCachedData());
    expect(next.settings.giftBudgetLimit).toBe(0);
    expect(next.settings.holidayChoices).toEqual([]);
  });

  it('strips budget fields from stored settings and keeps the rest', () => {
    localStorage.setItem(
      'userSettings',
      JSON.stringify({ displayMode: 'gamified', giftBudgetLimit: 5 }),
    );
    themeReducer(start(), clearCachedData());
    expect(JSON.parse(localStorage.getItem('userSettings')!)).toEqual({
      displayMode: 'gamified',
    });
  });

  it('copes with corrupt stored settings', () => {
    localStorage.setItem('userSettings', '{nope');
    expect(() => themeReducer(start(), clearCachedData())).not.toThrow();
    expect(console.error).toHaveBeenCalled();
  });
});
