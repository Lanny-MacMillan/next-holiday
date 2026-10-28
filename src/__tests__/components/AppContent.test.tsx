/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { updateSettings } from '@/store/slices/themeSlice';
import { getCurrentUserPreferences } from '@/store/slices/userPreferencesSlice';
import AppContent from '@/components/AppContent';

let authValue: {
  isAuthenticated: boolean;
  isLoading: boolean;
  user?: { sub: string };
};
jest.mock('@auth0/auth0-react', () => ({ useAuth0: () => authValue }));
jest.mock('@/hooks/usePerformanceTracking', () => ({
  usePerformanceTracking: jest.fn(),
}));
jest.mock('@/components/common/Header', () => ({
  __esModule: true,
  default: () => <div>header</div>,
}));
jest.mock('@/components/auth/Login', () => ({
  __esModule: true,
  default: () => <div>login-page</div>,
}));
jest.mock('@/components/DataInitializer', () => ({
  __esModule: true,
  default: () => <div>data-init</div>,
}));
jest.mock('@/components/auth/AuthWrapper', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
jest.mock('@/components/common/PerformanceDashboard', () => ({
  __esModule: true,
  default: ({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) =>
    isVisible ? <button onClick={onClose}>close-dashboard</button> : null,
}));

const mockFetch = jest.fn();
const mount = () =>
  render(
    <Provider store={store}>
      <AppContent>
        <p>page body</p>
      </AppContent>
    </Provider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  authValue = { isAuthenticated: true, isLoading: false, user: { sub: 'auth0|me' } };
  global.fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      data: { theme: 'dark', displayMode: 'gamified' },
    }),
  });
  document.documentElement.className = '';
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('AppContent', () => {
  // First on purpose: the store is shared, and preferences only load once.
  it('loads the signed-in users preferences', async () => {
    mount();
    await act(async () => {});
    expect(
      mockFetch.mock.calls.some(c =>
        String(c[0]).includes('/api/users/me/preferences'),
      ),
    ).toBe(true);
  });

  it('shows a loading state while Auth0 decides', () => {
    authValue = { isAuthenticated: false, isLoading: true };
    mount();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('login-page')).not.toBeInTheDocument();
  });

  it('shows the login page to a visitor', () => {
    authValue = { isAuthenticated: false, isLoading: false };
    mount();
    expect(screen.getByText('login-page')).toBeInTheDocument();
    expect(screen.queryByText('page body')).not.toBeInTheDocument();
  });

  it('shows the header and the page for a signed-in user', () => {
    mount();
    expect(screen.getByText('header')).toBeInTheDocument();
    expect(screen.getByText('data-init')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('page body');
  });

  it('does not ask for preferences when signed out', async () => {
    authValue = { isAuthenticated: false, isLoading: false };
    mount();
    await act(async () => {});
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('applies the saved dark theme and gamified mode to the page', async () => {
    act(() => {
      store.dispatch(
        getCurrentUserPreferences.fulfilled(
          { theme: 'dark', displayMode: 'gamified' } as never,
          '',
          'auth0|me',
        ),
      );
    });
    mount();
    await act(async () => {});
    await act(async () => {});
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('gamified-mode')).toBe(true);
  });

  it('removes them again when the preferences say light and professional', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { theme: 'light', displayMode: 'professional' },
      }),
    });
    document.documentElement.classList.add('dark', 'gamified-mode');
    act(() => {
      store.dispatch(
        updateSettings({ theme: 'light', displayMode: 'professional' }),
      );
      store.dispatch(
        getCurrentUserPreferences.fulfilled(
          { theme: 'light', displayMode: 'professional' } as never,
          '',
          'auth0|me',
        ),
      );
    });
    mount();
    await act(async () => {});
    await act(async () => {});
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('gamified-mode')).toBe(false);
  });

  describe('the performance dashboard button (localhost only)', () => {
    it('opens and closes the dashboard', () => {
      mount();
      fireEvent.click(screen.getByTitle('Open Performance Dashboard'));
      fireEvent.click(screen.getByText('close-dashboard'));
      expect(screen.queryByText('close-dashboard')).not.toBeInTheDocument();
    });
  });
});
