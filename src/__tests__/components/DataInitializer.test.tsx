/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import DataInitializer from '@/components/DataInitializer';

const dispatch = jest.fn();
let state: Record<string, any>;
let authValue: { user?: { sub: string } };

jest.mock('@/store/hooks', () => ({
  useAppDispatch: () => dispatch,
  useAppSelector: (select: (s: unknown) => unknown) => select(state),
}));
jest.mock('@auth0/auth0-react', () => ({ useAuth0: () => authValue }));
jest.mock('@/store/loadHome', () => ({
  loadHome: (user: { sub: string }) => ({ type: 'loadHome', sub: user.sub }),
}));
jest.mock('@/store/slices/cardsSlice', () => ({
  fetchCards: () => ({ type: 'fetchCards' }),
}));
jest.mock('@/store/slices/giftListSlice', () => ({
  fetchGifts: () => ({ type: 'fetchGifts' }),
}));
jest.mock('@/store/slices/tasksSlice', () => ({
  fetchTasks: () => ({ type: 'fetchTasks' }),
}));
jest.mock('@/store/slices/addressBookSlice', () => ({
  fetchContacts: () => ({ type: 'fetchContacts' }),
}));
jest.mock('@/store/slices/sharesSlice', () => ({
  fetchShares: (sub: string) => ({ type: 'fetchShares', sub }),
}));
jest.mock('@/store/slices/invitesSlice', () => ({
  fetchInboxInvites: (sub: string) => ({ type: 'fetchInboxInvites', sub }),
  fetchOutgoingInvites: (sub: string) => ({ type: 'fetchOutgoingInvites', sub }),
}));

const fresh = () => ({
  cards: { initialized: false },
  giftList: { initialized: false },
  tasks: { initialized: false },
  addressBook: { initialized: false },
  shares: { initialized: false },
  invites: { initialized: false, loading: false },
  home: { data: null, initialized: false },
});
const types = () => dispatch.mock.calls.map(c => c[0].type);

beforeEach(() => {
  dispatch.mockClear();
  state = fresh();
  authValue = { user: { sub: 'auth0|me' } };
});

describe('DataInitializer', () => {
  it('renders nothing', () => {
    const { container } = render(<DataInitializer />);
    expect(container).toBeEmptyDOMElement();
  });

  it('fetches everything once for a signed-in user', () => {
    render(<DataInitializer />);
    expect(types().sort()).toEqual(
      [
        'fetchCards',
        'fetchContacts',
        'fetchGifts',
        'fetchInboxInvites',
        'fetchOutgoingInvites',
        'fetchShares',
        'fetchTasks',
        'loadHome',
      ].sort(),
    );
    expect(dispatch).toHaveBeenCalledWith({ type: 'fetchShares', sub: 'auth0|me' });
  });

  it('loads the home data for the signed-in user, so any page can be opened directly', () => {
    render(<DataInitializer />);
    expect(dispatch).toHaveBeenCalledWith({ type: 'loadHome', sub: 'auth0|me' });
  });

  it('does not load the home data again once it is there', () => {
    state.home.initialized = true;
    render(<DataInitializer />);
    expect(types()).not.toContain('loadHome');
  });

  it('leaves out shares and invites without a user', () => {
    authValue = {};
    render(<DataInitializer />);
    expect(types()).not.toContain('loadHome');
    expect(types().sort()).toEqual([
      'fetchCards',
      'fetchContacts',
      'fetchGifts',
      'fetchTasks',
    ]);
  });

  it('skips anything already initialised', () => {
    state.cards.initialized = true;
    state.giftList.initialized = true;
    state.tasks.initialized = true;
    state.shares.initialized = true;
    state.invites.initialized = true;
    state.addressBook.initialized = true;
    state.home.initialized = true;
    render(<DataInitializer />);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not fetch contacts the home data already has', () => {
    state.home.data = { contacts: [{ id: 'c1' }] };
    render(<DataInitializer />);
    expect(types()).not.toContain('fetchContacts');
  });

  it('waits for an in-flight invite request before asking for invites', () => {
    state.invites.loading = true;
    render(<DataInitializer />);
    expect(types()).not.toContain('fetchInboxInvites');
    expect(types()).not.toContain('fetchOutgoingInvites');
    expect(types()).toContain('fetchShares');
  });

  it('does not retry a failed fetch when unrelated state changes', () => {
    const { rerender } = render(<DataInitializer />);
    const first = dispatch.mock.calls.length;
    state = { ...fresh(), invites: { initialized: false, loading: true } };
    rerender(<DataInitializer />);
    state = { ...fresh(), invites: { initialized: false, loading: false } };
    rerender(<DataInitializer />);
    expect(dispatch.mock.calls.length).toBe(first);
  });

  it('starts over for a different user', () => {
    const { rerender } = render(<DataInitializer />);
    dispatch.mockClear();
    authValue = { user: { sub: 'auth0|other' } };
    state = { ...fresh(), invites: { initialized: false, loading: true } };
    rerender(<DataInitializer />);
    state = fresh();
    rerender(<DataInitializer />);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'fetchShares',
      sub: 'auth0|other',
    });
  });
});
