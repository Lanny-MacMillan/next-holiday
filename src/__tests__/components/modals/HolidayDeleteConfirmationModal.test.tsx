import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HolidayDeleteConfirmationModal from '@/components/modals/HolidayDeleteConfirmationModal';

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    user: { sub: 'auth0|123', email: 'test@example.com', name: 'Test User' },
  }),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const jsonResponse = (
  body: unknown,
  init: { ok?: boolean; statusText?: string } = {},
) =>
  ({
    ok: init.ok ?? true,
    statusText: init.statusText ?? 'OK',
    json: () => Promise.resolve(body),
  }) as Response;

describe('HolidayDeleteConfirmationModal', () => {
  const props = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    holidayName: 'Christmas',
    holidayId: 'holiday-123',
    accountId: 'account-456',
  };

  const input = () => screen.getByPlaceholderText('Type the holiday name here...');
  const deleteButton = () =>
    screen.getByRole('button', { name: /Delete Holiday|Deleting/ });
  const typeName = (value = 'Christmas') =>
    fireEvent.change(input(), { target: { value } });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when closed', () => {
      const { container } = render(
        <HolidayDeleteConfirmationModal {...props} isOpen={false} />,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('shows the warning and the exact name the user must type', () => {
      render(<HolidayDeleteConfirmationModal {...props} />);
      expect(
        screen.getByRole('heading', { name: /Delete Holiday/ }),
      ).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone')).toBeInTheDocument();
      expect(
        screen.getByText('Christmas', { selector: 'strong' }),
      ).toBeInTheDocument();
      expect(screen.getByText('"Christmas"')).toBeInTheDocument();
    });

    it('does not call the API just by opening', () => {
      render(<HolidayDeleteConfirmationModal {...props} />);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('confirmation gate', () => {
    it('keeps Delete disabled until the name matches exactly', () => {
      render(<HolidayDeleteConfirmationModal {...props} />);
      expect(deleteButton()).toBeDisabled();

      typeName('Christma');
      expect(deleteButton()).toBeDisabled();

      typeName('christmas'); // case-sensitive
      expect(deleteButton()).toBeDisabled();

      typeName('Christmas ');
      expect(deleteButton()).toBeDisabled();

      typeName('Christmas');
      expect(deleteButton()).toBeEnabled();
    });

    it('does not send a request while the name does not match', () => {
      render(<HolidayDeleteConfirmationModal {...props} />);
      typeName('wrong');
      fireEvent.click(deleteButton());
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('closing', () => {
    it('Cancel calls onClose', () => {
      render(<HolidayDeleteConfirmationModal {...props} />);
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(props.onClose).toHaveBeenCalledTimes(1);
      expect(props.onConfirm).not.toHaveBeenCalled();
    });

    it('the X button calls onClose', () => {
      render(<HolidayDeleteConfirmationModal {...props} />);
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]); // header close icon is the first button
      expect(props.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleting', () => {
    it('posts a real (non-dry-run) cascade delete for the holiday', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));
      render(<HolidayDeleteConfirmationModal {...props} />);
      typeName();
      fireEvent.click(deleteButton());

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('/api/holidays/holiday-123/delete-cascade');
      expect(init.method).toBe('POST');
      expect(init.headers['Content-Type']).toBe('application/json');
      expect(JSON.parse(init.body)).toEqual({ dryRun: false, force: false });
    });

    it('calls onConfirm then onClose on success', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));
      render(<HolidayDeleteConfirmationModal {...props} />);
      typeName();
      fireEvent.click(deleteButton());

      await waitFor(() => expect(props.onConfirm).toHaveBeenCalledTimes(1));
      expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it('shows "Deleting..." and locks the form while the request is in flight', async () => {
      let resolve!: (r: Response) => void;
      mockFetch.mockReturnValue(new Promise<Response>(r => (resolve = r)));
      render(<HolidayDeleteConfirmationModal {...props} />);
      typeName();
      fireEvent.click(deleteButton());

      await screen.findByText('Deleting...');
      expect(deleteButton()).toBeDisabled();
      expect(input()).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

      resolve(jsonResponse({ success: true }));
      await waitFor(() => expect(props.onConfirm).toHaveBeenCalled());
    });
  });

  describe('failures', () => {
    const attemptDelete = async () => {
      render(<HolidayDeleteConfirmationModal {...props} />);
      typeName();
      fireEvent.click(deleteButton());
    };

    it("shows the server's error message on a non-OK response", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse(
          { error: 'Access denied' },
          { ok: false, statusText: 'Forbidden' },
        ),
      );
      await attemptDelete();

      expect(await screen.findByText('Access denied')).toBeInTheDocument();
      expect(props.onConfirm).not.toHaveBeenCalled();
      expect(props.onClose).not.toHaveBeenCalled();
    });

    it('falls back to the status text when the error body has no message', async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({}, { ok: false, statusText: 'Bad Gateway' }),
      );
      await attemptDelete();
      expect(
        await screen.findByText('Failed to delete holiday: Bad Gateway'),
      ).toBeInTheDocument();
    });

    it('shows an error when the API replies OK but success is false', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: false, error: 'Nope' }));
      await attemptDelete();
      expect(await screen.findByText('Nope')).toBeInTheDocument();
      expect(props.onConfirm).not.toHaveBeenCalled();
    });

    it('uses a generic message when success is false with no error text', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: false }));
      await attemptDelete();
      expect(
        await screen.findByText('Failed to delete holiday'),
      ).toBeInTheDocument();
    });

    it('shows the message when the network request itself fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network down'));
      await attemptDelete();
      expect(await screen.findByText('Network down')).toBeInTheDocument();
    });

    it('re-enables the form after a failure so the user can retry', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ error: 'Boom' }, { ok: false }),
      );
      await attemptDelete();
      await screen.findByText('Boom');

      expect(deleteButton()).toBeEnabled();
      expect(input()).toBeEnabled();

      mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));
      fireEvent.click(deleteButton());
      await waitFor(() => expect(props.onConfirm).toHaveBeenCalledTimes(1));
    });

    it('clears a previous error when retrying', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ error: 'Boom' }, { ok: false }),
      );
      await attemptDelete();
      await screen.findByText('Boom');

      let resolve!: (r: Response) => void;
      mockFetch.mockReturnValueOnce(new Promise<Response>(r => (resolve = r)));
      fireEvent.click(deleteButton());
      await waitFor(() =>
        expect(screen.queryByText('Boom')).not.toBeInTheDocument(),
      );
      resolve(jsonResponse({ success: true }));
    });
  });
});
