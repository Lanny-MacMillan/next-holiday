/**
 * @jest-environment jsdom
 */
import { configureStore } from '@reduxjs/toolkit';
import preferencesReducer, {
  clearPreferences,
  getCurrentUserPreferences,
  updateUserPreferences,
  type UserPreferences,
} from '@/store/slices/userPreferencesSlice';

const mockFetch = jest.fn();
const prefs = (over: Partial<UserPreferences> = {}) =>
  ({
    id: 'p1',
    userId: 'u1',
    theme: 'light',
    displayMode: 'professional',
    ...over,
  }) as UserPreferences;
const makeStore = (preferences: UserPreferences | null = null) =>
  configureStore({
    reducer: { userPreferences: preferencesReducer },
    preloadedState: {
      userPreferences: {
        preferences,
        loading: false,
        error: null,
        initialized: false,
      },
    },
  });
const reply = (body: unknown, ok = true) => ({ ok, json: async () => body });

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
  localStorage.clear();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('getCurrentUserPreferences', () => {
  it('asks for the user by encoded auth0 id', async () => {
    mockFetch.mockResolvedValue(reply(prefs()));
    await makeStore().dispatch(getCurrentUserPreferences('auth0|me'));
    expect(mockFetch.mock.calls[0][0]).toBe(
      '/api/users/me/preferences?auth0Sub=auth0%7Cme',
    );
  });

  it('stores the preferences and mirrors theme and display mode into localStorage', async () => {
    mockFetch.mockResolvedValue(
      reply(prefs({ theme: 'dark', displayMode: 'gamified' })),
    );
    localStorage.setItem('userSettings', JSON.stringify({ keep: 1 }));
    const store = makeStore();
    await store.dispatch(getCurrentUserPreferences('a'));

    expect(store.getState().userPreferences).toMatchObject({
      initialized: true,
      loading: false,
    });
    expect(store.getState().userPreferences.preferences?.theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(JSON.parse(localStorage.getItem('userSettings')!)).toEqual({
      keep: 1,
      displayMode: 'gamified',
    });
  });

  it('creates the saved settings when there were none', async () => {
    mockFetch.mockResolvedValue(reply(prefs({ displayMode: 'gamified' })));
    await makeStore().dispatch(getCurrentUserPreferences('a'));
    expect(JSON.parse(localStorage.getItem('userSettings')!)).toEqual({
      displayMode: 'gamified',
    });
  });

  it('copes with corrupt saved settings', async () => {
    localStorage.setItem('userSettings', '{nope');
    mockFetch.mockResolvedValue(reply(prefs()));
    const store = makeStore();
    await store.dispatch(getCurrentUserPreferences('a'));
    expect(console.error).toHaveBeenCalled();
    expect(store.getState().userPreferences.preferences).not.toBeNull();
  });

  it('leaves storage alone when the response has neither field', async () => {
    mockFetch.mockResolvedValue(reply({ id: 'p1' }));
    await makeStore().dispatch(getCurrentUserPreferences('a'));
    expect(localStorage.length).toBe(0);
  });

  it('records the failure', async () => {
    mockFetch.mockResolvedValue(reply({}, false));
    const store = makeStore();
    await store.dispatch(getCurrentUserPreferences('a'));
    expect(store.getState().userPreferences).toMatchObject({
      error: 'Failed to fetch user preferences',
      loading: false,
    });
  });
});

describe('updateUserPreferences', () => {
  it('puts the changes with the auth0 id', async () => {
    mockFetch.mockResolvedValue(reply({ theme: 'dark' }));
    await makeStore(prefs()).dispatch(
      updateUserPreferences({ preferencesData: { theme: 'dark' }, auth0Sub: 'a' }),
    );
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/users/me/preferences');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ theme: 'dark', auth0Sub: 'a' });
  });

  it('merges the response into the stored preferences and mirrors it to localStorage', async () => {
    mockFetch.mockResolvedValue(reply({ theme: 'dark', displayMode: 'gamified' }));
    const store = makeStore(prefs());
    await store.dispatch(
      updateUserPreferences({ preferencesData: {}, auth0Sub: 'a' }),
    );

    expect(store.getState().userPreferences.preferences).toMatchObject({
      id: 'p1',
      theme: 'dark',
      displayMode: 'gamified',
    });
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(JSON.parse(localStorage.getItem('userSettings')!).displayMode).toBe(
      'gamified',
    );
  });

  it('does not invent preferences when none were loaded', async () => {
    mockFetch.mockResolvedValue(reply({ theme: 'dark' }));
    const store = makeStore();
    await store.dispatch(
      updateUserPreferences({ preferencesData: {}, auth0Sub: 'a' }),
    );
    expect(store.getState().userPreferences.preferences).toBeNull();
  });

  it('copes with corrupt saved settings', async () => {
    localStorage.setItem('userSettings', '{nope');
    mockFetch.mockResolvedValue(reply({ displayMode: 'gamified' }));
    await makeStore(prefs()).dispatch(
      updateUserPreferences({ preferencesData: {}, auth0Sub: 'a' }),
    );
    expect(console.error).toHaveBeenCalled();
  });

  it('records the failure and keeps what it had', async () => {
    mockFetch.mockResolvedValue(reply({}, false));
    const store = makeStore(prefs());
    await store.dispatch(
      updateUserPreferences({ preferencesData: {}, auth0Sub: 'a' }),
    );
    expect(store.getState().userPreferences.error).toBe(
      'Failed to update user preferences',
    );
    expect(store.getState().userPreferences.preferences).toEqual(prefs());
  });
});

it('clearPreferences empties them and counts as initialized', () => {
  const store = makeStore(prefs());
  store.dispatch(clearPreferences());
  expect(store.getState().userPreferences).toMatchObject({
    preferences: null,
    initialized: true,
  });
});
