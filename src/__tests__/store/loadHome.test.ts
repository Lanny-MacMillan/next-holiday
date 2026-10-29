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

    it('shows a plan that has been on the server for a while', async () => {
      serverSays('free');
      await store.dispatch(loadHome(profile));
      store.dispatch({
        type: 'user/setUser',
        payload: {
          ...store.getState().user.user,
          lastUpdated: new Date(Date.now() - 60_000).toISOString(),
        },
      });

      serverSays('plus');
      await store.dispatch(loadHome(profile));

      expect(store.getState().user.user?.subscriptionPlan).toBe('plus');
    });

    // KNOWN ISSUE: every load stamps lastUpdated, and a free user updated in the last
    // 30 seconds is treated as "just downgraded", so a plan that changed on the server
    // (for example a Stripe upgrade) is ignored until 30 seconds after the last load.
    it.failing(
      'shows an upgrade made on the server right after a load',
      async () => {
        serverSays('free');
        await store.dispatch(loadHome(profile));

        serverSays('plus');
        await store.dispatch(loadHome(profile));

        expect(store.getState().user.user?.subscriptionPlan).toBe('plus');
      },
    );
  });
});
