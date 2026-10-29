/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { setUser } from '@/store/slices/userSlice';
import CancelSubscriptionModal from '@/components/modals/CancelSubscriptionModal';

const goToStripe = jest.fn();
jest.mock('@/lib/billingClient', () => ({
  goToStripe: (...a: unknown[]) => goToStripe(...a),
}));
let provider: 'free' | 'stripe' = 'free';
jest.mock('@/lib/payments', () => ({ paymentsProvider: () => provider }));

let authValue: { user?: { sub: string; email: string; name: string } };
jest.mock('@auth0/auth0-react', () => ({ useAuth0: () => authValue }));

const mockFetch = jest.fn();
const urls = () =>
  mockFetch.mock.calls.map(
    c => `${(c[1] as { method?: string })?.method ?? 'GET'} ${c[0]}`,
  );
const bodyOf = (url: string) => {
  const call = mockFetch.mock.calls.find(c => c[0] === url)!;
  return JSON.parse((call[1] as { body: string }).body);
};

const reply = (body: unknown, ok = true) => ({
  ok,
  status: ok ? 200 : 500,
  json: async () => body,
});
const respond = (overrides: Record<string, () => unknown> = {}) =>
  mockFetch.mockImplementation(async (url: string) => {
    const handlers: Record<string, () => unknown> = {
      '/api/users/cancel-subscription-cleanup': () => reply({ success: true }),
      '/api/upgrade-user': () =>
        reply({ user: { id: 'u1', subscriptionPlan: 'free' } }),
      '/api/users/me/preferences': () => reply({ success: true }),
      '/api/shares?userId=auth0|me': () => reply([]),
      ...overrides,
    };
    return (handlers[url] ?? (() => reply({})))();
  });

const props = { isOpen: true, onClose: jest.fn(), onCancel: jest.fn() };
const renderModal = (over: Partial<typeof props> = {}) =>
  render(
    <Provider store={store}>
      <CancelSubscriptionModal {...props} {...over} />
    </Provider>,
  );
const confirm = () =>
  fireEvent.click(screen.getByRole('button', { name: /Yes, Cancel Subscription/ }));

beforeEach(() => {
  jest.clearAllMocks();
  provider = 'free';
  authValue = { user: { sub: 'auth0|me', email: 'me@x.com', name: 'Me' } };
  global.fetch = mockFetch as unknown as typeof fetch;
  jest.spyOn(window, 'alert').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  act(() => {
    store.dispatch(
      setUser({
        id: 'u1',
        sub: 'auth0|me',
        email: 'me@x.com',
        name: 'Me',
        isInDb: true,
        subscriptionPlan: 'plus',
      } as never),
    );
  });
});

afterEach(() => jest.restoreAllMocks());

describe('CancelSubscriptionModal', () => {
  it('renders nothing when closed', () => {
    const { container } = renderModal({ isOpen: false });
    expect(container).toBeEmptyDOMElement();
  });

  it('warns about what is lost without calling the API', () => {
    renderModal();
    expect(
      screen.getByText("You'll lose access to Plus features"),
    ).toBeInTheDocument();
    expect(screen.getByText('Sharing cleanup will occur')).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('Keep Plus and the close button close the modal without cancelling', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Keep Plus' }));
    fireEvent.click(screen.getByRole('button', { name: '×' }));
    expect(props.onClose).toHaveBeenCalledTimes(2);
    expect(props.onCancel).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  describe('confirming', () => {
    it('cleans up sharing, downgrades, resets the display mode, refreshes shares, then closes', async () => {
      respond();
      renderModal();
      confirm();

      await waitFor(() => expect(props.onCancel).toHaveBeenCalledTimes(1));
      expect(props.onClose).toHaveBeenCalledTimes(1);
      expect(urls()).toEqual([
        'POST /api/users/cancel-subscription-cleanup',
        'POST /api/upgrade-user',
        'PUT /api/users/me/preferences',
        'GET /api/shares?userId=auth0|me',
      ]);
      expect(window.alert).not.toHaveBeenCalled();
    });

    it('sends the signed-in user to the cleanup and downgrade endpoints', async () => {
      respond();
      renderModal();
      confirm();
      await waitFor(() => expect(props.onCancel).toHaveBeenCalled());

      expect(bodyOf('/api/users/cancel-subscription-cleanup')).toEqual({
        auth0Sub: 'auth0|me',
      });
      expect(bodyOf('/api/upgrade-user')).toEqual({
        auth0Sub: 'auth0|me',
        plan: 'free',
      });
    });

    it('turns Plus-only gamified mode back to professional', async () => {
      respond();
      renderModal();
      confirm();
      await waitFor(() => expect(props.onCancel).toHaveBeenCalled());

      expect(bodyOf('/api/users/me/preferences')).toMatchObject({
        displayMode: 'professional',
      });
      expect(store.getState().theme.settings.displayMode).toBe('professional');
    });

    it('moves the user to the free plan in the store', async () => {
      respond();
      renderModal();
      confirm();
      await waitFor(() => expect(props.onCancel).toHaveBeenCalled());

      expect(store.getState().user.user?.subscriptionPlan).toBe('free');
    });

    it('locks the modal and shows progress while it works', async () => {
      let release!: (v: unknown) => void;
      mockFetch.mockImplementation(
        () => new Promise(resolve => (release = resolve)),
      );
      renderModal();
      confirm();

      expect(
        await screen.findByRole('button', {
          name: 'Cleaning up shared holidays...',
        }),
      ).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Keep Plus' })).toBeDisabled();

      respond();
      await act(async () => release(reply({ success: true })));
      await waitFor(() => expect(props.onCancel).toHaveBeenCalled());
    });
  });

  describe('when something fails', () => {
    it('still downgrades if the sharing cleanup fails (it is not fatal)', async () => {
      respond({
        '/api/users/cancel-subscription-cleanup': () =>
          reply({ error: 'boom' }, false),
      });
      renderModal();
      confirm();

      await waitFor(() => expect(props.onCancel).toHaveBeenCalledTimes(1));
      expect(urls()).toContain('POST /api/upgrade-user');
      expect(window.alert).not.toHaveBeenCalled();
    });

    it('still finishes if resetting the display mode fails (it is not fatal)', async () => {
      respond({
        '/api/users/me/preferences': () => reply({ error: 'boom' }, false),
      });
      renderModal();
      confirm();
      await waitFor(() => expect(props.onCancel).toHaveBeenCalledTimes(1));
    });

    it('alerts and does not close when the downgrade fails', async () => {
      respond({ '/api/upgrade-user': () => reply({ error: 'Forbidden' }, false) });
      renderModal();
      confirm();

      await waitFor(() =>
        expect(window.alert).toHaveBeenCalledWith(
          'Cancellation failed: Forbidden. Please try again or contact support.',
        ),
      );
      expect(props.onCancel).not.toHaveBeenCalled();
      expect(props.onClose).not.toHaveBeenCalled();
      expect(store.getState().user.user?.subscriptionPlan).toBe('plus');
    });

    it('re-enables the buttons after a failure so the user can retry', async () => {
      respond({ '/api/upgrade-user': () => reply({ error: 'Forbidden' }, false) });
      renderModal();
      confirm();
      await waitFor(() => expect(window.alert).toHaveBeenCalled());

      expect(
        screen.getByRole('button', { name: 'Yes, Cancel Subscription' }),
      ).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Keep Plus' })).toBeEnabled();
    });

    it('does not call the API for a signed-out user', async () => {
      authValue = {};
      renderModal();
      confirm();

      await waitFor(() =>
        expect(window.alert).toHaveBeenCalledWith(
          'Cancellation failed: User not authenticated. Please try again or contact support.',
        ),
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('with Stripe turned on', () => {
    beforeEach(() => {
      provider = 'stripe';
    });

    it('sends the user to the Stripe billing portal and does nothing else itself', async () => {
      goToStripe.mockResolvedValue(undefined);
      renderModal();
      confirm();

      await waitFor(() =>
        expect(goToStripe).toHaveBeenCalledWith('/api/billing/portal'),
      );
      expect(mockFetch).not.toHaveBeenCalled();
      expect(props.onCancel).not.toHaveBeenCalled();
      expect(store.getState().user.user?.subscriptionPlan).toBe('plus');
    });

    it('alerts and stays open when the portal cannot be opened', async () => {
      goToStripe.mockRejectedValue(new Error('No active subscription'));
      renderModal();
      confirm();

      await waitFor(() =>
        expect(window.alert).toHaveBeenCalledWith(
          'Cancellation failed: No active subscription. Please try again or contact support.',
        ),
      );
      expect(props.onClose).not.toHaveBeenCalled();
    });
  });
});
