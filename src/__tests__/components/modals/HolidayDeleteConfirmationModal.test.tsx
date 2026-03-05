import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HolidayDeleteConfirmationModal from '@/components/modals/HolidayDeleteConfirmationModal';

// Mock Auth0
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    user: {
      sub: 'auth0|123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
    },
  }),
}));

// Mock fetch
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('HolidayDeleteConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    holidayName: 'Christmas',
    holidayId: 'holiday-123',
    accountId: 'account-456',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const props = { ...defaultProps, isOpen: false };
    render(<HolidayDeleteConfirmationModal {...props} />);

    expect(screen.queryByText('Delete Holiday')).not.toBeInTheDocument();
  });

  it('should render modal when isOpen is true', () => {
    render(<HolidayDeleteConfirmationModal {...defaultProps} />);

    expect(screen.getByText('Delete Holiday')).toBeInTheDocument();
    expect(screen.getByText('Christmas')).toBeInTheDocument();
  });

  it('should show loading state while fetching impact data', async () => {
    // Mock a delayed fetch response
    mockFetch.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () =>
                  Promise.resolve({
                    success: true,
                    data: {
                      dryRun: true,
                      totals: { Holiday: 1, Task: 5, Gift: 3 },
                      holidayName: 'Christmas',
                    },
                  }),
              } as Response),
            100,
          ),
        ),
    );

    render(<HolidayDeleteConfirmationModal {...defaultProps} />);

    expect(screen.getByText('Loading impact data...')).toBeInTheDocument();
  });

  it('should display impact data after successful fetch', async () => {
    const mockImpactData = {
      success: true,
      data: {
        dryRun: true,
        totals: {
          Holiday: 1,
          Task: 5,
          Gift: 3,
          Card: 2,
          Budget: 1,
          Share: 1,
          GuestList: 4,
        },
        holidayName: 'Christmas',
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockImpactData),
    } as Response);

    render(<HolidayDeleteConfirmationModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Data to be deleted:')).toBeInTheDocument();
    });

    expect(screen.getByText('Tasks:')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Gifts:')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Total Records:')).toBeInTheDocument();
    expect(screen.getByText('17')).toBeInTheDocument(); // Sum of all counts
  });

  it('should show error message when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<HolidayDeleteConfirmationModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should show error message when API returns error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    render(<HolidayDeleteConfirmationModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch impact data/)).toBeInTheDocument();
    });
  });

  it('should require exact holiday name confirmation', () => {
    render(<HolidayDeleteConfirmationModal {...defaultProps} />);

    const confirmInput = screen.getByPlaceholderText(
      'Type the holiday name here...',
    );
    const deleteButton = screen.getByText('Delete Holiday');

    expect(deleteButton).toBeDisabled();

    // Type wrong name
    fireEvent.change(confirmInput, { target: { value: 'christmas' } });
    expect(deleteButton).toBeDisabled();

    // Type correct name
    fireEvent.change(confirmInput, { target: { value: 'Christmas' } });
    expect(deleteButton).toBeEnabled();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(<HolidayDeleteConfirmationModal {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should call onClose when X button is clicked', () => {
    render(<HolidayDeleteConfirmationModal {...defaultProps} />);

    const closeButton = screen.getByRole('button', { name: '' }); // X button
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should handle successful deletion', async () => {
    // Mock successful impact data fetch
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              dryRun: true,
              totals: { Holiday: 1, Task: 5 },
              holidayName: 'Christmas',
            },
          }),
      } as Response)
      // Mock successful deletion
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              dryRun: false,
              totals: { Holiday: 1, Task: 5 },
              holidayName: 'Christmas',
            },
          }),
      } as Response);

    render(<HolidayDeleteConfirmationModal {...defaultProps} />);

    // Wait for impact data to load
    await waitFor(() => {
      expect(screen.getByText('Data to be deleted:')).toBeInTheDocument();
    });

    // Type confirmation
    const confirmInput = screen.getByPlaceholderText(
      'Type the holiday name here...',
    );
    fireEvent.change(confirmInput, { target: { value: 'Christmas' } });

    // Click delete button
    const deleteButton = screen.getByText('Delete Holiday');
    fireEvent.click(deleteButton);

    // Should show loading state
    expect(screen.getByText('Deleting...')).toBeInTheDocument();

    // Wait for completion
    await waitFor(() => {
      expect(defaultProps.onConfirm).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('should handle deletion error', async () => {
    // Mock successful impact data fetch
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              dryRun: true,
              totals: { Holiday: 1, Task: 5 },
              holidayName: 'Christmas',
            },
          }),
      } as Response)
      // Mock deletion error
      .mockRejectedValueOnce(new Error('Deletion failed'));

    render(<HolidayDeleteConfirmationModal {...defaultProps} />);

    // Wait for impact data to load
    await waitFor(() => {
      expect(screen.getByText('Data to be deleted:')).toBeInTheDocument();
    });

    // Type confirmation
    const confirmInput = screen.getByPlaceholderText(
      'Type the holiday name here...',
    );
    fireEvent.change(confirmInput, { target: { value: 'Christmas' } });

    // Click delete button
    const deleteButton = screen.getByText('Delete Holiday');
    fireEvent.click(deleteButton);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Deletion failed')).toBeInTheDocument();
    });

    // Should not call onConfirm or onClose
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('should disable buttons during deletion', async () => {
    // Mock successful impact data fetch
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              dryRun: true,
              totals: { Holiday: 1, Task: 5 },
              holidayName: 'Christmas',
            },
          }),
      } as Response)
      // Mock delayed deletion response
      .mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve({
                      success: true,
                      data: {
                        dryRun: false,
                        totals: { Holiday: 1, Task: 5 },
                        holidayName: 'Christmas',
                      },
                    }),
                } as Response),
              100,
            ),
          ),
      );

    render(<HolidayDeleteConfirmationModal {...defaultProps} />);

    // Wait for impact data to load
    await waitFor(() => {
      expect(screen.getByText('Data to be deleted:')).toBeInTheDocument();
    });

    // Type confirmation
    const confirmInput = screen.getByPlaceholderText(
      'Type the holiday name here...',
    );
    fireEvent.change(confirmInput, { target: { value: 'Christmas' } });

    // Click delete button
    const deleteButton = screen.getByText('Delete Holiday');
    fireEvent.click(deleteButton);

    // Buttons should be disabled during deletion
    expect(deleteButton).toBeDisabled();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });

  it('should show retry button when fetch fails and allow retry', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<HolidayDeleteConfirmationModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();

    // Mock successful retry
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            dryRun: true,
            totals: { Holiday: 1, Task: 5 },
            holidayName: 'Christmas',
          },
        }),
    } as Response);

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Data to be deleted:')).toBeInTheDocument();
    });
  });
});
