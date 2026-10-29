'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { useState } from 'react';

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

  const closeVerifyEmail = () => {
    window.history.replaceState({}, '', window.location.pathname);
    setDismissed(true);
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
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-2">
              Your account is ready, but we need to confirm your email address first.
              We sent you a message with a verification link.
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6">
              Open it, then come back and sign in. If you can&apos;t find it, check
              your spam folder.
            </p>
            <button
              onClick={() => loginWithRedirect()}
              className="w-full bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-600 transition-colors font-medium text-sm sm:text-base"
            >
              I&apos;ve verified my email, sign in
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
