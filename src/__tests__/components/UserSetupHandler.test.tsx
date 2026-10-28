/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import UserSetupHandler from '@/components/UserSetupHandler';

let authValue: {
  user?: { sub: string; email: string; name: string; picture: string };
  isAuthenticated: boolean;
};
jest.mock('@auth0/auth0-react', () => ({ useAuth0: () => authValue }));

const mockFetch = jest.fn();
const signedIn = {
  user: { sub: 'auth0|new', email: 'new@x.com', name: 'New User', picture: 'p.png' },
  isAuthenticated: true,
};
const reply = (body: unknown, ok = true) => ({
  ok,
  status: ok ? 200 : 500,
  json: async () => body,
});

const onSetupComplete = jest.fn();
const mount = (needsUserSetup = true) =>
  render(
    <UserSetupHandler
      needsUserSetup={needsUserSetup}
      onSetupComplete={onSetupComplete}
    />,
  );

beforeEach(() => {
  jest.clearAllMocks();
  authValue = signedIn;
  global.fetch = mockFetch as unknown as typeof fetch;
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('UserSetupHandler', () => {
  describe('when there is nothing to set up', () => {
    it('renders nothing and makes no request', () => {
      const { container } = mount(false);
      expect(container).toBeEmptyDOMElement();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('makes no request until the user is signed in', () => {
      authValue = { isAuthenticated: false };
      mount();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(screen.getByText('Preparing your account...')).toBeInTheDocument();
    });
  });

  describe('setting up a new user', () => {
    it("posts the signed-in user's profile to the setup endpoint, once", async () => {
      mockFetch.mockResolvedValue(reply({ data: { success: true } }));
      mount();

      await waitFor(() => expect(onSetupComplete).toHaveBeenCalledTimes(1));
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('/api/users/setup');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual({
        auth0User: {
          sub: 'auth0|new',
          email: 'new@x.com',
          name: 'New User',
          picture: 'p.png',
        },
      });
    });

    it('shows progress while the request is in flight', async () => {
      let release!: (v: unknown) => void;
      mockFetch.mockReturnValue(new Promise(resolve => (release = resolve)));
      mount();

      expect(
        await screen.findByText('Setting up your account...'),
      ).toBeInTheDocument();
      release(reply({ data: { success: true } }));
      await waitFor(() => expect(onSetupComplete).toHaveBeenCalled());
    });
  });

  describe('failures', () => {
    it('shows a generic error with Try Again when the server errors', async () => {
      mockFetch.mockResolvedValue(reply({ error: 'DB down' }, false));
      mount();

      expect(await screen.findByText('Setup Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to set up user')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
      expect(onSetupComplete).not.toHaveBeenCalled();
    });

    it('shows the failure the server reports when it answers but did not succeed', async () => {
      mockFetch.mockResolvedValue(
        reply({ data: { success: false, error: 'Account exists' } }),
      );
      mount();

      expect(await screen.findByText('Account exists')).toBeInTheDocument();
      expect(onSetupComplete).not.toHaveBeenCalled();
    });

    it('falls back to a generic message when it reports no reason', async () => {
      mockFetch.mockResolvedValue(reply({ data: { success: false } }));
      mount();
      expect(await screen.findByText('Failed to set up user')).toBeInTheDocument();
    });

    it('shows an error when the network fails', async () => {
      mockFetch.mockRejectedValue(new Error('offline'));
      mount();
      expect(await screen.findByText('Setup Error')).toBeInTheDocument();
      expect(onSetupComplete).not.toHaveBeenCalled();
    });
  });
});
