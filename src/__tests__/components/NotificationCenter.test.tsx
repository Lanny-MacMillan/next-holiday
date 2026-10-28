/**
 * @jest-environment jsdom
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import NotificationCenter from '@/components/common/NotificationCenter';

const authValue = {
  user: { sub: 'auth0|me', email: 'me@x.com', name: 'Me' },
  isAuthenticated: true,
  isLoading: false,
};
let signedIn = true;
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () =>
    signedIn
      ? authValue
      : { user: undefined, isAuthenticated: false, isLoading: false },
}));

const mockFetch = jest.fn();
const reply = (body: unknown, ok = true) => ({
  ok,
  status: ok ? 200 : 500,
  json: async () => body,
});
const calls = (method: string, url: string) =>
  mockFetch.mock.calls.filter(
    c => c[0] === url && ((c[1] as { method?: string })?.method ?? 'GET') === method,
  );
const bodyOf = (call: unknown[]) => JSON.parse((call[1] as { body: string }).body);

const note = (over: Record<string, unknown> = {}) => ({
  id: 'n1',
  type: 'task_assigned',
  title: 'Task assigned',
  message: 'Wrap the presents',
  isRead: false,
  createdAt: new Date().toISOString(),
  ...over,
});
const invite = (over: Record<string, unknown> = {}) =>
  note({
    id: 'invite-i1',
    type: 'invite_received',
    isInvite: true,
    entityId: 'i1',
    title: 'Holiday Share Invitation',
    message: 'Sam invited you to collaborate on Christmas',
    fromUser: { name: 'Sam' },
    holiday: { name: 'Christmas', holidayType: 'Christmas' },
    ...over,
  });

let handlers: Record<string, () => unknown>;
const serve = (
  notifications: unknown[],
  extra: Record<string, () => unknown> = {},
) => {
  handlers = {
    // No stream ticket: the component falls back to polling, which is what is tested here
    '/api/sse-ticket': () => reply({}, false),
    'GET /api/notifications': () => reply({ data: notifications }),
    'PATCH /api/notifications': () => reply({ success: true }),
    ...extra,
  };
  mockFetch.mockImplementation(async (url: string, init?: { method?: string }) => {
    const key = `${init?.method ?? 'GET'} ${url}`;
    return (handlers[key] ?? handlers[url] ?? (() => reply({}, false)))();
  });
};

const mount = () =>
  render(
    <Provider store={store}>
      <NotificationCenter />
    </Provider>,
  );
const bell = () => screen.getByRole('button', { name: /^Notifications/ });
const open = async () => {
  await waitFor(() =>
    expect(calls('GET', '/api/notifications').length).toBeGreaterThan(0),
  );
  fireEvent.click(bell());
};

beforeEach(() => {
  jest.clearAllMocks();
  signedIn = true;
  global.fetch = mockFetch as unknown as typeof fetch;
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'group').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('NotificationCenter notifications', () => {
  describe('loading', () => {
    it('makes no requests for a signed-out visitor', () => {
      signedIn = false;
      serve([]);
      mount();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('loads notifications and shows the unread count on the bell', async () => {
      serve([note(), note({ id: 'n2', isRead: true }), note({ id: 'n3' })]);
      mount();
      await open();

      expect(
        await screen.findByRole('button', { name: 'Notifications (2 unread)' }),
      ).toBeInTheDocument();
      expect(screen.getAllByText('Task assigned')).toHaveLength(3);
    });

    it('ignores malformed notifications', async () => {
      serve([
        note(),
        { id: 'bad' },
        note({ id: 7 }),
        null,
        note({ id: 'n9', title: '' }),
      ]);
      mount();
      await open();

      expect(await screen.findAllByText('Task assigned')).toHaveLength(1);
    });

    it('says so when there are none', async () => {
      serve([]);
      mount();
      await open();
      expect(await screen.findByText('No notifications yet')).toBeInTheDocument();
    });

    it('shows an error when loading fails', async () => {
      serve([], { 'GET /api/notifications': () => reply({}, false) });
      mount();
      await open();
      expect(
        await screen.findByText('Failed to load notifications'),
      ).toBeInTheDocument();
    });
  });

  describe('marking as read', () => {
    it('marks one notification read and lowers the unread count', async () => {
      serve([note(), note({ id: 'n2' })]);
      mount();
      await open();
      await screen.findAllByText('Task assigned');

      fireEvent.click(screen.getAllByTitle('Mark as read')[0]);

      await waitFor(() =>
        expect(calls('PATCH', '/api/notifications')).toHaveLength(1),
      );
      expect(bodyOf(calls('PATCH', '/api/notifications')[0])).toEqual({
        notificationIds: ['n1'],
        action: 'read',
      });
      expect(
        await screen.findByRole('button', { name: 'Notifications (1 unread)' }),
      ).toBeInTheDocument();
    });

    it('marks every unread notification read with Mark all read', async () => {
      serve([note(), note({ id: 'n2' }), note({ id: 'n3', isRead: true })]);
      mount();
      await open();
      await screen.findAllByText('Task assigned');

      fireEvent.click(screen.getByRole('button', { name: 'Mark all read' }));

      await waitFor(() =>
        expect(calls('PATCH', '/api/notifications')).toHaveLength(1),
      );
      expect(bodyOf(calls('PATCH', '/api/notifications')[0])).toEqual({
        notificationIds: ['n1', 'n2'],
        action: 'read',
      });
      expect(
        await screen.findByRole('button', { name: 'Notifications' }),
      ).toBeInTheDocument();
    });

    it('keeps the notification unread and shows an error if the update fails', async () => {
      serve([note()], { 'PATCH /api/notifications': () => reply({}, false) });
      mount();
      await open();
      await screen.findByText('Task assigned');

      fireEvent.click(screen.getByTitle('Mark as read'));

      expect(
        await screen.findByText('Failed to update notifications'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Notifications (1 unread)' }),
      ).toBeInTheDocument();
    });
  });

  describe('deleting', () => {
    it('deletes a notification and removes it from the list', async () => {
      serve([note()]);
      mount();
      await open();
      await screen.findByText('Task assigned');

      fireEvent.click(screen.getByTitle('Delete notification'));

      await waitFor(() =>
        expect(calls('PATCH', '/api/notifications')).toHaveLength(1),
      );
      expect(bodyOf(calls('PATCH', '/api/notifications')[0])).toEqual({
        notificationIds: ['n1'],
        action: 'delete',
      });
      expect(await screen.findByText('No notifications yet')).toBeInTheDocument();
    });

    it('removes only the notification that was deleted', async () => {
      serve([note(), note({ id: 'n2' })]);
      mount();
      await open();
      await screen.findAllByText('Task assigned');

      fireEvent.click(screen.getAllByTitle('Delete notification')[0]);

      await waitFor(() =>
        expect(screen.getAllByText('Task assigned')).toHaveLength(1),
      );
      expect(calls('PATCH', '/api/notifications')).toHaveLength(1);
    });

    it('keeps the notification and shows an error if the delete fails', async () => {
      serve([note()], { 'PATCH /api/notifications': () => reply({}, false) });
      mount();
      await open();
      await screen.findByText('Task assigned');

      fireEvent.click(screen.getAllByTitle('Delete notification')[0]);

      expect(
        await screen.findByText('Failed to delete notification'),
      ).toBeInTheDocument();
      expect(screen.getByText('Task assigned')).toBeInTheDocument();
    });
  });

  describe('invites', () => {
    it('declines an invite with the Decline button and removes it', async () => {
      serve([invite()], {
        'POST /api/invites/i1/decline': () => reply({ id: 'i1' }),
      });
      mount();
      await open();
      await screen.findByText('Holiday Share Invitation');

      fireEvent.click(screen.getByRole('button', { name: 'Decline' }));

      await waitFor(() =>
        expect(calls('POST', '/api/invites/i1/decline')).toHaveLength(1),
      );
      await waitFor(() =>
        expect(
          screen.queryByText('Holiday Share Invitation'),
        ).not.toBeInTheDocument(),
      );
    });

    it('deleting an invite notification declines the invite instead', async () => {
      serve([invite()], {
        'POST /api/invites/i1/decline': () => reply({ id: 'i1' }),
      });
      mount();
      await open();
      await screen.findByText('Holiday Share Invitation');

      fireEvent.click(screen.getAllByTitle('Delete notification')[0]);

      await waitFor(() =>
        expect(calls('POST', '/api/invites/i1/decline')).toHaveLength(1),
      );
      expect(calls('PATCH', '/api/notifications')).toHaveLength(0);
    });

    it('keeps the invite if declining fails', async () => {
      serve([invite()], { 'POST /api/invites/i1/decline': () => reply({}, false) });
      mount();
      await open();
      await screen.findByText('Holiday Share Invitation');

      fireEvent.click(screen.getByRole('button', { name: 'Decline' }));

      await waitFor(() =>
        expect(calls('POST', '/api/invites/i1/decline')).toHaveLength(1),
      );
      expect(screen.getByText('Holiday Share Invitation')).toBeInTheDocument();
    });
  });
});
