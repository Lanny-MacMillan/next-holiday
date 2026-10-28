/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { clearHomeData } from '@/store/slices/homeSlice';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';

const mockFetch = jest.fn();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);
const user = { sub: 'auth0|me', email: 'me@x.com', name: 'Me' };
const homeData = {
  holidayPreferences: [{ holiday: 'Christmas', holidayId: 'h1' }],
  contacts: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = mockFetch as unknown as typeof fetch;
  act(() => {
    store.dispatch(clearHomeData());
  });
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('useRefreshHomeData', () => {
  const refresh = (u: unknown) => {
    const { result } = renderHook(() => useRefreshHomeData(), { wrapper });
    return act(async () => {
      await result.current.refreshHomeData(u);
    });
  };

  it('does nothing without a signed-in user', async () => {
    await refresh(undefined);
    await refresh({});
    expect(mockFetch).not.toHaveBeenCalled();
    expect(store.getState().home.data).toBeNull();
  });

  it('fetches the home data and replaces what is in the store', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: homeData }),
    });
    await refresh(user);

    expect(mockFetch.mock.calls[0][0]).toBe('/api/home');
    expect(store.getState().home.data).toEqual(homeData);
    expect(store.getState().home.initialized).toBe(true);
  });

  it('leaves the store alone when the server answers with an error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    await refresh(user);
    expect(store.getState().home.data).toBeNull();
  });

  it('swallows a network failure without touching the store', async () => {
    mockFetch.mockRejectedValue(new Error('offline'));
    await expect(refresh(user)).resolves.not.toThrow();
    expect(store.getState().home.data).toBeNull();
  });
});
