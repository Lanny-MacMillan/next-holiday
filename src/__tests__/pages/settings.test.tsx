/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { clearHomeData, setHomeData } from '@/store/slices/homeSlice';
import SettingsPage from '@/app/settings/page';

const authValue = {
  user: {
    sub: 'auth0|me',
    email: 'me@x.com',
    name: 'Ada Lovelace',
    picture: undefined,
  },
  isAuthenticated: true,
  isLoading: false,
  logout: jest.fn(),
};
jest.mock('@auth0/auth0-react', () => ({ useAuth0: () => authValue }));

const mockFetch = jest.fn();
const reply = (body: unknown, ok = true) => ({
  ok,
  status: ok ? 200 : 500,
  json: async () => body,
  text: async () => 'server said no',
});
const calls = (method: string, url: string) =>
  mockFetch.mock.calls.filter(
    c => c[0] === url && ((c[1] as { method?: string })?.method ?? 'GET') === method,
  );
const bodyOf = (call: unknown[]) => JSON.parse((call[1] as { body: string }).body);

const prefs = (over = {}) => ({
  assignmentNotifications: true,
  completionNotifications: true,
  inviteNotifications: true,
  emailNotifications: false,
  ...over,
});
const home = (over = {}) => ({
  holidayPreferences: [],
  contacts: [],
  user: { id: 'u1', auth0Sub: 'auth0|me', name: 'Ada Lovelace', email: 'me@x.com' },
  account: { id: 'a1' },
  notificationPreferences: prefs(),
  needsUserSetup: false,
  needsHolidaySelection: false,
  ...over,
});
const loadHome = (data = home()) =>
  act(() => {
    store.dispatch(setHomeData(data as never));
  });

const serve = (handlers: Record<string, () => unknown> = {}) =>
  mockFetch.mockImplementation(async (url: string, init?: { method?: string }) => {
    const key = `${init?.method ?? 'GET'} ${url}`;
    const all: Record<string, () => unknown> = {
      'GET /api/home': () => reply({ data: home() }),
      'PUT /api/users/me': () => reply({ id: 'u1' }),
      'PUT /api/users/me/notification-preferences': () => reply({ success: true }),
      ...handlers,
    };
    return (all[key] ?? (() => reply({}, false)))();
  });

const mount = () =>
  render(
    <Provider store={store}>
      <SettingsPage />
    </Provider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = mockFetch as unknown as typeof fetch;
  act(() => {
    store.dispatch(clearHomeData());
  });
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('Settings page', () => {
  describe('loading home data', () => {
    it('fetches it when the store does not have it yet', async () => {
      serve();
      mount();
      await waitFor(() => expect(calls('GET', '/api/home')).toHaveLength(1));
      await waitFor(() =>
        expect(store.getState().home.data?.account).toEqual({ id: 'a1' }),
      );
    });

    it('does not fetch it again when it is already there', async () => {
      loadHome();
      serve();
      mount();
      await screen.findByText('Ada Lovelace');
      expect(calls('GET', '/api/home')).toHaveLength(0);
    });

    it('leaves the store empty if the request fails', async () => {
      serve({ 'GET /api/home': () => reply({}, false) });
      mount();
      await waitFor(() => expect(calls('GET', '/api/home')).toHaveLength(1));
      expect(store.getState().home.data).toBeNull();
    });
  });

  describe('editing the display name', () => {
    const startEditing = async () => {
      loadHome();
      mount();
      fireEvent.click(await screen.findByTitle('Edit name'));
      return screen.getByPlaceholderText('Enter your name');
    };

    it('starts from the current name', async () => {
      serve();
      expect(await startEditing()).toHaveValue('Ada Lovelace');
    });

    it('saves a new name, then refreshes the home data', async () => {
      serve();
      const input = await startEditing();
      fireEvent.change(input, { target: { value: '  Grace Hopper ' } });
      fireEvent.click(screen.getByTitle('Save'));

      await waitFor(() => expect(calls('PUT', '/api/users/me')).toHaveLength(1));
      expect(bodyOf(calls('PUT', '/api/users/me')[0])).toEqual({
        auth0Sub: 'auth0|me',
        name: 'Grace Hopper',
      });
      expect(await screen.findByText('Grace Hopper')).toBeInTheDocument();
      await waitFor(() => expect(calls('GET', '/api/home')).toHaveLength(1));
    });

    it('does not call the server when the name is unchanged', async () => {
      serve();
      await startEditing();
      fireEvent.click(screen.getByTitle('Save'));

      await waitFor(() =>
        expect(
          screen.queryByPlaceholderText('Enter your name'),
        ).not.toBeInTheDocument(),
      );
      expect(calls('PUT', '/api/users/me')).toHaveLength(0);
    });

    it('Cancel discards the edit without a request', async () => {
      serve();
      const input = await startEditing();
      fireEvent.change(input, { target: { value: 'Someone Else' } });
      fireEvent.click(screen.getByTitle('Cancel'));

      expect(
        screen.queryByPlaceholderText('Enter your name'),
      ).not.toBeInTheDocument();
      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('closes the editor and keeps the old name when saving fails', async () => {
      serve({ 'PUT /api/users/me': () => reply({}, false) });
      const input = await startEditing();
      fireEvent.change(input, { target: { value: 'Grace Hopper' } });
      fireEvent.click(screen.getByTitle('Save'));

      await waitFor(() =>
        expect(
          screen.queryByPlaceholderText('Enter your name'),
        ).not.toBeInTheDocument(),
      );
      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
      expect(calls('GET', '/api/home')).toHaveLength(0);
    });
  });

  describe('notification preferences', () => {
    const toggle = () => {
      const label = screen.getByText('Assignment Notifications');
      return label.parentElement!.parentElement!.querySelector(
        'button',
      ) as HTMLElement;
    };
    const stored = () =>
      store.getState().home.data?.notificationPreferences?.assignmentNotifications;

    it('saves a change and refreshes the home data', async () => {
      loadHome();
      serve();
      mount();
      await screen.findByText('Assignment Notifications');

      fireEvent.click(toggle());

      await waitFor(() =>
        expect(calls('PUT', '/api/users/me/notification-preferences')).toHaveLength(
          1,
        ),
      );
      expect(
        bodyOf(calls('PUT', '/api/users/me/notification-preferences')[0]),
      ).toEqual({
        assignmentNotifications: false,
      });
      await waitFor(() => expect(calls('GET', '/api/home')).toHaveLength(1));
    });

    it('shows the change straight away, before the server answers', async () => {
      loadHome();
      let release!: (v: unknown) => void;
      mockFetch.mockImplementation(
        () => new Promise(resolve => (release = resolve)),
      );
      mount();
      await screen.findByText('Assignment Notifications');

      fireEvent.click(toggle());

      expect(stored()).toBe(false);
      await act(async () => release(reply({}, false)));
    });

    it('puts the setting back if the server rejects it', async () => {
      loadHome();
      serve({
        'PUT /api/users/me/notification-preferences': () => reply({}, false),
      });
      mount();
      await screen.findByText('Assignment Notifications');

      fireEvent.click(toggle());

      await waitFor(() =>
        expect(calls('PUT', '/api/users/me/notification-preferences')).toHaveLength(
          1,
        ),
      );
      await waitFor(() => expect(stored()).toBe(true));
    });
  });
});
