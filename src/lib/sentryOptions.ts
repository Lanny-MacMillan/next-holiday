import type { ErrorEvent } from '@sentry/nextjs';

const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-test-user'];

// Errors only: no tokens, cookies or user details leave the app.
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request?.headers) {
    for (const name of Object.keys(event.request.headers)) {
      if (SENSITIVE_HEADERS.includes(name.toLowerCase())) {
        delete event.request.headers[name];
      }
    }
  }
  if (event.request) delete event.request.cookies;
  delete event.user;
  return event;
}

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

export const sentryOptions = {
  dsn,
  enabled: !!dsn,
  tracesSampleRate: 0,
  sendDefaultPii: false,
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications.',
  ],
  beforeSend: scrubEvent,
};
