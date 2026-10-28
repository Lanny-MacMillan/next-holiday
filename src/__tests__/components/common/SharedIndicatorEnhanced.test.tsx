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
import { refreshShares } from '@/store/slices/sharesSlice';
import { declineInvite, fetchInboxInvites } from '@/store/slices/invitesSlice';
import SharedIndicatorEnhanced from '@/components/common/SharedIndicatorEnhanced';

let authValue: { user?: { sub: string; email?: string; name?: string } };
jest.mock('@auth0/auth0-react', () => ({ useAuth0: () => authValue }));

const cleanupAfterLeaveShare = jest.fn();
const cleanupAfterRemoveMember = jest.fn();
jest.mock('@/hooks/useShareCleanup', () => ({
  useShareCleanup: () => ({ cleanupAfterLeaveShare, cleanupAfterRemoveMember }),
}));
jest.mock('@/components/common/SharedUserList', () => ({
  __esModule: true,
  default: ({
    members,
    onOpenModal,
  }: {
    members: unknown[];
    onOpenModal: () => void;
  }) => (
    <span data-testid="avatars" onClick={onOpenModal}>
      {members.length} avatars
    </span>
  ),
}));
jest.mock('@/components/common/UserAvatar', () => ({
  __esModule: true,
  default: () => <i />,
}));

const mockFetch = jest.fn();
const reply = (body: unknown, ok = true) => ({
  ok,
  status: ok ? 200 : 400,
  json: async () => body,
});

const me = { userId: 'auth0|me', uuid: 'u-me', name: 'Me', email: 'me@x.com' };
const pal = {
  userId: 'auth0|pal',
  uuid: 'u-pal',
  name: 'Pal',
  email: 'pal@x.com',
  joinedAt: '2030-03-04T00:00:00Z',
};
const share = (over: Record<string, unknown> = {}) => ({
  shareId: 's-1',
  holidayId: 'h-1',
  holidayKey: 'christmas',
  ownerUserId: 'auth0|me',
  memberUserIds: ['auth0|me', 'auth0|pal'],
  members: [me, pal],
  ...over,
});

const seed = (s: unknown) =>
  act(() => {
    store.dispatch(refreshShares.fulfilled((s ? [s] : []) as never, '', 'auth0|me'));
  });
const mount = (
  props: Partial<React.ComponentProps<typeof SharedIndicatorEnhanced>> = {},
) =>
  render(
    <Provider store={store}>
      <SharedIndicatorEnhanced holidayKey="christmas" {...props} />
    </Provider>,
  );
const openMembers = () =>
  fireEvent.click(screen.getByTitle('Click to view all shared members'));

beforeEach(() => {
  jest.clearAllMocks();
  authValue = { user: { sub: 'auth0|me', email: 'me@x.com', name: 'Me' } };
  global.fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockImplementation(async (url: string) =>
    url.includes('/members')
      ? reply(share({ members: [me], memberUserIds: ['auth0|me'] }))
      : reply([]),
  );
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('SharedIndicatorEnhanced', () => {
  describe('the badge', () => {
    it('renders nothing when the holiday has no share', () => {
      seed(null);
      const { container } = mount();
      expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing for a share with no members', () => {
      seed(share({ members: [], memberUserIds: [] }));
      const { container } = mount();
      expect(container).toBeEmptyDOMElement();
    });

    it('says Shared with the member count when there is more than one member', () => {
      seed(share());
      mount();
      expect(screen.getByText('Shared')).toBeInTheDocument();
      expect(screen.getByText('2 members')).toBeInTheDocument();
      expect(screen.getByTestId('avatars')).toHaveTextContent('2 avatars');
    });

    it('says Shareable for a lone owner, and Invite Sent once an invite is out', () => {
      seed(share({ members: [me], memberUserIds: ['auth0|me'] }));
      const { unmount } = mount();
      expect(screen.getByText('Shareable')).toBeInTheDocument();
      expect(screen.getByText('1 member')).toBeInTheDocument();
      unmount();

      seed(
        share({
          members: [me],
          memberUserIds: ['auth0|me'],
          hasPendingInvites: true,
        }),
      );
      mount();
      expect(screen.getByText('Invite Sent')).toBeInTheDocument();
      expect(screen.getByText('1 member (invite sent)')).toBeInTheDocument();
    });

    it('does not claim Invite Sent to a guest who owns nothing', () => {
      seed(
        share({
          ownerUserId: 'auth0|pal',
          members: [me],
          memberUserIds: ['auth0|me'],
          hasPendingInvites: true,
        }),
      );
      mount();
      expect(screen.getByText('Shareable')).toBeInTheDocument();
    });

    it('can hide the label', () => {
      seed(share());
      mount({ showLabel: false });
      expect(screen.queryByText('Shared')).not.toBeInTheDocument();
    });

    it('shows custom text instead of the avatars', () => {
      seed(share());
      mount({ customText: 'Guest' });
      expect(screen.getByText('Guest')).toBeInTheDocument();
      expect(screen.queryByTestId('avatars')).not.toBeInTheDocument();
    });

    it('falls back to the plain member ids when there are no member details', () => {
      seed(share({ members: undefined }));
      mount();
      expect(screen.getByTestId('avatars')).toHaveTextContent('2 avatars');
    });
  });

  describe('a pending invite for the signed-in user', () => {
    let seq = 0;
    let invite: Record<string, string>;
    beforeEach(() => {
      invite = {
        id: `inv-${++seq}`,
        toEmail: 'me@x.com',
        holidayKey: 'christmas',
        status: 'pending',
      };
    });
    afterEach(() => {
      act(() => {
        store.dispatch(
          declineInvite.fulfilled({ ...invite, status: 'declined' } as never, '', {
            inviteId: invite.id,
          }),
        );
      });
    });

    it('replaces the badge with Invite Pending', () => {
      seed(share());
      act(() => {
        store.dispatch(
          fetchInboxInvites.fulfilled([invite] as never, '', 'auth0|me'),
        );
      });
      mount();
      expect(screen.getByText('Invite Pending')).toBeInTheDocument();
      expect(screen.queryByText('Shared')).not.toBeInTheDocument();
    });

    it('shows it even when no share exists yet', () => {
      seed(null);
      act(() => {
        store.dispatch(
          fetchInboxInvites.fulfilled([invite] as never, '', 'auth0|me'),
        );
      });
      mount();
      expect(screen.getByText('Invite Pending')).toBeInTheDocument();
    });
  });

  describe('the members dialog', () => {
    it('opens from the badge and lists everyone with their roles', () => {
      seed(share());
      mount();
      openMembers();

      const dialog = screen
        .getByText('Shared Members (2)')
        .closest('.card') as HTMLElement;
      expect(within(dialog).getByText('Owner')).toBeInTheDocument();
      expect(within(dialog).getByText('Pal')).toBeInTheDocument();
      expect(within(dialog).getByText('pal@x.com')).toBeInTheDocument();
      expect(within(dialog).getByText(/^Joined /)).toBeInTheDocument();
      expect(
        within(dialog).getByText('You are the owner of this shared holiday'),
      ).toBeInTheDocument();
    });

    it('opens from the avatar list too, and closes with the X or the backdrop', () => {
      seed(share());
      mount();
      fireEvent.click(screen.getByTestId('avatars'));
      expect(screen.getByText('Shared Members (2)')).toBeInTheDocument();

      const dialog = screen
        .getByText('Shared Members (2)')
        .closest('.card') as HTMLElement;
      fireEvent.click(within(dialog).getAllByRole('button')[0]);
      expect(screen.queryByText('Shared Members (2)')).not.toBeInTheDocument();

      openMembers();
      fireEvent.click(
        screen.getByText('Shared Members (2)').closest('.fixed') as HTMLElement,
      );
      expect(screen.queryByText('Shared Members (2)')).not.toBeInTheDocument();
    });

    it('calls an unnamed member Unknown User', () => {
      seed(share({ members: [me, { userId: 'auth0|x', uuid: 'u-x' }] }));
      mount();
      openMembers();
      expect(screen.getByText('Unknown User')).toBeInTheDocument();
    });

    it('lets the owner remove others but not themself', () => {
      seed(share());
      mount();
      openMembers();
      expect(screen.getAllByTitle('Remove member')).toHaveLength(1);
      expect(screen.queryByTitle('Leave shared holiday')).not.toBeInTheDocument();
    });

    it('lets a guest leave but not remove anyone', () => {
      seed(share({ ownerUserId: 'auth0|pal' }));
      mount();
      openMembers();
      expect(screen.getByTitle('Leave shared holiday')).toBeInTheDocument();
      expect(screen.queryByTitle('Remove member')).not.toBeInTheDocument();
      expect(screen.getByText(/You're a guest member/)).toBeInTheDocument();
      expect(screen.getByText('You')).toBeInTheDocument();
    });
  });

  describe('removing a member', () => {
    const startRemove = () => {
      seed(share());
      mount();
      openMembers();
      fireEvent.click(screen.getByTitle('Remove member'));
    };

    it('asks first, naming the person', () => {
      startRemove();
      expect(screen.getByText('Remove Member?')).toBeInTheDocument();
      expect(
        screen.getByText(/remove Pal from this shared holiday/),
      ).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('Cancel backs out without calling the API', () => {
      startRemove();
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByText('Remove Member?')).not.toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('deletes the member, refreshes shares, cleans up and closes the confirmation', async () => {
      startRemove();
      fireEvent.click(screen.getByRole('button', { name: 'Remove Member' }));

      await waitFor(() =>
        expect(cleanupAfterRemoveMember).toHaveBeenCalledWith(authValue.user),
      );
      const deleteCall = mockFetch.mock.calls.find(
        c => (c[1] as { method?: string })?.method === 'DELETE',
      )!;
      expect(deleteCall[0]).toBe('/api/shares/s-1/members?userId=auth0%7Cpal');
      expect(
        mockFetch.mock.calls.some(c => c[0] === '/api/shares?userId=auth0|me'),
      ).toBe(true);
      await waitFor(() =>
        expect(screen.queryByText('Remove Member?')).not.toBeInTheDocument(),
      );
    });

    it('shows the failure and keeps the confirmation open', async () => {
      mockFetch.mockResolvedValue(reply({ error: 'Not allowed' }, false));
      startRemove();
      fireEvent.click(screen.getByRole('button', { name: 'Remove Member' }));

      expect(await screen.findByText('Not allowed')).toBeInTheDocument();
      expect(screen.getByText('Remove Member?')).toBeInTheDocument();
      expect(cleanupAfterRemoveMember).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Remove Member' })).toBeEnabled();
    });

    it('blocks Cancel while the request is running', async () => {
      let release!: (v: unknown) => void;
      mockFetch.mockImplementation(
        () => new Promise(resolve => (release = resolve)),
      );
      startRemove();
      fireEvent.click(screen.getByRole('button', { name: 'Remove Member' }));

      expect(
        await screen.findByRole('button', { name: 'Removing...' }),
      ).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

      mockFetch.mockImplementation(async () => reply([]));
      await act(async () => release(reply({ error: 'x' }, false)));
    });
  });

  describe('leaving a share', () => {
    const startLeave = () => {
      seed(share({ ownerUserId: 'auth0|pal' }));
      mount();
      openMembers();
      fireEvent.click(screen.getByTitle('Leave shared holiday'));
    };

    it('asks first', () => {
      startLeave();
      expect(screen.getByText('Leave Shared Holiday?')).toBeInTheDocument();
    });

    it('leaves, cleans up, and closes both dialogs', async () => {
      startLeave();
      fireEvent.click(screen.getByRole('button', { name: 'Leave Holiday' }));

      await waitFor(() =>
        expect(cleanupAfterLeaveShare).toHaveBeenCalledWith(authValue.user),
      );
      expect(mockFetch.mock.calls[0][0]).toBe(
        '/api/shares/s-1/members?userId=auth0%7Cme',
      );
      await waitFor(() =>
        expect(screen.queryByText('Leave Shared Holiday?')).not.toBeInTheDocument(),
      );
      expect(screen.queryByText(/Shared Members/)).not.toBeInTheDocument();
    });

    it('shows the failure and stays put', async () => {
      mockFetch.mockResolvedValue(reply({ error: 'Cannot leave' }, false));
      startLeave();
      fireEvent.click(screen.getByRole('button', { name: 'Leave Holiday' }));
      expect(await screen.findByText('Cannot leave')).toBeInTheDocument();
      expect(cleanupAfterLeaveShare).not.toHaveBeenCalled();
    });
  });
});
