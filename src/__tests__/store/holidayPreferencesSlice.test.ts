import { configureStore } from '@reduxjs/toolkit';
import holidayPreferencesReducer, {
  saveHolidayPreferences,
} from '@/store/slices/holidayPreferencesSlice';

const mockFetch = jest.fn();
const makeStore = () =>
  configureStore({ reducer: { holidayPreferences: holidayPreferencesReducer } });
const request = {
  accountId: 'a1',
  preferences: [{ holiday: 'christmas', budget: 100 }],
};
const reply = (
  body: unknown,
  ok = true,
  status = ok ? 200 : 500,
  statusText = 'Server Error',
) => ({
  ok,
  status,
  statusText,
  json: async () => body,
});
const save = (extra: object = {}) => {
  const store = makeStore();
  return store
    .dispatch(saveHolidayPreferences({ ...request, ...extra }))
    .then(() => store.getState().holidayPreferences);
};

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('saveHolidayPreferences', () => {
  const saved = [
    {
      holiday: {
        id: 'h1',
        holidayType: 'christmas',
        countdownTimer: '2030-12-25T00:00:00Z',
      },
      budget: { totalBudget: '250.50' },
    },
    { holiday: { id: 'h2', holidayType: 'easter' } },
  ];

  it('posts the account and preferences', async () => {
    mockFetch.mockResolvedValue(reply({ data: [] }));
    await save();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/holidays/preferences');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(request);
  });

  it('includes the test-user header only when given a user', async () => {
    mockFetch.mockResolvedValue(reply({ data: [] }));
    await save({ auth0User: { sub: 's', email: 'e', name: 'n', picture: 'x' } });
    expect(JSON.parse(mockFetch.mock.calls[0][1].headers['x-test-user'])).toEqual({
      sub: 's',
      email: 'e',
      name: 'n',
    });
    await save();
    expect(mockFetch.mock.calls[1][1].headers['x-test-user']).toBeUndefined();
  });

  it('keeps what was saved and rebuilds the preferences from it', async () => {
    mockFetch.mockResolvedValue(reply({ data: saved }));
    const state = await save();
    expect(state.lastSaved).toEqual(saved);
    expect(state.preferences).toEqual([
      {
        holiday: 'christmas',
        holidayId: 'h1',
        budget: 250.5,
        countdownTimer: '2030-12-25T00:00:00Z',
      },
      {
        holiday: 'easter',
        holidayId: 'h2',
        budget: undefined,
        countdownTimer: undefined,
      },
    ]);
    expect(state).toMatchObject({ loading: false, error: null });
  });

  it('is loading while the request runs', async () => {
    let release!: (v: unknown) => void;
    mockFetch.mockReturnValue(new Promise(resolve => (release = resolve)));
    const store = makeStore();
    const pending = store.dispatch(saveHolidayPreferences(request));
    expect(store.getState().holidayPreferences.loading).toBe(true);
    release(reply({ data: [] }));
    await pending;
  });

  describe('errors', () => {
    it("uses the server's message", async () => {
      mockFetch.mockResolvedValue(
        reply({ error: 'Budget must be positive' }, false, 400),
      );
      expect((await save()).error).toBe('Budget must be positive');
    });

    it('uses the message field if there is no error field', async () => {
      mockFetch.mockResolvedValue(reply({ message: 'Bad thing' }, false, 400));
      expect((await save()).error).toBe('Bad thing');
    });

    it('uses a generic message for an empty body', async () => {
      mockFetch.mockResolvedValue(reply({}, false, 400));
      expect((await save()).error).toBe('Failed to save holiday preferences');
    });

    it('asks the user to refresh on a 401', async () => {
      mockFetch.mockResolvedValue(reply({ error: 'Unauthorized' }, false, 401));
      expect((await save()).error).toBe(
        'Authentication required. Please refresh the page and try again.',
      );
    });

    it('explains a 403', async () => {
      mockFetch.mockResolvedValue(reply({ error: 'Forbidden' }, false, 403));
      expect((await save()).error).toBe(
        'You do not have permission to perform this action.',
      );
    });

    it('translates a 500 transaction failure', async () => {
      mockFetch.mockResolvedValue(
        reply({ error: 'Transaction API error' }, false, 500),
      );
      expect((await save()).error).toBe(
        'Database error. Please try again in a moment.',
      );
    });

    it('passes other 500s through', async () => {
      mockFetch.mockResolvedValue(reply({ error: 'Kaboom' }, false, 500));
      expect((await save()).error).toBe('Kaboom');
    });

    it('describes the HTTP status when the body is not JSON', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: async () => {
          throw new Error('not json');
        },
      });
      expect((await save()).error).toBe('HTTP 502: Bad Gateway');
    });
  });
});
