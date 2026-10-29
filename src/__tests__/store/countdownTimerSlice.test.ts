import { configureStore } from '@reduxjs/toolkit';
import countdownTimerReducer, {
  clearCountdownTimer,
  updateCountdownTimer,
} from '@/store/slices/countdownTimerSlice';

const mockFetch = jest.fn();
const makeStore = () =>
  configureStore({ reducer: { countdownTimer: countdownTimerReducer } });
const reply = (body: unknown, ok = true) => ({ ok, json: async () => body });
const user = { sub: 'auth0|me', email: 'me@x.com', name: 'Me', picture: 'nope' };

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

describe.each([
  [
    'update',
    (a?: object) =>
      updateCountdownTimer({
        holidayId: 'h1',
        countdownTimer: '2030-01-01T00:00:00Z',
        ...a,
      }),
    'PUT',
    'Failed to update countdown timer',
  ],
  [
    'clear',
    (a?: object) => clearCountdownTimer({ holidayId: 'h1', ...a }),
    'DELETE',
    'Failed to clear countdown timer',
  ],
] as const)('%s', (_, make, method, failure) => {
  it('calls the holiday countdown endpoint', async () => {
    mockFetch.mockResolvedValue(reply({ data: {} }));
    await makeStore().dispatch(make());
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/holidays/h1/countdown');
    expect(init.method).toBe(method);
  });

  it('marks the holiday as updating until the request ends', async () => {
    let release!: (v: unknown) => void;
    mockFetch.mockReturnValue(new Promise(resolve => (release = resolve)));
    const store = makeStore();
    const pending = store.dispatch(make());
    expect(store.getState().countdownTimer).toMatchObject({
      loading: true,
      updatingHolidayId: 'h1',
    });
    release(reply({ data: {} }));
    await pending;
    expect(store.getState().countdownTimer).toEqual({
      loading: false,
      error: null,
      updatingHolidayId: null,
    });
  });

  it('sends the test-user header only when given a user, without extra fields', async () => {
    mockFetch.mockResolvedValue(reply({ data: {} }));
    await makeStore().dispatch(make({ auth0User: user }));
    expect(JSON.parse(mockFetch.mock.calls[0][1].headers['x-test-user'])).toEqual({
      sub: 'auth0|me',
      email: 'me@x.com',
      name: 'Me',
    });
    await makeStore().dispatch(make());
    expect(mockFetch.mock.calls[1][1].headers['x-test-user']).toBeUndefined();
  });

  it("records the server's error and stops loading", async () => {
    mockFetch.mockResolvedValue(reply({ error: 'Holiday not found' }, false));
    const store = makeStore();
    await store.dispatch(make());
    expect(store.getState().countdownTimer).toEqual({
      loading: false,
      error: 'Holiday not found',
      updatingHolidayId: null,
    });
  });

  it('falls back to a generic message', async () => {
    mockFetch.mockResolvedValue(reply({}, false));
    const store = makeStore();
    await store.dispatch(make());
    expect(store.getState().countdownTimer.error).toBe(failure);
  });
});

it('update sends the timer in the body, including null', async () => {
  mockFetch.mockResolvedValue(reply({ data: {} }));
  await makeStore().dispatch(
    updateCountdownTimer({ holidayId: 'h1', countdownTimer: null }),
  );
  expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({
    countdownTimer: null,
  });
});

it('a new request clears the previous error', async () => {
  const store = makeStore();
  mockFetch.mockResolvedValueOnce(reply({}, false));
  await store.dispatch(clearCountdownTimer({ holidayId: 'h1' }));
  expect(store.getState().countdownTimer.error).not.toBeNull();
  mockFetch.mockResolvedValueOnce(reply({ data: {} }));
  await store.dispatch(clearCountdownTimer({ holidayId: 'h1' }));
  expect(store.getState().countdownTimer.error).toBeNull();
});
