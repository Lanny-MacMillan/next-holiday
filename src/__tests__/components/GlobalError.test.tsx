/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';

const captureException = jest.fn();
jest.mock('@sentry/nextjs', () => ({
  captureException: (e: unknown) => captureException(e),
}));

import GlobalError from '@/app/global-error';

describe('GlobalError', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    captureException.mockClear();
  });
  afterEach(() => jest.restoreAllMocks());

  it('reports the error and offers another try', () => {
    const error = new Error('boom');
    const reset = jest.fn();
    render(<GlobalError error={error} reset={reset} />);

    expect(captureException).toHaveBeenCalledWith(error);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
