/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { setHomeData, clearHomeData } from '@/store/slices/homeSlice';
import { refreshShares } from '@/store/slices/sharesSlice';
import { fetchOutgoingInvites } from '@/store/slices/invitesSlice';
import InviteButton from '@/components/common/InviteButton';

const authValue = { user: { sub: 'auth0|me', email: 'me@x.com', name: 'Me' } };
jest.mock('@auth0/auth0-react', () => ({ useAuth0: () => authValue }));
jest.mock('@/components/common/SharedIndicatorEnhanced', () => ({
  __esModule: true,
  default: ({ customText }: { customText?: string }) => (
    <div data-testid="shared-indicator">{customText}</div>
  ),
}));

const mockFetch = jest.fn();
const reply = (body: unknown, ok = true, status = ok ? 200 : 500) => ({
  ok,
  status,
  statusText: '',
  json: async () => body,
});
const calls = (method: string, prefix: string) =>
  mockFetch.mock.calls.filter(
    c =>
      c[0].startsWith(prefix) &&
      ((c[1] as { method?: string })?.method ?? 'GET') === method,
  );
const bodyOf = (call: unknown[]) => JSON.parse((call[1] as { body: string }).body);

const SHARE = {
  shareId: 's-1',
  id: 's-1',
  holidayId: 'h-1',
  holidayKey: 'christmas',
  ownerUserId: 'auth0|me',
  memberUserIds: ['auth0|me'],
  members: [] as unknown[],
};

let respond: Record<string, () => unknown>;
const installFetch = () =>
  mockFetch.mockImplementation(async (url: string, init?: { method?: string }) => {
    const key = `${init?.method ?? 'GET'} ${url.split('?')[0]}`;
    const handler = respond[key];
    return handler ? handler() : reply([]);
  });

const seed = (shares: unknown[] = [], withHoliday = true) => {
  act(() => {
    store.dispatch(refreshShares.fulfilled(shares as never, '', 'auth0|me'));
    store.dispatch(clearHomeData());
    if (withHoliday) {
      store.dispatch(
        setHomeData({
          holidayPreferences: [{ holiday: 'Christmas', holidayId: 'h-1' }],
        } as never),
      );
    }
  });
};

const mount = (over: Partial<React.ComponentProps<typeof InviteButton>> = {}) =>
  render(
    <Provider store={store}>
      <InviteButton holidayKey="christmas" holidayName="Christmas" {...over} />
    </Provider>,
  );

const sendInvite = (email: string, message?: string) => {
  fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
  fireEvent.change(screen.getByPlaceholderText('Enter email address or user ID'), {
    target: { value: email },
  });
  if (message) {
    fireEvent.change(screen.getByPlaceholderText(/personal message/), {
      target: { value: message },
    });
  }
  fireEvent.submit(document.querySelector('form')!);
};

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = mockFetch as unknown as typeof fetch;
  respond = {
    'GET /api/shares': () => reply([SHARE]),
    'POST /api/shares': () => reply({ ...SHARE, shareStatus: 'created_new' }),
    'POST /api/invites': () => reply({ id: 'i-1', inviteStatus: 'created' }),
    'GET /api/invites': () => reply([]),
  };
  installFetch();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('InviteButton', () => {
  describe('who sees what', () => {
    it('shows Invite when nobody has shared the holiday yet', () => {
      seed([]);
      mount();
      expect(screen.getByRole('button', { name: 'Invite' })).toBeInTheDocument();
    });

    it('shows Invite to the owner of an existing share', () => {
      seed([SHARE]);
      mount();
      expect(screen.getByRole('button', { name: 'Invite' })).toBeInTheDocument();
    });

    it("shows a Guest indicator instead to someone else's share", () => {
      seed([
        {
          ...SHARE,
          ownerUserId: 'auth0|other',
          memberUserIds: ['auth0|other', 'auth0|me'],
        },
      ]);
      mount();
      expect(screen.getByTestId('shared-indicator')).toHaveTextContent('Guest');
      expect(
        screen.queryByRole('button', { name: 'Invite' }),
      ).not.toBeInTheDocument();
    });

    it('opens and closes the invite form', () => {
      seed([SHARE]);
      mount();
      fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
      expect(screen.getByText('Share this holiday')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByText('Share this holiday')).not.toBeInTheDocument();
    });
  });

  describe('sending an invite', () => {
    it('invites by email on an existing share, then refreshes invites and shares', async () => {
      seed([SHARE]);
      mount();
      sendInvite('Friend@X.com', 'Join us');

      await waitFor(() => expect(calls('POST', '/api/invites')).toHaveLength(1));
      expect(bodyOf(calls('POST', '/api/invites')[0])).toEqual({
        shareId: 's-1',
        fromUserId: 'auth0|me',
        toEmail: 'Friend@X.com',
        holidayKey: 'christmas',
        message: 'Join us',
      });
      expect(calls('POST', '/api/shares')).toHaveLength(0);
      expect(
        await screen.findByText('Invite sent to Friend@X.com successfully!'),
      ).toBeInTheDocument();
      await waitFor(() =>
        expect(screen.queryByText('Share this holiday')).not.toBeInTheDocument(),
      );
      expect(calls('GET', '/api/invites').length).toBeGreaterThan(0);
    });

    it('creates the share first when there is none', async () => {
      seed([]);
      respond['GET /api/shares'] = () => reply([]);
      mount();
      sendInvite('new@x.com');

      await waitFor(() => expect(calls('POST', '/api/invites')).toHaveLength(1));
      expect(bodyOf(calls('POST', '/api/shares')[0])).toEqual({
        holidayId: 'h-1',
        holidayKey: 'christmas',
        ownerUserId: 'auth0|me',
        memberUserIds: ['auth0|me'],
      });
      expect(bodyOf(calls('POST', '/api/invites')[0]).shareId).toBe('s-1');
    });

    it("uses the API's message and a success tone for registered users", async () => {
      seed([SHARE]);
      respond['POST /api/invites'] = () =>
        reply({
          id: 'i-2',
          inviteStatus: 'created',
          message: 'Invite sent to a known user',
          userLookupStatus: 'registered_user',
        });
      mount();
      sendInvite('known@x.com');
      expect(
        await screen.findByText('Invite sent to a known user'),
      ).toBeInTheDocument();
    });

    it('keeps going if the pre-send share refresh fails', async () => {
      seed([SHARE]);
      let first = true;
      respond['GET /api/shares'] = () => {
        if (first) {
          first = false;
          return reply({}, false);
        }
        return reply([SHARE]);
      };
      mount();
      sendInvite('still@x.com');
      await waitFor(() => expect(calls('POST', '/api/invites')).toHaveLength(1));
    });

    it('asks to refresh when the holiday id is unknown and there is no share', async () => {
      seed([], false);
      respond['GET /api/shares'] = () => reply([]);
      mount();
      sendInvite('lost@x.com');
      expect(
        await screen.findByText('Please try again after refreshing the data.'),
      ).toBeInTheDocument();
      expect(calls('POST', '/api/invites')).toHaveLength(0);
    });
  });

  describe('checks before calling the API', () => {
    const blocked = async (email: string, message: string) => {
      mount();
      sendInvite(email);
      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(calls('POST', '/api/invites')).toHaveLength(0);
      expect(calls('POST', '/api/shares')).toHaveLength(0);
    };

    it('will not let you invite yourself by email (any case)', async () => {
      seed([SHARE]);
      await blocked('ME@x.com', 'You cannot invite yourself!');
    });

    it('will not invite someone who is already a member', async () => {
      seed([
        {
          ...SHARE,
          members: [{ userId: 'auth0|pal', uuid: 'u-2', email: 'Pal@x.com' }],
        },
      ]);
      await blocked('pal@x.com', 'This person is already a member of this holiday!');
    });

    // The field says "email address or user ID", but FormModal's email check
    // rejects anything that is not an email, so the user-id branches in
    // handleSendInvite are not reachable from the form.
    it('KNOWN ISSUE: a user id is refused by the form as an invalid email', () => {
      seed([SHARE]);
      jest.spyOn(window, 'alert').mockImplementation(() => {});
      mount();
      sendInvite('auth0|pal');
      expect(window.alert).toHaveBeenCalledWith(
        'Please enter valid email addresses for: Enter email address or user ID',
      );
      expect(calls('POST', '/api/invites')).toHaveLength(0);
    });

    it('will not repeat a pending invite for the same holiday', async () => {
      seed([SHARE]);
      await act(async () => {
        store.dispatch(
          fetchOutgoingInvites.fulfilled(
            [
              {
                id: 'pending-1',
                shareId: 's-1',
                fromUserId: 'auth0|me',
                toEmail: 'waiting@x.com',
                holidayKey: 'christmas',
                status: 'pending',
              },
            ] as never,
            '',
            'auth0|me',
          ),
        );
      });
      await blocked(
        'Waiting@x.com',
        'A pending invite to waiting@x.com already exists for Christmas!',
      );
    });
  });

  describe('when the API refuses', () => {
    const fail = (status: number, body: unknown) => {
      respond['POST /api/invites'] = () => reply(body, false, status);
      seed([SHARE]);
      mount();
      sendInvite('x@y.com');
    };

    it("shows the server's reason when it is informative", async () => {
      fail(403, { error: 'Only Plus members can invite others' });
      expect(
        await screen.findByText('Only Plus members can invite others'),
      ).toBeInTheDocument();
    });

    it('falls back to a generic message for short or unhelpful errors', async () => {
      fail(500, { error: 'boom' });
      expect(
        await screen.findByText('Failed to send invite. Please try again.'),
      ).toBeInTheDocument();
    });

    it('hides "Failed to create" and 500 text behind the generic message', async () => {
      fail(500, {});
      expect(
        await screen.findByText('Failed to send invite. Please try again.'),
      ).toBeInTheDocument();
    });

    it('re-enables the button afterwards', async () => {
      fail(400, { error: 'This invite is not allowed right now' });
      await screen.findByText('This invite is not allowed right now');
      expect(screen.getByRole('button', { name: 'Invite' })).toBeEnabled();
    });
  });
});
