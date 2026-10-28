/**
 * @jest-environment jsdom
 */
import 'whatwg-fetch';
import { configureStore } from '@reduxjs/toolkit';
import { waitFor } from '@testing-library/react';
import { api } from '@/store/api';
import homeReducer, { setHomeData } from '@/store/slices/homeSlice';

const HOLIDAY_ID = 'christmas-123';
const auth0User = { sub: 'auth0|123', email: 'test@example.com', name: 'Test User' };

const gift1 = { id: '1', name: 'Gift 1', price: 50, isCompleted: false };
const gift2 = { id: '2', name: 'Gift 2', price: 75, isCompleted: true };
const newGift = { id: '3', name: 'New Gift', price: 100, isCompleted: false };

const makeStore = () =>
  configureStore({
    reducer: { [api.reducerPath]: api.reducer, home: homeReducer },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(api.middleware),
  });

let store: ReturnType<typeof makeStore>;
const homeGifts = () =>
  store
    .getState()
    .home.data?.holidayPreferences?.find(p => p.holidayId === HOLIDAY_ID)?.gifts;

// RTK's fetchBaseQuery calls fetch(request); respond with real Response objects
const respondWith = (body: unknown, status = 200) =>
  jest.spyOn(global, 'fetch').mockImplementation(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
  );

const lastRequest = () => {
  const call = (global.fetch as jest.Mock).mock.calls.at(-1)!;
  return call[0] as Request;
};

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  store = makeStore();
  store.dispatch(
    setHomeData({
      holidayPreferences: [
        {
          holiday: 'Christmas',
          holidayId: HOLIDAY_ID,
          budget: 500,
          gifts: [gift1, gift2],
        },
      ],
      contacts: [],
      user: null,
      account: null,
      needsUserSetup: false,
      needsHolidaySelection: false,
    } as never),
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('gift mutations keep the home slice in sync', () => {
  it('createGift POSTs the payload and appends the API gift to home data', async () => {
    respondWith({ success: true, data: { data: newGift } }, 201);

    await store
      .dispatch(
        api.endpoints.createGift.initiate({
          holidayId: HOLIDAY_ID,
          payload: { name: 'New Gift', price: 100 },
          auth0User,
        }),
      )
      .unwrap();

    const req = lastRequest();
    expect(req.method).toBe('POST');
    expect(new URL(req.url, 'http://localhost').pathname).toBe(
      `/api/holidays/${HOLIDAY_ID}/gifts`,
    );
    expect(await req.clone().json()).toEqual({ name: 'New Gift', price: 100 });

    await waitFor(() => expect(homeGifts()).toHaveLength(3));
    expect(homeGifts()).toContainEqual(newGift);
  });

  it('deleteGift sends DELETE with the gift id and removes it from home data', async () => {
    respondWith({ success: true, data: { success: true } });

    await store
      .dispatch(
        api.endpoints.deleteGift.initiate({
          holidayId: HOLIDAY_ID,
          giftId: '1',
          auth0User,
        }),
      )
      .unwrap();

    const req = lastRequest();
    expect(req.method).toBe('DELETE');
    expect(new URL(req.url, 'http://localhost').pathname).toBe(
      `/api/holidays/${HOLIDAY_ID}/gifts`,
    );
    expect(new URL(req.url, 'http://localhost').searchParams.get('giftId')).toBe(
      '1',
    );

    await waitFor(() => expect(homeGifts()).toHaveLength(1));
    expect(homeGifts()).not.toContainEqual(expect.objectContaining({ id: '1' }));
    expect(homeGifts()).toContainEqual(gift2);
  });

  it('updateGift (completion toggle) PUTs and merges the API gift into home data', async () => {
    respondWith({
      success: true,
      data: { data: { ...gift1, isCompleted: true, completedDate: '2024-12-01' } },
    });

    await store
      .dispatch(
        api.endpoints.updateGift.initiate({
          holidayId: HOLIDAY_ID,
          giftId: '1',
          isCompleted: true,
          auth0User,
        }),
      )
      .unwrap();

    const req = lastRequest();
    expect(req.method).toBe('PUT');
    expect(await req.clone().json()).toEqual({ giftId: '1', isCompleted: true });

    await waitFor(() => {
      const updated = homeGifts()?.find(g => g.id === '1');
      expect(updated?.isCompleted).toBe(true);
    });
    expect(homeGifts()).toHaveLength(2);
  });

  it('leaves home data untouched when a mutation fails', async () => {
    respondWith({ success: false, error: 'Failed to create gift' }, 500);

    await expect(
      store
        .dispatch(
          api.endpoints.createGift.initiate({
            holidayId: HOLIDAY_ID,
            payload: { name: 'New Gift' },
            auth0User,
          }),
        )
        .unwrap(),
    ).rejects.toBeDefined();

    expect(homeGifts()).toEqual([gift1, gift2]);
  });

  it('does not touch gifts in other holidays', async () => {
    store.dispatch(
      setHomeData({
        holidayPreferences: [
          { holiday: 'Christmas', holidayId: HOLIDAY_ID, gifts: [gift1] },
          { holiday: 'Hanukkah', holidayId: 'hanukkah-1', gifts: [gift2] },
        ],
      } as never),
    );
    respondWith({ success: true, data: { data: newGift } }, 201);

    await store
      .dispatch(
        api.endpoints.createGift.initiate({
          holidayId: HOLIDAY_ID,
          payload: { name: 'New Gift' },
          auth0User,
        }),
      )
      .unwrap();

    await waitFor(() => expect(homeGifts()).toHaveLength(2));
    const hanukkah = store
      .getState()
      .home.data?.holidayPreferences?.find(p => p.holidayId === 'hanukkah-1');
    expect(hanukkah?.gifts).toEqual([gift2]);
  });
});
