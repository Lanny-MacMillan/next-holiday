import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';
import { securityHeaders } from './src/lib/securityHeaders';

// The phase says whether this is `next dev`; NODE_ENV can be set to anything by the host.
export default function nextConfig(phase: string): NextConfig {
  return {
    async headers() {
      return securityHeaders(process.env, phase === PHASE_DEVELOPMENT_SERVER);
    },
  };
}
