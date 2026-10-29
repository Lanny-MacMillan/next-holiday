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
});
