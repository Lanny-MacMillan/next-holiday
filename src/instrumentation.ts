import * as Sentry from '@sentry/nextjs';
import { missingEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

// Logs once at server start; /api/health reports the same list.
export async function register() {
  const missing = missingEnv();
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') await import('./sentry.server.config');
  if (process.env.NEXT_RUNTIME === 'edge') await import('./sentry.edge.config');
}

export const onRequestError = Sentry.captureRequestError;
