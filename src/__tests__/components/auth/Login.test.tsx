/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import Login from '@/components/auth/Login';

const loginWithRedirect = jest.fn();
let authError: (Error & { error?: string; error_description?: string }) | undefined;
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({ loginWithRedirect, error: authError }),
}));

const unverified = () =>
  Object.assign(new Error('Please verify your email address before logging in.'), {
    error: 'access_denied',
    error_description: 'Please verify your email address before logging in.',
  });

beforeEach(() => {
  loginWithRedirect.mockReset();
  authError = undefined;
});

describe('Login', () => {
  it('shows the sign-in button and no dialog on a normal visit', () => {
    render(<Login />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(loginWithRedirect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('explains that the email must be verified when Auth0 sends the user back unverified', () => {
    authError = unverified();
    render(<Login />);

    expect(
      screen.getByRole('dialog', { name: 'Verify your email to continue' }),
    ).toBeTruthy();
  });

  it('lets the user sign in again once they have verified', () => {
    authError = unverified();
    render(<Login />);

    fireEvent.click(
      screen.getByRole('button', { name: /I've verified my email, sign in/ }),
    );
    expect(loginWithRedirect).toHaveBeenCalledTimes(1);
  });

  it('closes the dialog and clears the error from the address', () => {
    authError = unverified();
    window.history.replaceState({}, '', '/?error=access_denied&state=abc');
    render(<Login />);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(window.location.search).toBe('');
  });

  it.each([
    ['a different access_denied reason', 'access_denied', 'Unauthorized'],
    ['another kind of error', 'login_required', 'Login required'],
  ])('does not show the dialog for %s', (_label, error, description) => {
    authError = Object.assign(new Error(description), {
      error,
      error_description: description,
    });
    render(<Login />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does not show the dialog for an error without Auth0 details', () => {
    authError = new Error('Network down');
    render(<Login />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
