import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';
import { withSentryConfig } from '@sentry/nextjs/config';
import { securityHeaders } from './src/lib/securityHeaders';

// The phase says whether this is `next dev`; NODE_ENV can be set to anything by the host.
export default function nextConfig(phase: string): NextConfig {
  const config: NextConfig = {
    async headers() {
      return securityHeaders(process.env, phase === PHASE_DEVELOPMENT_SERVER);
    },
  };

  // Without a token the build is left exactly as it is: wrapping it would generate source
  // maps that nothing uploads or cleans up. With one, the maps are uploaded to Sentry for
  // readable stack traces and then deleted from the build, so they are never served.
  if (!process.env.SENTRY_AUTH_TOKEN) return config;

  return withSentryConfig(config, {
    org: process.env.SENTRY_ORG ?? 'next-holiday',
    project: process.env.SENTRY_PROJECT ?? 'javascript-nextjs',
    silent: !process.env.CI,
    telemetry: false,
    widenClientFileUpload: true,
    // A failed upload must never stop a deploy
    errorHandler: error =>
      console.warn('Sentry source map upload failed:', error.message),
  });
}
