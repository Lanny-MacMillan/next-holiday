import { configureStore } from '@reduxjs/toolkit';
import sharesReducer, {
  addShare,
  createShare,
  fetchShares,
  leaveShare,
  refreshShares,
  removeMemberFromShare,
  selectIsHolidayShared,
  selectIsOwnerByHolidayKey,
  selectIsUserInShare,
  selectMembers,
  selectShareByHolidayKey,
  type HolidayShare,
} from '@/store/slices/sharesSlice';

const mockFetch = jest.fn();

const share = (over: Partial<HolidayShare> = {}): HolidayShare => ({
  shareId: 's1',
  holidayId: 'h1',
  holidayKey: 'christmas',
  ownerUserId: 'owner',
  memberUserIds: ['owner', 'me'],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  ...over,
});
const makeStore = (shares: HolidayShare[] = [], initialized = false) =>
  configureStore({
    reducer: { shares: sharesReducer },
    preloadedState: { shares: { shares, loading: false, error: null, initialized } },
  });
const reply = (body: unknown, ok = true, extra: Record<string, unknown> = {}) => ({
  ok,
  status: ok ? 200 : 500,
  statusText: 'Server Error',
  json: async () => body,
  ...extra,
});
const lastCall = () =>
  mockFetch.mock.calls.at(-1)! as [string, RequestInit | undefined];

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('fetchShares', () => {
  it("loads the user's shares once", async () => {
    mockFetch.mockResolvedValue(reply([share()]));
    const store = makeStore();
    await store.dispatch(fetchShares('u1'));

    expect(lastCall()[0]).toBe('/api/shares?userId=u1');
    expect(store.getState().shares).toMatchObject({
      initialized: true,
      loading: false,
    });
    expect(store.getState().shares.shares).toHaveLength(1);
  });

  it('does not ask again once initialized', async () => {
    const store = makeStore([share()], true);
    await store.dispatch(fetchShares('u1'));
    expect(mockFetch).not.toHaveBeenCalled();
    expect(store.getState().shares.shares).toHaveLength(1);
  });

  it('records an error when the request fails', async () => {
    mockFetch.mockResolvedValue(reply({}, false));
    const store = makeStore();
    await store.dispatch(fetchShares('u1'));
    expect(store.getState().shares.error).toBe('Failed to fetch shares');
  });
});

describe('refreshShares', () => {
  it('always asks, even when initialized', async () => {
    mockFetch.mockResolvedValue(reply([share({ shareId: 'fresh' })]));
    const store = makeStore([share()], true);
    await store.dispatch(refreshShares('u1'));
    expect(store.getState().shares.shares.map(s => s.shareId)).toEqual(['fresh']);
  });

  it('records an error when the request fails', async () => {
    mockFetch.mockResolvedValue(reply({}, false));
    const store = makeStore();
    await store.dispatch(refreshShares('u1'));
    expect(store.getState().shares.error).toBe('Failed to refresh shares');
  });
});

describe('createShare', () => {
  const data = {
    holidayId: 'h1',
    holidayKey: 'christmas',
    ownerUserId: 'owner',
    memberUserIds: ['owner'],
  };

  it('posts the share and adds the response', async () => {
    mockFetch.mockResolvedValue(reply(share({ shareId: 'new' })));
    const store = makeStore();
    await store.dispatch(createShare(data));

    const [url, init] = lastCall();
    expect(url).toBe('/api/shares');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual(data);
    expect(store.getState().shares.shares.map(s => s.shareId)).toEqual(['new']);
  });

  it('records an error when it fails, with the status text', async () => {
    mockFetch.mockResolvedValue(reply({ error: 'Holiday not found' }, false));
    const store = makeStore();
    await store.dispatch(createShare(data));
    expect(store.getState().shares.error).toBe('Server Error');
  });

  // KNOWN ISSUE: the server's message is thrown inside a try whose catch replaces it
  // with the status text, so the reason is always lost. Turn into a plain `it` once fixed.
  it.failing("surfaces the server's error message", async () => {
    mockFetch.mockResolvedValue(reply({ error: 'Holiday not found' }, false));
    const store = makeStore();
    await store.dispatch(createShare(data));
    expect(store.getState().shares.error).toBe('Holiday not found');
  });

  it('falls back to a status message when there is no status text', async () => {
    mockFetch.mockResolvedValue(reply({}, false, { statusText: '' }));
    const store = makeStore();
    await store.dispatch(createShare(data));
    expect(store.getState().shares.error).toBe('Failed to create share (500)');
  });
});

describe('removeMemberFromShare', () => {
  it('deletes the member (encoding their id) and swaps in the updated share', async () => {
    mockFetch.mockResolvedValue(reply(share({ memberUserIds: ['owner'] })));
    const store = makeStore([share(), share({ shareId: 's2' })]);
    await store.dispatch(
      removeMemberFromShare({ shareId: 's1', userId: 'auth0|me' }),
    );

    const [url, init] = lastCall();
    expect(url).toBe('/api/shares/s1/members?userId=auth0%7Cme');
    expect(init?.method).toBe('DELETE');
    expect(store.getState().shares.shares[0].memberUserIds).toEqual(['owner']);
    expect(store.getState().shares.shares).toHaveLength(2);
  });

  it("surfaces the server's message when it fails", async () => {
    mockFetch.mockResolvedValue(
      reply({ error: 'Cannot remove the share owner' }, false),
    );
    const store = makeStore([share()]);
    await store.dispatch(removeMemberFromShare({ shareId: 's1', userId: 'owner' }));
    expect(store.getState().shares.error).toBe('Cannot remove the share owner');
  });

  it('falls back to a generic message', async () => {
    mockFetch.mockResolvedValue(reply({}, false));
    const store = makeStore([share()]);
    await store.dispatch(removeMemberFromShare({ shareId: 's1', userId: 'me' }));
    expect(store.getState().shares.error).toBe('Failed to remove member from share');
  });
});

describe('leaveShare', () => {
  const leave = (store: ReturnType<typeof makeStore>) =>
    store.dispatch(
      leaveShare({ shareId: 's1', userId: 'me', holidayKey: 'christmas' }),
    );

  it('removes the share from the list once the user is no longer a member', async () => {
    mockFetch.mockResolvedValue(
      reply(share({ members: [{ userId: 'owner', uuid: 'u' }] })),
    );
    const store = makeStore([share(), share({ shareId: 's2' })]);
    const result = await leave(store);

    expect(lastCall()[0]).toBe('/api/shares/s1/members?userId=me');
    expect((result.payload as { userLeftShare: boolean }).userLeftShare).toBe(true);
    expect(store.getState().shares.shares.map(s => s.shareId)).toEqual(['s2']);
  });

  it('keeps the share, updated, if the user is somehow still a member', async () => {
    mockFetch.mockResolvedValue(
      reply(share({ members: [{ userId: 'me', uuid: 'u' }] })),
    );
    const store = makeStore([share()]);
    const result = await leave(store);

    expect((result.payload as { userLeftShare: boolean }).userLeftShare).toBe(false);
    expect(store.getState().shares.shares).toHaveLength(1);
  });

  it('reports leaving when the response lists no members at all', async () => {
    mockFetch.mockResolvedValue(reply(share()));
    const result = await leave(makeStore([share()]));
    expect((result.payload as { userLeftShare: boolean }).userLeftShare).toBe(true);
  });

  it('logs and changes nothing for a share it does not have', async () => {
    mockFetch.mockResolvedValue(reply(share({ members: [] })));
    const store = makeStore([share({ shareId: 'other' })]);
    await leave(store);
    expect(store.getState().shares.shares.map(s => s.shareId)).toEqual(['other']);
    expect(console.error).toHaveBeenCalled();
  });

  it('records the failure', async () => {
    mockFetch.mockResolvedValue(reply({ error: 'Not a member' }, false));
    const store = makeStore([share()]);
    await leave(store);
    expect(store.getState().shares.error).toBe('Not a member');
  });

  it('falls back to a generic message', async () => {
    mockFetch.mockResolvedValue(reply({}, false));
    const store = makeStore([share()]);
    await leave(store);
    expect(store.getState().shares.error).toBe('Failed to leave share');
  });
});

describe('addShare', () => {
  it('appends a share', () => {
    const next = sharesReducer(undefined, addShare(share()));
    expect(next.shares).toEqual([share()]);
  });
});

describe('selectors', () => {
  const state = (shares: HolidayShare[]) => ({ shares: { shares } });
  const shares = [
    share(),
    share({
      shareId: 's2',
      holidayKey: 'new-year',
      ownerUserId: 'me',
      memberUserIds: ['me'],
    }),
  ];

  it('selectShareByHolidayKey ignores case, hyphens, spaces and apostrophes', () => {
    expect(selectShareByHolidayKey(state(shares), 'New Year')?.shareId).toBe('s2');
    expect(selectShareByHolidayKey(state(shares), 'CHRISTMAS')?.shareId).toBe('s1');
    expect(selectShareByHolidayKey(state(shares), 'easter')).toBeUndefined();
  });

  it('selectShareByHolidayKey tolerates an empty or missing key and list', () => {
    expect(selectShareByHolidayKey(state(shares), '')).toBeUndefined();
    expect(
      selectShareByHolidayKey({ shares: { shares: undefined as never } }, 'x'),
    ).toBeUndefined();
  });

  it('selectMembers lists the member ids, or nothing', () => {
    expect(selectMembers(state(shares), 's1')).toEqual(['owner', 'me']);
    expect(selectMembers(state(shares), 'zzz')).toEqual([]);
  });

  it('selectIsHolidayShared', () => {
    expect(selectIsHolidayShared(state(shares), 'new year')).toBe(true);
    expect(selectIsHolidayShared(state(shares), 'easter')).toBe(false);
    expect(
      selectIsHolidayShared({ shares: { shares: undefined as never } }, 'x'),
    ).toBe(false);
  });

  it('selectIsUserInShare counts the owner and the members', () => {
    expect(selectIsUserInShare(state(shares), 's1', 'owner')).toBe(true);
    expect(selectIsUserInShare(state(shares), 's1', 'me')).toBe(true);
    expect(selectIsUserInShare(state(shares), 's1', 'stranger')).toBe(false);
    expect(selectIsUserInShare(state(shares), 'zzz', 'me')).toBe(false);
  });

  it('selectIsOwnerByHolidayKey is true for the owner, false for others, and true when not shared', () => {
    expect(selectIsOwnerByHolidayKey(state(shares), 'new-year', 'me')).toBe(true);
    expect(selectIsOwnerByHolidayKey(state(shares), 'christmas', 'me')).toBe(false);
    expect(selectIsOwnerByHolidayKey(state(shares), 'easter', 'me')).toBe(true);
  });
});
