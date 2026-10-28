import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import ChristmasPage from '@/app/christmas/page';

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    user: { sub: 'test-user-123', email: 'test@example.com' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

const mockFetch = jest.fn();

describe('Holiday pages - no duplicate fetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('renders from home data already in Redux without re-fetching its data', async () => {
    store.dispatch({
      type: 'home/setHomeData',
      payload: {
        holidayPreferences: [
          { holiday: 'Christmas', holidayId: 'christmas-123', budget: 500 },
        ],
        contacts: [],
        user: null,
        account: null,
        needsUserSetup: false,
        needsHolidaySelection: false,
      },
    });

    render(
      <Provider store={store}>
        <ChristmasPage />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText('Christmas').length).toBeGreaterThan(0);
    });

    // The only request is the user-id lookup; no gifts/cards/tasks/budget/home
    // data is re-fetched because home data is already in Redux.
    const urls = mockFetch.mock.calls.map(c => String(c[0]));
    expect(urls.filter(u => !u.startsWith('/api/users/by-auth0-sub'))).toEqual([]);
  });
});
