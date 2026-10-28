import { configureStore } from '@reduxjs/toolkit';
import cardsReducer, { fetchCards } from '@/store/slices/cardsSlice';
import giftListReducer, { fetchGifts } from '@/store/slices/giftListSlice';
import tasksReducer, { fetchTasks } from '@/store/slices/tasksSlice';

// These three thunks resolve a canned list after a delay; DataInitializer is their only caller.
const cases = [
  ['cards', 'cards', cardsReducer, fetchCards],
  ['giftList', 'gifts', giftListReducer, fetchGifts],
  ['tasks', 'tasks', tasksReducer, fetchTasks],
] as const;

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe.each(cases)('%s', (key, list, reducer, thunk) => {
  const makeStore = (preloaded?: object) =>
    configureStore({
      reducer: { [key]: reducer } as never,
      preloadedState: preloaded as never,
    });
  const slice = (store: ReturnType<typeof makeStore>) =>
    (store.getState() as unknown as Record<string, Record<string, unknown>>)[key];

  it('loads the starting list once the delay has passed', async () => {
    const store = makeStore();
    const pending = store.dispatch(thunk());
    expect(slice(store).loading).toBe(true);

    await jest.advanceTimersByTimeAsync(1000);
    await pending;

    expect(slice(store)).toMatchObject({
      loading: false,
      initialized: true,
      error: null,
    });
    expect((slice(store)[list] as unknown[]).length).toBeGreaterThan(0);
  });

  it('keeps what it has, without waiting, once initialized', async () => {
    const mine = [{ id: 'mine' }];
    const store = makeStore({
      [key]: { ...slice(makeStore()), [list]: mine, initialized: true },
    });
    await store.dispatch(thunk());
    expect(slice(store)[list]).toEqual(mine);
  });
});
