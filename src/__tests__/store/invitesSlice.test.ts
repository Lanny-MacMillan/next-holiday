import { configureStore } from '@reduxjs/toolkit';
import invitesReducer, {
  acceptInvite,
  createInvite,
  declineInvite,
  fetchInboxInvites,
  fetchOutgoingInvites,
  selectOutgoingInvites,
  selectPendingInvites,
  type Invite,
} from '@/store/slices/invitesSlice';

const mockFetch = jest.fn();
const makeStore = (invites: Invite[] = []) =>
  configureStore({
    reducer: { invites: invitesReducer },
    preloadedState: {
      invites: { invites, loading: false, error: null, initialized: false },
    },
  });

const invite = (over: Partial<Invite> = {}): Invite => ({
  id: 'i1',
  shareId: 's1',
  fromUserId: 'owner',
  toUserId: 'me',
  holidayKey: 'christmas',
  status: 'pending',
  createdAt: '2024-01-01T00:00:00Z',
  ...over,
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
});

describe.each([
  [
    'inbox',
    fetchInboxInvites,
    '/api/invites?inbox=1&userId=u1',
    'Failed to fetch inbox invites',
  ],
  [
    'outgoing',
    fetchOutgoingInvites,
    '/api/invites?outgoing=1&userId=u1',
    'Failed to fetch outgoing invites',
  ],
] as const)('fetching %s invites', (_, thunk, url, failure) => {
  it('requests the right list', async () => {
    mockFetch.mockResolvedValue(reply([]));
    await makeStore().dispatch(thunk('u1'));
    expect(lastCall()[0]).toBe(url);
  });

  it('adds the invites it has not seen and marks the slice initialized', async () => {
    mockFetch.mockResolvedValue(reply([invite({ id: 'i1' }), invite({ id: 'i2' })]));
    const store = makeStore([invite({ id: 'i1', status: 'accepted' })]);
    await store.dispatch(thunk('u1'));

    const state = store.getState().invites;
    expect(state.invites.map(i => i.id)).toEqual(['i1', 'i2']);
    expect(state.invites[0].status).toBe('accepted');
    expect(state).toMatchObject({ initialized: true, loading: false });
  });

  it('is loading while the request runs', async () => {
    let release!: (v: unknown) => void;
    mockFetch.mockReturnValue(new Promise(resolve => (release = resolve)));
    const store = makeStore();
    const pending = store.dispatch(thunk('u1'));
    expect(store.getState().invites.loading).toBe(true);
    release(reply([]));
    await pending;
    expect(store.getState().invites.loading).toBe(false);
  });

  it('records the error when the request fails', async () => {
    mockFetch.mockResolvedValue(reply({}, false));
    const store = makeStore();
    await store.dispatch(thunk('u1'));
    expect(store.getState().invites).toMatchObject({
      error: failure,
      loading: false,
    });
  });
});

describe('createInvite', () => {
  const data = {
    shareId: 's1',
    fromUserId: 'owner',
    toEmail: 'a@x.com',
    holidayKey: 'christmas',
  } as never;

  it('posts the invite and adds the response to the list', async () => {
    mockFetch.mockResolvedValue(reply(invite({ id: 'new' })));
    const store = makeStore();
    await store.dispatch(createInvite(data));

    const [url, init] = lastCall();
    expect(url).toBe('/api/invites');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual(data);
    expect(store.getState().invites.invites.map(i => i.id)).toEqual(['new']);
  });

  it("surfaces the server's error message", async () => {
    mockFetch.mockResolvedValue(
      reply({ error: 'You cannot invite yourself' }, false),
    );
    const store = makeStore();
    await store.dispatch(createInvite(data));
    expect(store.getState().invites.error).toBe('You cannot invite yourself');
  });

  it('falls back to the message field, then to a status message', async () => {
    mockFetch.mockResolvedValueOnce(reply({ message: 'Nope' }, false));
    const a = makeStore();
    await a.dispatch(createInvite(data));
    expect(a.getState().invites.error).toBe('Nope');

    mockFetch.mockResolvedValueOnce(reply({}, false));
    const b = makeStore();
    await b.dispatch(createInvite(data));
    expect(b.getState().invites.error).toBe('Failed to create invite (500)');
  });

  it('uses the status text when the error body is not JSON', async () => {
    mockFetch.mockResolvedValue(
      reply(null, false, {
        json: async () => {
          throw new Error('not json');
        },
      }),
    );
    const store = makeStore();
    await store.dispatch(createInvite(data));
    expect(store.getState().invites.error).toBe('Server Error');
  });
});

describe.each([
  ['acceptInvite', acceptInvite, 'accept', 'Failed to accept invite'],
  ['declineInvite', declineInvite, 'decline', 'Failed to decline invite'],
] as const)('%s', (_, thunk, action, failure) => {
  const user = {
    sub: 'auth0|me',
    email: 'me@x.com',
    name: 'Me',
    picture: 'ignored',
  };

  it('posts to the invite and identifies the user', async () => {
    mockFetch.mockResolvedValue(reply({ invite: invite(), id: 'i1' }));
    await makeStore([invite()]).dispatch(thunk({ inviteId: 'i1', auth0User: user }));

    const [url, init] = lastCall();
    expect(url).toBe(`/api/invites/i1/${action}`);
    expect(init?.method).toBe('POST');
    const headers = init?.headers as Record<string, string>;
    expect(JSON.parse(headers['x-test-user'])).toEqual({
      sub: 'auth0|me',
      email: 'me@x.com',
      name: 'Me',
    });
  });

  it('omits the user header when there is no user', async () => {
    mockFetch.mockResolvedValue(reply({ invite: invite(), id: 'i1' }));
    await makeStore([invite()]).dispatch(thunk({ inviteId: 'i1' }));
    expect(
      (lastCall()[1]?.headers as Record<string, string>)['x-test-user'],
    ).toBeUndefined();
  });

  it('records the error when it fails', async () => {
    mockFetch.mockResolvedValue(reply({}, false));
    const store = makeStore([invite()]);
    await store.dispatch(thunk({ inviteId: 'i1' }));
    expect(store.getState().invites).toMatchObject({
      error: failure,
      loading: false,
    });
  });
});

describe('what the server sends back replaces the invite in the list', () => {
  it('accept uses the invite inside the response', async () => {
    mockFetch.mockResolvedValue(reply({ invite: invite({ status: 'accepted' }) }));
    const store = makeStore([invite(), invite({ id: 'other' })]);
    await store.dispatch(acceptInvite({ inviteId: 'i1' }));
    expect(store.getState().invites.invites.map(i => i.status)).toEqual([
      'accepted',
      'pending',
    ]);
  });

  it('decline uses the response itself', async () => {
    mockFetch.mockResolvedValue(reply(invite({ status: 'declined' })));
    const store = makeStore([invite()]);
    await store.dispatch(declineInvite({ inviteId: 'i1' }));
    expect(store.getState().invites.invites[0].status).toBe('declined');
  });

  it('leaves the list alone when the invite is not in it', async () => {
    mockFetch.mockResolvedValue(reply(invite({ id: 'ghost', status: 'declined' })));
    const store = makeStore([invite()]);
    await store.dispatch(declineInvite({ inviteId: 'ghost' }));
    expect(store.getState().invites.invites).toEqual([invite()]);
  });
});

describe('selectPendingInvites', () => {
  const state = (invites: Invite[]) => ({ invites: { invites } });
  const list = [
    invite({ id: 'a', toUserId: 'me' }),
    invite({ id: 'b', toUserId: undefined, toEmail: 'me@x.com' }),
    invite({ id: 'c', toUserId: 'someone-else' }),
    invite({ id: 'd', toUserId: 'me', status: 'accepted' }),
    invite({ id: 'e', toUserId: undefined, toEmail: 'me' }),
  ];

  it('finds pending invites addressed to the user id', () => {
    expect(selectPendingInvites(state(list), 'me').map((i: Invite) => i.id)).toEqual(
      ['a', 'e'],
    );
  });

  it('also matches by email when one is given', () => {
    expect(
      selectPendingInvites(state(list), 'me', 'me@x.com').map((i: Invite) => i.id),
    ).toEqual(['a', 'b', 'e']);
  });

  it('never returns invites that are no longer pending', () => {
    expect(
      selectPendingInvites(state(list), 'me').some((i: Invite) => i.id === 'd'),
    ).toBe(false);
  });
});

describe('selectOutgoingInvites', () => {
  it('returns the invites the user sent, whatever their status', () => {
    const list = [
      invite({ id: 'a' }),
      invite({ id: 'b', fromUserId: 'x' }),
      invite({ id: 'c', status: 'declined' }),
    ];
    expect(
      selectOutgoingInvites({ invites: { invites: list } }, 'owner').map(
        (i: Invite) => i.id,
      ),
    ).toEqual(['a', 'c']);
  });
});
