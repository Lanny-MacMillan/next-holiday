import { configureStore } from '@reduxjs/toolkit';
import homeReducer, * as home from '@/store/slices/homeSlice';
import { leaveShare, removeMemberFromShare } from '@/store/slices/sharesSlice';
import { acceptInvite } from '@/store/slices/invitesSlice';
import { toggleTheme, updateSettings } from '@/store/slices/themeSlice';
import { updateUserPreferences } from '@/store/slices/userPreferencesSlice';
import type { HomeData } from '@/types/home';

type State = ReturnType<typeof homeReducer>;

const fixture = () =>
  ({
    holidayPreferences: [
      {
        holiday: 'Christmas',
        holidayId: 'h1',
        gifts: [{ id: 'g1', name: 'Scarf', isCompleted: false }],
        tasks: [{ id: 't1', title: 'Wrap' }],
        events: [{ id: 'e1', title: 'Party' }],
        decorations: [{ id: 'd1', title: 'Tree' }],
        cards: [{ id: 'c1', recipient: 'Ann' }],
        guestLists: [{ id: 'gu1', name: 'Bob' }],
      },
      {
        holiday: 'Hanukkah',
        holidayId: 'h2',
        gifts: [{ id: 'g9', name: 'Menorah' }],
      },
    ],
    contacts: [{ id: 'k1', name: 'Ann' }],
    user: null,
    account: null,
    needsUserSetup: false,
    needsHolidaySelection: false,
  }) as unknown as HomeData;

const loaded = (): State => homeReducer(undefined, home.setHomeData(fixture()));
const pref = (state: State, id: string) =>
  state.data!.holidayPreferences!.find(p => p.holidayId === id) as any;

describe('home slice: loading and clearing', () => {
  it('starts empty', () => {
    expect(homeReducer(undefined, { type: '@@init' })).toEqual({
      data: null,
      loading: false,
      error: null,
      initialized: false,
    });
  });

  it('setHomeData stores the data and marks it initialized', () => {
    const state = homeReducer(
      { data: null, loading: true, error: 'old', initialized: false },
      home.setHomeData(fixture()),
    );
    expect(state).toMatchObject({ initialized: true, loading: false, error: null });
    expect(state.data?.holidayPreferences).toHaveLength(2);
  });

  it('clearHomeData puts everything back', () => {
    expect(homeReducer(loaded(), home.clearHomeData())).toEqual({
      data: null,
      loading: false,
      error: null,
      initialized: false,
    });
  });

  it('removeSharedHolidayData drops one holiday and keeps the others', () => {
    const state = homeReducer(
      loaded(),
      home.removeSharedHolidayData({ holidayId: 'h2' }),
    );
    expect(state.data!.holidayPreferences!.map(p => p.holidayId)).toEqual(['h1']);
  });
});

const families = [
  {
    name: 'gift',
    key: 'gifts',
    add: home.addGiftToHomeData,
    remove: home.removeGiftFromHomeData,
    update: home.updateGiftInHomeData,
    item: 'gift',
    id: 'giftId',
    existing: 'g1',
  },
  {
    name: 'task',
    key: 'tasks',
    add: home.addTaskToHomeData,
    remove: home.removeTaskFromHomeData,
    update: home.updateTaskInHomeData,
    item: 'task',
    id: 'taskId',
    existing: 't1',
  },
  {
    name: 'event',
    key: 'events',
    add: home.addEventToHomeData,
    remove: home.removeEventFromHomeData,
    update: home.updateEventInHomeData,
    item: 'event',
    id: 'eventId',
    existing: 'e1',
  },
  {
    name: 'decoration',
    key: 'decorations',
    add: home.addDecorationToHomeData,
    remove: home.removeDecorationFromHomeData,
    update: home.updateDecorationInHomeData,
    item: 'decoration',
    id: 'decorationId',
    existing: 'd1',
  },
  {
    name: 'card',
    key: 'cards',
    add: home.addCardToHomeData,
    remove: home.removeCardFromHomeData,
    update: home.updateCardInHomeData,
    item: 'card',
    id: 'cardId',
    existing: 'c1',
  },
  {
    name: 'guest',
    key: 'guestLists',
    add: home.addGuestToHomeData,
    remove: home.removeGuestFromHomeData,
    update: home.updateGuestInHomeData,
    item: 'guest',
    id: 'guestId',
    existing: 'gu1',
  },
] as const;

describe.each(families)(
  'home slice: $name list',
  ({ key, add, remove, update, item, id, existing }) => {
    const a = add as (p: any) => { type: string };
    const r = remove as (p: any) => { type: string };
    const u = update as (p: any) => { type: string };

    it('adds an item to that holiday only', () => {
      const state = homeReducer(
        loaded(),
        a({ holidayId: 'h1', [item]: { id: 'new' } }),
      );
      expect(pref(state, 'h1')[key].map((x: any) => x.id)).toEqual([
        existing,
        'new',
      ]);
      expect(pref(state, 'h2')[key]).toEqual(
        key === 'gifts' ? [{ id: 'g9', name: 'Menorah' }] : undefined,
      );
    });

    it('creates the list when the holiday has none yet', () => {
      const state = homeReducer(
        loaded(),
        a({ holidayId: 'h2', [item]: { id: 'first' } }),
      );
      expect(pref(state, 'h2')[key].some((x: any) => x.id === 'first')).toBe(true);
    });

    it('removes an item by id', () => {
      const state = homeReducer(loaded(), r({ holidayId: 'h1', [id]: existing }));
      expect(pref(state, 'h1')[key]).toEqual([]);
    });

    it('leaves the list alone when the id is unknown', () => {
      const state = homeReducer(loaded(), r({ holidayId: 'h1', [id]: 'nope' }));
      expect(pref(state, 'h1')[key]).toHaveLength(1);
    });

    it('updates an item by merging the changes in', () => {
      const state = homeReducer(
        loaded(),
        u({ holidayId: 'h1', [id]: existing, updates: { extra: 1 } }),
      );
      expect(pref(state, 'h1')[key][0]).toMatchObject({ id: existing, extra: 1 });
    });

    it('ignores an update for an unknown id', () => {
      const before = loaded();
      const state = homeReducer(
        before,
        u({ holidayId: 'h1', [id]: 'nope', updates: { extra: 1 } }),
      );
      expect(pref(state, 'h1')[key]).toEqual(pref(before, 'h1')[key]);
    });

    it('does nothing for an unknown holiday', () => {
      const before = loaded();
      for (const action of [
        a({ holidayId: 'zzz', [item]: { id: 'x' } }),
        r({ holidayId: 'zzz', [id]: existing }),
        u({ holidayId: 'zzz', [id]: existing, updates: { extra: 1 } }),
      ]) {
        expect(homeReducer(before, action)).toEqual(before);
      }
    });

    it('does nothing before any home data has loaded', () => {
      const empty = homeReducer(undefined, { type: '@@init' });
      for (const action of [
        a({ holidayId: 'h1', [item]: { id: 'x' } }),
        r({ holidayId: 'h1', [id]: existing }),
        u({ holidayId: 'h1', [id]: existing, updates: {} }),
      ]) {
        expect(homeReducer(empty, action)).toBe(empty);
      }
    });
  },
);

describe('home slice: removing from a holiday that has no such list', () => {
  it('is a no-op', () => {
    const state = homeReducer(
      loaded(),
      home.removeTaskFromHomeData({ holidayId: 'h2', taskId: 't1' }),
    );
    expect(pref(state, 'h2').tasks).toBeUndefined();
  });
});

describe('home slice: selectors', () => {
  const root = (data: HomeData | null) => ({
    home: { data, loading: false, error: null, initialized: true },
  });

  it('selectHomeData returns the data', () => {
    expect(home.selectHomeData(root(fixture()))).toEqual(fixture());
    expect(home.selectHomeData(root(null))).toBeNull();
  });

  it('selectContacts defaults to an empty list', () => {
    expect(home.selectContacts(root(fixture()))).toEqual([
      { id: 'k1', name: 'Ann' },
    ]);
    expect(home.selectContacts(root(null))).toEqual([]);
  });

  it('selectGuestListsByHoliday returns that holiday’s guests, or nothing', () => {
    expect(home.selectGuestListsByHoliday('h1')(root(fixture()))).toEqual([
      { id: 'gu1', name: 'Bob' },
    ]);
    expect(home.selectGuestListsByHoliday('h2')(root(fixture()))).toEqual([]);
    expect(home.selectGuestListsByHoliday('zzz')(root(fixture()))).toEqual([]);
    expect(home.selectGuestListsByHoliday('h1')(root(null))).toEqual([]);
  });
});

describe('home slice: reacting to other slices', () => {
  const settle = (action: { type: string; payload?: unknown }) =>
    homeReducer(loaded(), action);

  it.each([
    ['leaving a share', leaveShare.fulfilled({} as never, 'id', {} as never)],
    [
      'removing a member',
      removeMemberFromShare.fulfilled({} as never, 'id', {} as never),
    ],
    ['accepting an invite', acceptInvite.fulfilled({} as never, 'id', {} as never)],
    ['toggling the theme', toggleTheme()],
    [
      'saving user preferences',
      updateUserPreferences.fulfilled({} as never, 'id', {} as never),
    ],
    [
      'changing the display mode',
      updateSettings({ displayMode: 'gamified' } as never),
    ],
    ['changing the theme', updateSettings({ theme: 'dark' } as never)],
  ])('is flagged as loading after %s', (_, action) => {
    expect(settle(action as never).loading).toBe(true);
  });

  it('ignores settings changes that do not affect the data', () => {
    expect(settle(updateSettings({ giftBudgetLimit: 5 } as never)).loading).toBe(
      false,
    );
  });
});

describe('refreshHomeData', () => {
  const mockFetch = jest.fn();
  const user = { sub: 'auth0|me', email: 'me@x.com', name: 'Me', picture: 'p.png' };
  const makeStore = () => configureStore({ reducer: { home: homeReducer } });

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('loads the home data and marks the slice initialized', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: fixture() }),
    });
    const store = makeStore();
    const pending = store.dispatch(home.refreshHomeData(user));
    await pending;

    expect(mockFetch.mock.calls[0][0]).toBe('/api/home');
    expect(store.getState().home).toMatchObject({
      initialized: true,
      loading: false,
      error: null,
    });
    expect(store.getState().home.data?.holidayPreferences).toHaveLength(2);
  });

  it('sends the user in the legacy header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: fixture() }),
    });
    await makeStore().dispatch(home.refreshHomeData(user));
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(JSON.parse(headers['x-test-user'])).toEqual(user);
  });

  it('keeps the old data and records the error when the request fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    const store = makeStore();
    await store.dispatch(home.setHomeData(fixture()));
    await store.dispatch(home.refreshHomeData(user));

    expect(store.getState().home.error).toBe('Failed to fetch home data');
    expect(store.getState().home.data?.holidayPreferences).toHaveLength(2);
  });

  it('uses a generic message when the rejection has none', () => {
    const rejected = home.refreshHomeData.rejected(new Error(''), 'id', user);
    expect(homeReducer(loaded(), rejected).error).toBe(
      'Failed to refresh home data',
    );
  });
});
