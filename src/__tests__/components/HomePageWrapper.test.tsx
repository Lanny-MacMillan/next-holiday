/**
 * @jest-environment jsdom
 */
import { act, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { api } from '@/store/api';
import { clearHomeData } from '@/store/slices/homeSlice';
import { clearUser, setUser } from '@/store/slices/userSlice';
import HomePageWrapper from '@/components/HomePageWrapper';

let authValue: {
  user?: { sub: string; email: string; name: string };
  isAuthenticated: boolean;
  isLoading: boolean;
};
jest.mock('@auth0/auth0-react', () => ({ useAuth0: () => authValue }));

jest.mock('@/components/HomeContent', () => ({
  __esModule: true,
  default: ({ homeData }: { homeData: { holidayPreferences?: unknown[] } }) =>
    require('react').createElement(
      'div',
      { 'data-testid': 'home-content' },
      `${homeData.holidayPreferences?.length ?? 0} holidays`,
    ),
}));
jest.mock('@/components/UserSetupHandler', () => ({
  __esModule: true,
  default: ({ needsUserSetup }: { needsUserSetup: boolean }) =>
    require('react').createElement(
      'div',
      { 'data-testid': 'setup' },
      `setup:${needsUserSetup}`,
    ),
}));

const mockFetch = jest.fn();
const signedIn = {
  user: { sub: 'auth0|me', email: 'me@x.com', name: 'Me' },
  isAuthenticated: true,
  isLoading: false,
};

const dbUser = {
  id: 'u1',
  auth0Sub: 'auth0|me',
  email: 'me@x.com',
  name: 'Me',
  subscriptionPlan: 'plus',
  subscriptionStartDate: '2024-01-01',
  subscriptionEndDate: '2025-01-01',
};
const holiday = (over = {}) => ({
  holiday: 'Christmas',
  holidayId: 'h1',
  budget: 500,
  gifts: [{ id: 'g1', name: 'Scarf' }],
  cards: [],
  tasks: [{ id: 't1', title: 'Wrap' }],
  ...over,
});
const homeData = (over = {}) => ({
  holidayPreferences: [holiday()],
  contacts: [],
  user: dbUser,
  account: { id: 'a1' },
  needsUserSetup: false,
  needsHolidaySelection: false,
  ...over,
});
const serve = (data: unknown, ok = true) =>
  mockFetch.mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => ({ success: true, data }),
  });

const mount = () =>
  render(
    <Provider store={store}>
      <HomePageWrapper />
    </Provider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  authValue = signedIn;
  global.fetch = mockFetch as unknown as typeof fetch;
  act(() => {
    store.dispatch(clearHomeData());
    store.dispatch(clearUser());
  });
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('HomePageWrapper', () => {
  describe('loading', () => {
    it('shows a spinner and makes no request while Auth0 is still loading', () => {
      authValue = { isAuthenticated: false, isLoading: true };
      mount();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('makes no request for a signed-out visitor', async () => {
      authValue = { isAuthenticated: false, isLoading: false };
      mount();
      await waitFor(() =>
        expect(screen.getByText('Loading...')).toBeInTheDocument(),
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('requests the home data once for a signed-in user, showing progress meanwhile', async () => {
      let release!: (v: unknown) => void;
      mockFetch.mockReturnValue(new Promise(resolve => (release = resolve)));
      mount();

      expect(screen.getByText('Loading your holiday data...')).toBeInTheDocument();
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toBe('/api/home');

      await act(async () =>
        release({ ok: true, status: 200, json: async () => ({ data: homeData() }) }),
      );
      expect(await screen.findByTestId('home-content')).toBeInTheDocument();
    });

    it('renders the home content once the data arrives', async () => {
      serve(
        homeData({ holidayPreferences: [holiday(), holiday({ holidayId: 'h2' })] }),
      );
      mount();
      expect(await screen.findByTestId('home-content')).toHaveTextContent(
        '2 holidays',
      );
    });
  });

  describe('first-time users', () => {
    it('shows the setup screen instead of the home content', async () => {
      serve(homeData({ needsUserSetup: true, user: null }));
      mount();
      expect(await screen.findByTestId('setup')).toHaveTextContent('setup:true');
      expect(screen.queryByTestId('home-content')).not.toBeInTheDocument();
    });
  });

  describe('what it puts in the store', () => {
    it('saves the home data', async () => {
      serve(homeData());
      mount();
      await screen.findByTestId('home-content');
      expect(store.getState().home.data?.holidayPreferences).toHaveLength(1);
      expect(store.getState().home.initialized).toBe(true);
    });

    it('saves the user with their plan from the server', async () => {
      serve(homeData());
      mount();
      await screen.findByTestId('home-content');

      expect(store.getState().user.user).toMatchObject({
        sub: 'auth0|me',
        email: 'me@x.com',
        isInDb: true,
        subscriptionPlan: 'plus',
        subscriptionEndDate: '2025-01-01',
      });
    });

    it('defaults to the free plan when the server sends none', async () => {
      serve(homeData({ user: { ...dbUser, subscriptionPlan: undefined } }));
      mount();
      await screen.findByTestId('home-content');
      expect(store.getState().user.user?.subscriptionPlan).toBe('free');
    });

    it('keeps a downgrade made in the last 30 seconds instead of stale server data', async () => {
      act(() => {
        store.dispatch(
          setUser({
            sub: 'auth0|me',
            isInDb: true,
            subscriptionPlan: 'free',
            lastUpdated: new Date().toISOString(),
          } as never),
        );
      });
      serve(homeData());
      mount();
      await screen.findByTestId('home-content');

      const user = store.getState().user.user;
      expect(user?.subscriptionPlan).toBe('free');
      expect(user?.subscriptionEndDate).toBeUndefined();
    });

    it('trusts the server again once the downgrade is older than 30 seconds', async () => {
      act(() => {
        store.dispatch(
          setUser({
            sub: 'auth0|me',
            isInDb: true,
            subscriptionPlan: 'free',
            lastUpdated: new Date(Date.now() - 60_000).toISOString(),
          } as never),
        );
      });
      serve(homeData());
      mount();
      await screen.findByTestId('home-content');
      expect(store.getState().user.user?.subscriptionPlan).toBe('plus');
    });

    it('saves each holiday budget', async () => {
      serve(
        homeData({
          holidayPreferences: [holiday(), holiday({ holidayId: 'h2', budget: 250 })],
        }),
      );
      mount();
      await screen.findByTestId('home-content');

      const budgets = store.getState().budgets.entities;
      expect(budgets['h1']?.targetAmount).toBe(500);
      expect(budgets['h2']?.targetAmount).toBe(250);
    });

    it('skips holidays with no budget', async () => {
      serve(
        homeData({
          holidayPreferences: [holiday({ holidayId: 'h3', budget: undefined })],
        }),
      );
      mount();
      await screen.findByTestId('home-content');
      expect(store.getState().budgets.entities['h3']).toBeUndefined();
    });

    // KNOWN ISSUE: RTK Query passes upserted values through the endpoint's
    // transformResponse, which expects { data: [...] }. The pre-fill sends bare
    // arrays, so these caches end up empty. Turn this into a plain `it` once fixed.
    it.failing(
      "pre-fills the gifts and tasks caches so holiday pages don't fetch them again",
      async () => {
        serve(homeData());
        mount();
        await screen.findByTestId('home-content');

        await waitFor(() => {
          const args = { holidayId: 'h1', auth0User: signedIn.user };
          const gifts = api.endpoints.getGifts.select(args)(
            store.getState() as never,
          );
          const tasks = api.endpoints.getTasks.select(args)(
            store.getState() as never,
          );
          expect(gifts.data).toEqual([{ id: 'g1', name: 'Scarf' }]);
          expect(tasks.data).toEqual([{ id: 't1', title: 'Wrap' }]);
        });
      },
    );
  });

  describe('failures', () => {
    it('shows an error with a refresh button when the server responds with an error', async () => {
      serve(null, false);
      mount();
      expect(await screen.findByText('Error Loading Page')).toBeInTheDocument();
      expect(screen.getByText('Failed to load page data')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Refresh Page' }),
      ).toBeInTheDocument();
    });

    it('shows the same error when the request itself fails', async () => {
      mockFetch.mockRejectedValue(new Error('offline'));
      mount();
      expect(await screen.findByText('Error Loading Page')).toBeInTheDocument();
      expect(store.getState().home.data).toBeNull();
    });
  });
});
