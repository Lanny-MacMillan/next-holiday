import { configureStore } from '@reduxjs/toolkit';
import userReducer, {
  addUserToDb,
  checkUserInDb,
  clearUser,
  selectIsUserPlusMember,
  selectUser,
  selectUserInitialized,
  selectUserLoading,
  selectUserSubscriptionData,
  selectUserSubscriptionPlan,
  setUser,
  updateSubscription,
  upgradeUser,
  type User,
} from '@/store/slices/userSlice';

const mockFetch = jest.fn();
const makeStore = (user: User | null = null) =>
  configureStore({
    reducer: { user: userReducer },
    preloadedState: {
      user: { user, loading: false, error: null, initialized: false },
    },
  });
const me: User = {
  sub: 'auth0|me',
  email: 'me@x.com',
  subscriptionPlan: 'plus',
  subscriptionStartDate: 'start',
};

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

describe('setUser', () => {
  it('stores a new user and marks the slice initialized', () => {
    const store = makeStore();
    store.dispatch(setUser(me));
    expect(store.getState().user).toMatchObject({ user: me, initialized: true });
  });

  it('null clears the user but still counts as initialized', () => {
    const store = makeStore(me);
    store.dispatch(setUser(null));
    expect(store.getState().user).toMatchObject({ user: null, initialized: true });
  });

  it('keeps the existing subscription when the same user arrives without one', () => {
    const store = makeStore(me);
    store.dispatch(setUser({ sub: me.sub, name: 'Me' }));
    expect(selectUser(store.getState())).toEqual({ ...me, name: 'Me' });
  });

  it('takes the new subscription when the same user arrives with one', () => {
    const store = makeStore(me);
    store.dispatch(setUser({ sub: me.sub, subscriptionPlan: 'free' }));
    expect(selectUser(store.getState())).toMatchObject({
      subscriptionPlan: 'free',
      email: 'me@x.com',
    });
  });

  it('replaces the user outright when a different one signs in', () => {
    const store = makeStore(me);
    store.dispatch(setUser({ sub: 'auth0|other' }));
    expect(selectUser(store.getState())).toEqual({ sub: 'auth0|other' });
  });
});

describe('clearUser and updateSubscription', () => {
  it('clearUser empties the user', () => {
    const store = makeStore(me);
    store.dispatch(clearUser());
    expect(store.getState().user).toMatchObject({ user: null, initialized: true });
  });

  it('updateSubscription overwrites the three subscription fields', () => {
    const store = makeStore(me);
    store.dispatch(updateSubscription({ subscriptionPlan: 'free' }));
    expect(selectUser(store.getState())).toMatchObject({
      subscriptionPlan: 'free',
      subscriptionStartDate: undefined,
      subscriptionEndDate: undefined,
    });
  });

  it('updateSubscription does nothing without a user', () => {
    const store = makeStore();
    store.dispatch(updateSubscription({ subscriptionPlan: 'plus' }));
    expect(selectUser(store.getState())).toBeNull();
  });
});

describe('upgradeUser', () => {
  const reply = (body: unknown, ok = true) => ({ ok, json: async () => body });

  it('posts the plan (plus by default) and applies the returned subscription', async () => {
    mockFetch.mockResolvedValue(
      reply({
        user: {
          subscriptionPlan: 'plus',
          subscriptionStartDate: 's',
          subscriptionEndDate: 'e',
        },
      }),
    );
    const store = makeStore({ sub: me.sub });
    await store.dispatch(upgradeUser({ auth0Sub: me.sub }));

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/upgrade-user');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ auth0Sub: me.sub, plan: 'plus' });
    expect(selectUser(store.getState())).toMatchObject({
      subscriptionPlan: 'plus',
      subscriptionStartDate: 's',
      subscriptionEndDate: 'e',
    });
    expect(selectUserLoading(store.getState())).toBe(false);
  });

  it('can downgrade', async () => {
    mockFetch.mockResolvedValue(reply({ user: { subscriptionPlan: 'free' } }));
    const store = makeStore(me);
    await store.dispatch(upgradeUser({ auth0Sub: me.sub, plan: 'free' }));
    expect(JSON.parse(mockFetch.mock.calls[0][1].body).plan).toBe('free');
    expect(selectUserSubscriptionPlan(store.getState())).toBe('free');
  });

  it("records the server's error", async () => {
    mockFetch.mockResolvedValue(reply({ error: 'Forbidden' }, false));
    const store = makeStore(me);
    await store.dispatch(upgradeUser({ auth0Sub: me.sub }));
    expect(store.getState().user.error).toBe('Forbidden');
    expect(selectUser(store.getState())).toEqual(me);
  });

  it('falls back to a generic message', async () => {
    mockFetch.mockResolvedValue(reply({}, false));
    const store = makeStore(me);
    await store.dispatch(upgradeUser({ auth0Sub: me.sub }));
    expect(store.getState().user.error).toBe('Failed to upgrade user');
  });

  it('is loading while the request runs', async () => {
    let release!: (v: unknown) => void;
    mockFetch.mockReturnValue(new Promise(resolve => (release = resolve)));
    const store = makeStore(me);
    const pending = store.dispatch(upgradeUser({ auth0Sub: me.sub }));
    expect(selectUserLoading(store.getState())).toBe(true);
    release(reply({ user: { subscriptionPlan: 'plus' } }));
    await pending;
  });
});

describe('the placeholder DB thunks', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('checkUserInDb reports the user as not in the DB', async () => {
    const store = makeStore({ sub: me.sub, isInDb: true });
    const pending = store.dispatch(checkUserInDb(me.sub));
    expect(selectUserLoading(store.getState())).toBe(true);
    await jest.advanceTimersByTimeAsync(500);
    await pending;
    expect(selectUser(store.getState())?.isInDb).toBe(false);
    expect(selectUserLoading(store.getState())).toBe(false);
  });

  it('checkUserInDb with no user leaves the state empty', async () => {
    const store = makeStore();
    const pending = store.dispatch(checkUserInDb(me.sub));
    await jest.advanceTimersByTimeAsync(500);
    await pending;
    expect(selectUser(store.getState())).toBeNull();
  });

  it('addUserToDb stores the user flagged as in the DB', async () => {
    const store = makeStore();
    const pending = store.dispatch(addUserToDb({ sub: me.sub, email: me.email }));
    await jest.advanceTimersByTimeAsync(500);
    await pending;
    expect(selectUser(store.getState())).toEqual({
      sub: me.sub,
      email: me.email,
      isInDb: true,
    });
  });
});

describe('selectors', () => {
  it('default to the free plan with no user', () => {
    const state = makeStore().getState();
    expect(selectUserSubscriptionPlan(state)).toBe('free');
    expect(selectIsUserPlusMember(state)).toBe(false);
    expect(selectUserSubscriptionData(state)).toEqual({
      plan: 'free',
      startDate: undefined,
      endDate: undefined,
    });
    expect(selectUserInitialized(state)).toBe(false);
  });

  it('read the plan and dates of a plus user', () => {
    const state = makeStore({ ...me, subscriptionEndDate: 'end' }).getState();
    expect(selectIsUserPlusMember(state)).toBe(true);
    expect(selectUserSubscriptionData(state)).toEqual({
      plan: 'plus',
      startDate: 'start',
      endDate: 'end',
    });
  });

  it('selectUserSubscriptionData returns the same object while the user is unchanged', () => {
    const state = makeStore(me).getState();
    expect(selectUserSubscriptionData(state)).toBe(
      selectUserSubscriptionData(state),
    );
  });
});
