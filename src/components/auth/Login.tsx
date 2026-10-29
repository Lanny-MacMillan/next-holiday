'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';

const TRIED_KEY = 'verifyEmailTried';

// The sign-in redirect reloads the page, so a flag in sessionStorage is how the
// next visit knows the user already tried once.
function triedBefore() {
  try {
    return sessionStorage.getItem(TRIED_KEY) === '1';
  } catch {
    return false;
  }
}

function setTried(value: boolean) {
  try {
    if (value) sessionStorage.setItem(TRIED_KEY, '1');
    else sessionStorage.removeItem(TRIED_KEY);
  } catch {}
}

// Auth0 sends a new user back with this error until their email is verified.
function isUnverifiedEmail(error?: Error) {
  const { error: code, error_description: description } = (error ?? {}) as {
    error?: string;
    error_description?: string;
  };
  return code === 'access_denied' && /verify your email/i.test(description ?? '');
}

export default function Login() {
  const { loginWithRedirect, error } = useAuth0();
  const [dismissed, setDismissed] = useState(false);
  const showVerifyEmail = isUnverifiedEmail(error) && !dismissed;
  const [triedAlready] = useState(triedBefore);

  useEffect(() => {
    if (!isUnverifiedEmail(error)) setTried(false);
  }, [error]);

  const closeVerifyEmail = () => {
    setTried(false);
    window.history.replaceState({}, '', window.location.pathname);
    setDismissed(true);
  };

  const signInAfterVerifying = () => {
    setTried(true);
    loginWithRedirect();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Next Holiday
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6 sm:mb-8">
            Plan your holidays with ease and keep track of everything in one place.
          </p>

          <button
            onClick={() => loginWithRedirect()}
            className="w-full bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-600 transition-colors font-medium text-sm sm:text-base"
          >
            Sign In
          </button>

          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-4 sm:mt-6">
            Sign in to access your holiday planning dashboard
          </p>
        </div>
      </div>

      {showVerifyEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="verify-email-title"
            className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 text-center"
          >
            <h2
              id="verify-email-title"
              className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3"
            >
              Verify your email to continue
            </h2>
            {triedAlready && (
              <p
                role="alert"
                className="text-sm bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 rounded-lg p-3 mb-4"
              >
                We still haven&apos;t received your verification. Open the link in
                the email we sent, give it a moment, then try again.
              </p>
            )}
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-2">
              Your account is ready, but we need to confirm your email address first.
              We sent you a message with a verification link.
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6">
              Open it, then come back and sign in. If you can&apos;t find it, check
              your spam folder.
            </p>
            <button
              onClick={signInAfterVerifying}
              className="w-full bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-600 transition-colors font-medium text-sm sm:text-base"
            >
              {triedAlready
                ? 'Try signing in again'
                : "I've verified my email, sign in"}
            </button>
            <button
              onClick={closeVerifyEmail}
              className="w-full mt-3 px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
