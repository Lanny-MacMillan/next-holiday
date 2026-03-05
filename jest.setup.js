// Learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom');

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock environment variables
process.env.AUTH0_SECRET = 'test-secret';
process.env.AUTH0_BASE_URL = 'http://localhost:3000';
process.env.AUTH0_ISSUER_BASE_URL = 'https://test.auth0.com';
process.env.AUTH0_CLIENT_ID = 'test-client-id';
process.env.AUTH0_CLIENT_SECRET = 'test-client-secret';
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test';

// Global test utilities
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: jest.fn(),
};
