import type { NextConfig } from 'next';
import { securityHeaders } from './src/lib/securityHeaders';

const nextConfig: NextConfig = {
  async headers() {
    return securityHeaders();
  },
};

export default nextConfig;
