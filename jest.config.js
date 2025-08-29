const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/types/**/*',
    // Exclude test utilities from coverage
    '!tests/**/*',
    // Include admin-specific files in coverage
    'src/**/admin/**/*.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}',
    // Include admin-specific unit tests
    '<rootDir>/src/**/admin/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/admin/**/*.(test|spec).{js,jsx,ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/',
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(next-auth|@auth/core|@supabase)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/tests/(.*)$': '<rootDir>/tests/$1',
    '^next-auth$': '<rootDir>/src/__mocks__/next-auth.js',
    '^next-auth/(.*)$': '<rootDir>/src/__mocks__/next-auth/$1.js',
    // Add path mappings for test utilities
    '^tests/fixtures/(.*)$': '<rootDir>/tests/fixtures/$1',
    '^tests/utils/(.*)$': '<rootDir>/tests/utils/$1',
    '^tests/mocks/(.*)$': '<rootDir>/tests/mocks/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // Global test setup and teardown
  globalSetup: '<rootDir>/tests/setup/globalSetup.js',
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.js',
  // Test environment configuration
  testTimeout: 30000, // Increase timeout for integration tests
  // Ensure tests run sequentially to avoid conflicts with shared mocked data
  maxWorkers: 1,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)