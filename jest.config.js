// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)', '**/*.test.(ts|tsx|js)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/generated/**',
    '!src/**/__tests__/**',
  ],
  // Floor, just under today's numbers; raise it as coverage grows
  coverageThreshold: {
    global: { statements: 56, branches: 47, functions: 43, lines: 58 },
  },
  // Mock Next.js modules that cause issues in tests
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^next/server$': '<rootDir>/jest-mocks/next-server.js',
  },
  // Transform TypeScript files
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      // Transpile only: type safety is checked by `tsc`, not the test runner
      {
        tsconfig: '<rootDir>/tsconfig.jest.json',
        isolatedModules: true,
        diagnostics: false,
      },
    ],
  },
  // Disable Next.js auto-loading for tests
  transformIgnorePatterns: ['node_modules/(?!(next)/)'],
  // TypeScript configuration
  preset: 'ts-jest',
};

module.exports = customJestConfig;
