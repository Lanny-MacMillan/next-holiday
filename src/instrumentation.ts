import { missingEnv } from '@/lib/env';

// Logs once at server start; /api/health reports the same list.
export function register() {
  const missing = missingEnv();
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
