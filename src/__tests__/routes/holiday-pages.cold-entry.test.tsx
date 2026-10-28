import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { clearHomeData } from '@/store/slices/homeSlice';
import ChristmasPage from '@/app/christmas/page';

const mockUseAuth0 = jest.fn();
jest.mock('@auth0/auth0-react', () => ({ useAuth0: () => mockUseAuth0() }));

const mockFetch = jest.fn();

const signedIn = {
  user: { sub: 'auth0|123', email: 'test@example.com', name: 'Test User' },
  isAuthenticated: true,
  isLoading: false,
};
const signedOut = { user: null, isAuthenticated: false, isLoading: false };

const renderPage = () =>
  render(
    <Provider store={store}>
      <ChristmasPage />
    </Provider>,
  );

const requestedUrls = () => mockFetch.mock.calls.map(c => String(c[0]));
const dataRequests = () =>
  requestedUrls().filter(u => !u.startsWith('/api/users/by-auth0-sub'));

describe('Holiday pages - cold entry (no home data in Redux)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    store.dispatch(clearHomeData());
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = mockFetch as unknown as typeof fetch;
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('still renders the page with its three sections, empty', async () => {
    mockUseAuth0.mockReturnValue(signedIn);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Make this Christmas magical!')).toBeInTheDocument();
    });
    expect(screen.getByText('Gift List')).toBeInTheDocument();
    expect(screen.getByText('Cards')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getAllByText('0/0 items')).toHaveLength(3);
  });

  it('does not fetch gifts, cards or tasks itself (home data is loaded elsewhere)', async () => {
    mockUseAuth0.mockReturnValue(signedIn);
    renderPage();

    await waitFor(() => expect(requestedUrls().length).toBeGreaterThan(0));
    expect(dataRequests()).toEqual([]);
  });

  it('looks up the signed-in user by Auth0 sub exactly once', async () => {
    mockUseAuth0.mockReturnValue(signedIn);
    renderPage();

    await waitFor(() => expect(requestedUrls().length).toBeGreaterThan(0));
    expect(requestedUrls()).toEqual(['/api/users/by-auth0-sub?sub=auth0%7C123']);
  });

  it('makes no network requests at all when signed out', async () => {
    mockUseAuth0.mockReturnValue(signedOut);
    renderPage();

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
