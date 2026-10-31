import { store } from '@/store';
import { loadHome } from '@/store/loadHome';
import { clearHomeData } from '@/store/slices/homeSlice';
import { clearUser } from '@/store/slices/userSlice';

const mockFetch = jest.fn();
const profile = { sub: 'auth0|me', email: 'me@x.com', name: 'Me' };
const data = {
  holidayPreferences: [],
  user: { email: 'me@x.com', name: 'Me', subscriptionPlan: 'plus' },
  needsUserSetup: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = mockFetch as unknown as typeof fetch;
  store.dispatch(clearHomeData());
  store.dispatch(clearUser());
});

describe('loadHome', () => {
  it('puts the home data and the user in the store', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data }) });
    await store.dispatch(loadHome(profile));

    expect(mockFetch).toHaveBeenCalledWith('/api/home');
    expect(store.getState().home.initialized).toBe(true);
    expect(store.getState().user.user?.subscriptionPlan).toBe('plus');
  });

  it('shares one request between callers that ask at the same time', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data }) });
    await Promise.all([
      store.dispatch(loadHome(profile)),
      store.dispatch(loadHome(profile)),
    ]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('asks again later, and a failure leaves the store untouched', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });
    const failed = await store.dispatch(loadHome(profile));

    expect(failed.type).toBe('home/load/rejected');
    expect(store.getState().home.initialized).toBe(false);

    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data }) });
    await store.dispatch(loadHome(profile));
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(store.getState().home.initialized).toBe(true);
  });

  describe('a plan changed on the server', () => {
    const serverSays = (subscriptionPlan: 'free' | 'plus') =>
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { ...data, user: { ...data.user, subscriptionPlan } },
        }),
      });
    const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
    const downgradedInApp = (at: string) =>
      store.dispatch({
        type: 'user/setUser',
        payload: {
          ...store.getState().user.user,
          subscriptionPlan: 'free',
          downgradedAt: at,
        },
      });

    it('shows an upgrade made on the server right after a load', async () => {
      serverSays('free');
      await store.dispatch(loadHome(profile));

      serverSays('plus');
      await store.dispatch(loadHome(profile));

      expect(store.getState().user.user?.subscriptionPlan).toBe('plus');
    });

    it('shows a plan that has been on the server for a while', async () => {
      serverSays('free');
      await store.dispatch(loadHome(profile));

      serverSays('plus');
      await store.dispatch(loadHome(profile));
      await store.dispatch(loadHome(profile));

      expect(store.getState().user.user?.subscriptionPlan).toBe('plus');
    });

    it('keeps a downgrade made in the app in the last 30 seconds, until the server catches up', async () => {
      serverSays('plus');
      await store.dispatch(loadHome(profile));
      downgradedInApp(ago(5_000));

      await store.dispatch(loadHome(profile));

      const user = store.getState().user.user;
      expect(user?.subscriptionPlan).toBe('free');
      expect(user?.subscriptionStartDate).toBeUndefined();
    });

    it('trusts the server again once that downgrade is more than 30 seconds old', async () => {
      serverSays('plus');
      await store.dispatch(loadHome(profile));
      downgradedInApp(ago(60_000));

      await store.dispatch(loadHome(profile));

      expect(store.getState().user.user?.subscriptionPlan).toBe('plus');
    });

    it('does not treat a free user as just downgraded because the page loaded a moment ago', async () => {
      serverSays('free');
      await store.dispatch(loadHome(profile));
      expect(store.getState().user.user?.downgradedAt).toBeUndefined();
    });
  });
});
