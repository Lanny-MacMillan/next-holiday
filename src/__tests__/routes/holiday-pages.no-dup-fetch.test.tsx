import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { api } from '@/store/api';
import homeReducer from '@/store/slices/homeSlice';
import ChristmasPage from '@/app/christmas/page';

// Mock Auth0
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    user: { sub: 'test-user-123', email: 'test@example.com' },
    isAuthenticated: true,
    isLoading: false
  })
}));

// Mock RTK Query hooks
const mockUseGetGiftsQuery = jest.fn();
const mockUseGetCardsQuery = jest.fn();
const mockUseGetTasksQuery = jest.fn();

jest.mock('@/store/api', () => ({
  ...jest.requireActual('@/store/api'),
  useGetGiftsQuery: (params: any, options: any) => mockUseGetGiftsQuery(params, options),
  useGetCardsQuery: (params: any, options: any) => mockUseGetCardsQuery(params, options),
  useGetTasksQuery: (params: any, options: any) => mockUseGetTasksQuery(params, options)
}));

describe('Holiday Pages - No Duplicate Fetch', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = configureStore({
      reducer: {
        [api.reducerPath]: api.reducer,
        home: homeReducer
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(api.middleware)
    });

    mockUseGetGiftsQuery.mockReturnValue({ data: [], isLoading: false });
    mockUseGetCardsQuery.mockReturnValue({ data: [], isLoading: false });
    mockUseGetTasksQuery.mockReturnValue({ data: [], isLoading: false });
  });

  it('should NOT make RTK Query calls when home data is available', async () => {
    // Seed Redux with home data
    store.dispatch({
      type: 'home/setHomeData',
      payload: {
        holidayPreferences: [{ holiday: 'Christmas', holidayId: 'christmas-123', budget: 500 }],
        contacts: [],
        user: null,
        account: null,
        needsUserSetup: false,
        needsHolidaySelection: false
      }
    });

    render(
      <Provider store={store}>
        <ChristmasPage />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Christmas')).toBeTruthy();
    });

    // Verify RTK Query hooks were called with skip: true
    expect(mockUseGetGiftsQuery).toHaveBeenCalledWith(
      { holidayId: 'christmas-123', auth0User: { sub: 'test-user-123', email: 'test@example.com' } },
      { skip: true }
    );
  });
});
