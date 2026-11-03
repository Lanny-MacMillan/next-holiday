/**
 * @jest-environment jsdom
 */
import 'whatwg-fetch';
import { configureStore } from '@reduxjs/toolkit';
import { waitFor } from '@testing-library/react';
import { api } from '@/store/api';
import homeReducer from '@/store/slices/homeSlice';

type Endpoint = {
  initiate: (arg: unknown) => unknown;
  select: (
    arg: unknown,
  ) => (state: unknown) => { data?: Array<Record<string, unknown>> };
};
const endpoints = api.endpoints as unknown as Record<string, Endpoint>;

const makeStore = () =>
  configureStore({
    reducer: { [api.reducerPath]: api.reducer, home: homeReducer },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(api.middleware),
  });

const reply = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

// The task-backed lists share one endpoint and are told apart by category.
const taskLists: Array<[string, string, string]> = [
  ['getDecorations', 'deleteDecoration', 'Decorations'],
  ['getEvents', 'deleteEvent', 'Events'],
  ['getCandleLighting', 'deleteCandleLighting', 'Candle Lighting'],
  ['getDateIdeas', 'deleteDateIdeas', 'Date Ideas'],
  ['getResolutions', 'deleteResolutions', 'Resolutions'],
  ['getReservations', 'deleteReservations', 'Reservations'],
  ['getCostumeIdeas', 'deleteCostumeIdeas', 'Costume Ideas'],
  ['getTrickOrTreatPrep', 'deleteTrickOrTreatPrep', 'Trick or Treat Prep'],
  ['getMealPlanning', 'deleteMealPlanning', 'Meal Planning'],
  ['getPartyPlanning', 'deletePartyPlanning', 'Party Planning'],
  ['getBabyShowerGames', 'deleteBabyShowerGames', 'Games'],
  ['getKwanzaaPrinciples', 'deleteKwanzaaPrinciples', 'Daily Principles'],
];

let store: ReturnType<typeof makeStore>;

async function seed(getName: string, rows: Array<Record<string, unknown>>) {
  jest.spyOn(global, 'fetch').mockImplementation(async input => {
    const method = (input as Request).method;
    return reply(
      method === 'GET' ? { success: true, data: rows } : { success: true },
    );
  });
  await store.dispatch(endpoints[getName].initiate({ holidayId: 'h1' }) as never);
}

// A request that never settles keeps the optimistic state in place, with no rollback
// or refetch to undo it before the assertion runs.
const holdRequests = () =>
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {}));

const cachedIds = (getName: string) =>
  endpoints[getName]
    .select({ holidayId: 'h1' })(store.getState())
    .data?.map(row => row.id);

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  store = makeStore();
});
afterEach(() => jest.restoreAllMocks());

describe('deleting from a list removes the row from the cache straight away', () => {
  it.each(taskLists)('%s / %s', async (getName, deleteName, category) => {
    await seed(getName, [
      { id: 'a', category },
      { id: 'b', category },
      { id: 'other', category: 'Something else' },
    ]);
    expect(cachedIds(getName)).toEqual(['a', 'b']);

    holdRequests();
    store.dispatch(
      endpoints[deleteName].initiate({ holidayId: 'h1', taskId: 'a' }) as never,
    );
    await waitFor(() => expect(cachedIds(getName)).toEqual(['b']));
  });

  it('deleteCard', async () => {
    await seed('getCards', [{ id: 'a' }, { id: 'b' }]);
    holdRequests();
    store.dispatch(
      endpoints.deleteCard.initiate({ holidayId: 'h1', cardId: 'a' }) as never,
    );
    await waitFor(() => expect(cachedIds('getCards')).toEqual(['b']));
  });

  it('cardOperation with action delete', async () => {
    await seed('getCards', [{ id: 'a' }, { id: 'b' }]);
    holdRequests();
    store.dispatch(
      endpoints.cardOperation.initiate({
        holidayId: 'h1',
        payload: { action: 'delete', id: 'a' },
      }) as never,
    );
    await waitFor(() => expect(cachedIds('getCards')).toEqual(['b']));
  });

  it('deleteGuest', async () => {
    await seed('getGuestList', [{ id: 'a' }, { id: 'b' }]);
    holdRequests();
    store.dispatch(
      endpoints.deleteGuest.initiate({ holidayId: 'h1', guestId: 'a' }) as never,
    );
    await waitFor(() => expect(cachedIds('getGuestList')).toEqual(['b']));
  });
});

describe('guest edits update the cache straight away', () => {
  const guestRow = (id: string) =>
    endpoints.getGuestList
      .select({ holidayId: 'h1' })(store.getState())
      .data?.find(row => row.id === id);

  it('editGuest merges the changes into the cached guest', async () => {
    await seed('getGuestList', [{ id: 'a', name: 'Old' }]);
    holdRequests();
    store.dispatch(
      endpoints.editGuest.initiate({
        holidayId: 'h1',
        guestId: 'a',
        payload: { name: 'New' },
      }) as never,
    );
    await waitFor(() => expect(guestRow('a')?.name).toBe('New'));
  });

  it('updateGuest marks the cached guest completed and confirmed', async () => {
    await seed('getGuestList', [{ id: 'a', isCompleted: false }]);
    holdRequests();
    store.dispatch(
      endpoints.updateGuest.initiate({
        holidayId: 'h1',
        guestId: 'a',
        isCompleted: true,
      }) as never,
    );
    await waitFor(() =>
      expect(guestRow('a')).toMatchObject({
        isCompleted: true,
        rsvpStatus: 'confirmed',
      }),
    );
  });
});
