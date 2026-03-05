// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)', '**/*.test.(ts|tsx|js)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  // Mock Next.js modules that cause issues in tests
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^next/server$': '<rootDir>/jest-mocks/next-server.js',
  },
  // Transform TypeScript files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  // Disable Next.js auto-loading for tests
  transformIgnorePatterns: ['node_modules/(?!(next)/)'],
  // TypeScript configuration
  preset: 'ts-jest',
};

module.exports = customJestConfig;
