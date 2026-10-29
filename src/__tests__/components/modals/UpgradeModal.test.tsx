/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import UpgradeModal from '@/components/modals/UpgradeModal';

let authValue: { user?: { sub: string } };
jest.mock('@auth0/auth0-react', () => ({ useAuth0: () => authValue }));

const mockFetch = jest.fn();
const calls = (url: string) => mockFetch.mock.calls.filter(c => c[0] === url);
const bodyOf = (call: unknown[]) => JSON.parse((call[1] as { body: string }).body);

const reply = (body: unknown, ok = true) => ({
  ok,
  status: ok ? 200 : 400,
  json: async () => body,
});
const respond = (handlers: Record<string, () => unknown>) =>
  mockFetch.mockImplementation(
    async (url: string) => handlers[url]?.() ?? reply({}, false),
  );

const happyPath = {
  '/api/payment': () => reply({ success: true }),
  '/api/upgrade-user': () => reply({ user: { id: 'u1', subscriptionPlan: 'plus' } }),
};

const props = { isOpen: true, onClose: jest.fn(), onUpgrade: jest.fn() };
const renderModal = (over: Partial<typeof props> = {}) =>
  render(
    <Provider store={store}>
      <UpgradeModal {...props} {...over} />
    </Provider>,
  );

const goToPayment = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Upgrade Now' }));
const typeName = (name = 'Ada Lovelace') =>
  fireEvent.change(screen.getByPlaceholderText('John Doe'), {
    target: { value: name },
  });
const submitButton = () =>
  screen.getByRole('button', { name: /Test Upgrade|Submit Payment|Processing/ });
const toggleTestMode = () =>
  fireEvent.click(
    screen
      .getByText('Test Mode')
      .parentElement!.parentElement!.querySelector('button')!,
  );

beforeEach(() => {
  jest.clearAllMocks();
  authValue = { user: { sub: 'auth0|me' } };
  global.fetch = mockFetch as unknown as typeof fetch;
  jest.spyOn(window, 'alert').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('UpgradeModal', () => {
  describe('navigation', () => {
    it('renders nothing when closed', () => {
      const { container } = renderModal({ isOpen: false });
      expect(container).toBeEmptyDOMElement();
    });

    it('starts on the features page without calling the API', () => {
      renderModal();
      expect(screen.getByText('What you get with Plus:')).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('Upgrade Now opens the payment form and Back returns to the features', () => {
      renderModal();
      goToPayment();
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      expect(screen.getByText('What you get with Plus:')).toBeInTheDocument();
    });

    it('says on the payment step that this is a demo and nothing is charged', () => {
      renderModal();
      expect(screen.queryByText(/Demo only/)).not.toBeInTheDocument();

      goToPayment();
      expect(screen.getByRole('note')).toHaveTextContent(
        'Demo only. No payment is taken and nothing is charged. Please do not enter real card details.',
      );
    });

    it('Cancel closes the modal', () => {
      renderModal();
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it('forgets what was typed when going Back', () => {
      renderModal();
      goToPayment();
      typeName('Ada');
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      goToPayment();
      expect(screen.getByPlaceholderText('John Doe')).toHaveValue('');
    });
  });

  describe('test mode (default)', () => {
    it('only needs a cardholder name', () => {
      renderModal();
      goToPayment();
      expect(submitButton()).toBeDisabled();
      typeName('   ');
      expect(submitButton()).toBeDisabled();
      typeName();
      expect(submitButton()).toBeEnabled();
      expect(submitButton()).toHaveTextContent('Test Upgrade (No Charge)');
    });

    it('sends the fixed test card, then upgrades the signed-in user to plus', async () => {
      respond(happyPath);
      renderModal();
      goToPayment();
      typeName();
      fireEvent.click(submitButton());

      await waitFor(() => expect(props.onUpgrade).toHaveBeenCalledTimes(1));

      const [payment] = calls('/api/payment');
      expect((payment[1] as { method: string }).method).toBe('POST');
      expect(bodyOf(payment)).toEqual({
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Ada Lovelace',
        amount: 299,
      });

      const [upgrade] = calls('/api/upgrade-user');
      expect(bodyOf(upgrade)).toEqual({ auth0Sub: 'auth0|me', plan: 'plus' });
      expect(props.onClose).toHaveBeenCalledTimes(1);
      expect(window.alert).not.toHaveBeenCalled();
    });

    it('makes the plan update only after the payment call', async () => {
      respond(happyPath);
      renderModal();
      goToPayment();
      typeName();
      fireEvent.click(submitButton());
      await waitFor(() => expect(props.onUpgrade).toHaveBeenCalled());

      const order = mockFetch.mock.calls.map(c => c[0]);
      expect(order).toEqual(['/api/payment', '/api/upgrade-user']);
    });

    it('shows Processing... and locks the buttons while the payment is in flight', async () => {
      let release!: (v: unknown) => void;
      mockFetch.mockImplementation(
        () => new Promise(resolve => (release = resolve)),
      );
      renderModal();
      goToPayment();
      typeName();
      fireEvent.click(submitButton());

      expect(
        await screen.findByRole('button', { name: 'Processing...' }),
      ).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();

      await act(async () =>
        release(reply({ success: false, error: 'declined' }, false)),
      );
    });
  });

  describe('failures', () => {
    const attempt = async () => {
      renderModal();
      goToPayment();
      typeName();
      fireEvent.click(submitButton());
    };

    it("alerts with the server's reason when the payment is refused, and does not upgrade", async () => {
      respond({
        '/api/payment': () =>
          reply({ success: false, error: 'Card declined' }, false),
      });
      await attempt();

      await waitFor(() =>
        expect(window.alert).toHaveBeenCalledWith(
          'Payment failed: Card declined. Please try again.',
        ),
      );
      expect(calls('/api/upgrade-user')).toHaveLength(0);
      expect(props.onUpgrade).not.toHaveBeenCalled();
      expect(props.onClose).not.toHaveBeenCalled();
    });

    it('alerts with a generic reason when the payment fails without one', async () => {
      respond({ '/api/payment': () => reply({ success: false }) });
      await attempt();
      await waitFor(() =>
        expect(window.alert).toHaveBeenCalledWith(
          'Payment failed: Payment failed. Please try again.',
        ),
      );
    });

    it('says the payment went through when only the plan update fails', async () => {
      respond({
        '/api/payment': () => reply({ success: true }),
        '/api/upgrade-user': () => reply({ error: 'Forbidden' }, false),
      });
      await attempt();

      await waitFor(() =>
        expect(window.alert).toHaveBeenCalledWith(
          "Your payment went through, but we couldn't upgrade your plan: Forbidden. Please contact support.",
        ),
      );
      expect(calls('/api/payment')).toHaveLength(1);
      expect(props.onUpgrade).not.toHaveBeenCalled();
      expect(props.onClose).not.toHaveBeenCalled();
    });

    it('alerts when the network request itself fails, and re-enables the form', async () => {
      mockFetch.mockRejectedValue(new Error('Network down'));
      await attempt();
      await waitFor(() =>
        expect(window.alert).toHaveBeenCalledWith(
          'Payment failed: Network down. Please try again.',
        ),
      );
      expect(submitButton()).toBeEnabled();
    });

    it('does not call the API for a signed-out user', async () => {
      authValue = {};
      await attempt();
      await waitFor(() =>
        expect(window.alert).toHaveBeenCalledWith(
          'Payment failed: User not authenticated. Please try again.',
        ),
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('with test mode switched off', () => {
    const fill = (
      card: string,
      expiry: string,
      cvv: string,
      name = 'Ada Lovelace',
    ) => {
      fireEvent.change(screen.getByPlaceholderText('1234 5678 9012 3456'), {
        target: { value: card },
      });
      fireEvent.change(screen.getByPlaceholderText('MM/YY'), {
        target: { value: expiry },
      });
      fireEvent.change(screen.getByPlaceholderText('123'), {
        target: { value: cvv },
      });
      typeName(name);
    };

    beforeEach(() => {
      renderModal();
      goToPayment();
      toggleTestMode();
    });

    it('asks for the full card and offers a Submit Payment button', () => {
      expect(submitButton()).toHaveTextContent('Submit Payment');
      expect(submitButton()).toBeDisabled();
      expect(screen.getByPlaceholderText('1234 5678 9012 3456')).toBeEnabled();
    });

    it('stays disabled until the card, expiry, CVV and name are all valid', () => {
      fill('4111 1111 1111 1111', '12/30', '12');
      expect(submitButton()).toBeDisabled();
      fill('4111 1111 1111 1111', '12/30', '123');
      expect(submitButton()).toBeEnabled();
      fill('4111 1111 1111 1111', '1230', '123');
      expect(submitButton()).toBeEnabled();
      fill('4111', '12/30', '123');
      expect(submitButton()).toBeDisabled();
    });

    it('formats the card number and expiry as they are typed', () => {
      fill('4111111111111111', '1230', '123');
      expect(screen.getByPlaceholderText('1234 5678 9012 3456')).toHaveValue(
        '4111 1111 1111 1111',
      );
      expect(screen.getByPlaceholderText('MM/YY')).toHaveValue('12/30');
    });

    it('sends the typed card with the spaces removed', async () => {
      respond(happyPath);
      fill('4242424242424242', '0128', '999', 'Grace Hopper');
      fireEvent.click(submitButton());
      await waitFor(() => expect(props.onUpgrade).toHaveBeenCalled());

      expect(bodyOf(calls('/api/payment')[0])).toEqual({
        cardNumber: '4242424242424242',
        expiryDate: '01/28',
        cvv: '999',
        cardholderName: 'Grace Hopper',
        amount: 299,
      });
    });
  });
});
