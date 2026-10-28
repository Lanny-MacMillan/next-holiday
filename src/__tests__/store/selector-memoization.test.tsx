/**
 * @jest-environment jsdom
 */

import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ReactNode } from 'react';
import {
  selectHolidayPreferences,
  selectHolidayPrefById,
  selectHolidayBudgetById,
  selectContacts,
  selectContactById,
  selectHolidayIdByRoute,
} from '@/store/selectors/home';
import homeSlice from '@/store/slices/homeSlice';
import { HomeData } from '@/types/home';
import type { RootState } from '@/store';

// Mock data
const mockHomeData = {
  holidayPreferences: [
    {
      holiday: 'Christmas',
      holidayId: 'christmas-123',
      budget: 500,
      countdownTimer: '2024-12-25T00:00:00Z',
    },
    {
      holiday: 'Hanukkah',
      holidayId: 'hanukkah-456',
      budget: 300,
      countdownTimer: '2024-12-25T00:00:00Z',
    },
  ],
  contacts: [
    { id: 'contact-1', name: 'John Doe', email: 'john@example.com' },
    { id: 'contact-2', name: 'Jane Smith', email: 'jane@example.com' },
  ],
  user: {
    id: 'user-123',
    auth0Sub: 'auth0|123',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/picture.jpg',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  account: {
    id: 'account-123',
    name: 'Test Account',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  needsUserSetup: false,
  needsHolidaySelection: false,
} as unknown as HomeData;

describe('Selector Memoization', () => {
  const makeStore = () => configureStore({ reducer: { home: homeSlice } });
  let store: ReturnType<typeof makeStore>;
  // Only the home slice is registered here; selectors are typed against the full state
  const getState = () => store.getState() as unknown as RootState;

  beforeEach(() => {
    store = makeStore();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  it('should return stable references for selectHolidayPreferences when data unchanged', () => {
    // Set initial data
    store.dispatch({
      type: 'home/setHomeData',
      payload: mockHomeData,
    });

    const { result, rerender } = renderHook(
      () => selectHolidayPreferences(getState()),
      { wrapper },
    );

    const firstResult = result.current;

    // Rerender without changing data
    rerender();
    const secondResult = result.current;

    // Should return the same reference (memoized)
    expect(firstResult).toBe(secondResult);
    expect(firstResult).toEqual(mockHomeData.holidayPreferences);
  });

  it('should return new reference when data changes', () => {
    // Set initial data
    store.dispatch({
      type: 'home/setHomeData',
      payload: mockHomeData,
    });

    const { result, rerender } = renderHook(
      () => selectHolidayPreferences(getState()),
      { wrapper },
    );

    const firstResult = result.current;

    // Update data
    const updatedData = {
      ...mockHomeData,
      holidayPreferences: [
        ...(mockHomeData.holidayPreferences ?? []),
        {
          holiday: 'Easter',
          holidayId: 'easter-789',
          budget: 200,
          countdownTimer: '2024-04-21T00:00:00Z',
        },
      ],
    };

    store.dispatch({
      type: 'home/setHomeData',
      payload: updatedData,
    });

    rerender();
    const secondResult = result.current;

    // Should return different reference (data changed)
    expect(firstResult).not.toBe(secondResult);
    expect(secondResult).toHaveLength(3);
  });

  it('should memoize selectHolidayPrefById correctly', () => {
    store.dispatch({
      type: 'home/setHomeData',
      payload: mockHomeData,
    });

    const { result, rerender } = renderHook(
      () => selectHolidayPrefById(getState(), 'christmas-123'),
      { wrapper },
    );

    const firstResult = result.current;

    // Rerender with same holidayId
    rerender();
    const secondResult = result.current;

    // Should return same reference
    expect(firstResult).toBe(secondResult);
    expect(firstResult?.holidayId).toBe('christmas-123');

    // Test with different holidayId
    const { result: result2 } = renderHook(
      () => selectHolidayPrefById(getState(), 'hanukkah-456'),
      { wrapper },
    );

    expect(result2.current?.holidayId).toBe('hanukkah-456');
    expect(result2.current).not.toBe(firstResult);
  });

  it('should memoize selectHolidayBudgetById correctly', () => {
    store.dispatch({
      type: 'home/setHomeData',
      payload: mockHomeData,
    });

    const { result, rerender } = renderHook(
      () => selectHolidayBudgetById(getState(), 'christmas-123'),
      { wrapper },
    );

    const firstResult = result.current;

    // Rerender with same holidayId
    rerender();
    const secondResult = result.current;

    // Should return same reference
    expect(firstResult).toBe(secondResult);
    expect(firstResult).toBe(500);
  });

  it('should memoize selectContacts correctly', () => {
    store.dispatch({
      type: 'home/setHomeData',
      payload: mockHomeData,
    });

    const { result, rerender } = renderHook(() => selectContacts(getState()), {
      wrapper,
    });

    const firstResult = result.current;

    // Rerender without changing data
    rerender();
    const secondResult = result.current;

    // Should return same reference
    expect(firstResult).toBe(secondResult);
    expect(firstResult).toEqual(mockHomeData.contacts);
  });

  it('should memoize selectContactById correctly', () => {
    store.dispatch({
      type: 'home/setHomeData',
      payload: mockHomeData,
    });

    const { result, rerender } = renderHook(
      () => selectContactById(getState(), 'contact-1'),
      { wrapper },
    );

    const firstResult = result.current;

    // Rerender with same contactId
    rerender();
    const secondResult = result.current;

    // Should return same reference
    expect(firstResult).toBe(secondResult);
    expect(firstResult?.name).toBe('John Doe');
  });

  it('should memoize selectHolidayIdByRoute correctly', () => {
    store.dispatch({
      type: 'home/setHomeData',
      payload: mockHomeData,
    });

    const { result, rerender } = renderHook(
      () => selectHolidayIdByRoute(getState(), '/christmas'),
      { wrapper },
    );

    const firstResult = result.current;

    // Rerender with same route
    rerender();
    const secondResult = result.current;

    // Should return same reference
    expect(firstResult).toBe(secondResult);
    expect(firstResult).toBe('christmas-123');

    // Test with different route
    const { result: result2 } = renderHook(
      () => selectHolidayIdByRoute(getState(), '/hanukkah'),
      { wrapper },
    );

    expect(result2.current).toBe('hanukkah-456');
    expect(result2.current).not.toBe(firstResult);
  });

  it('should handle null/undefined inputs gracefully', () => {
    store.dispatch({
      type: 'home/setHomeData',
      payload: mockHomeData,
    });

    const { result } = renderHook(() => selectHolidayPrefById(getState(), null), {
      wrapper,
    });

    expect(result.current).toBeNull();

    const { result: result2 } = renderHook(
      () => selectHolidayPrefById(getState(), undefined),
      { wrapper },
    );

    expect(result2.current).toBeNull();
  });
});
