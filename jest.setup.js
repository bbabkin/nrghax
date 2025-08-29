// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js router
import { jest } from '@jest/globals'

jest.mock('next/router', () => require('next-router-mock'))

// Mock Next.js navigation
jest.mock('next/navigation', () => require('next-router-mock'))

// Mock next-auth/react
jest.mock('next-auth', () => ({
  NextAuth: jest.fn(() => ({
    handlers: { GET: jest.fn(), POST: jest.fn() },
    auth: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  })),
}))

// Mock environment variables for tests
process.env.NEXTAUTH_URL = 'https://localhost:3002'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.NODE_ENV = 'test'
process.env.TEST_MODE = 'true'
process.env.MOCK_SUPABASE = 'true'

// Mock Supabase for admin tests
jest.mock('@/lib/supabase', () => {
  if (process.env.MOCK_SUPABASE === 'true') {
    return require('../tests/mocks/supabase-admin').default
  }
  return jest.requireActual('@/lib/supabase')
})

// Set up test data cleanup between tests
beforeEach(() => {
  // Reset mock Supabase data before each test
  if (process.env.MOCK_SUPABASE === 'true') {
    try {
      const mockSupabase = require('../tests/mocks/supabase-admin').default
      if (mockSupabase.__resetMockData) {
        mockSupabase.__resetMockData()
      }
    } catch (error) {
      // Mock not available yet, ignore
    }
  }

  // Reset all mocks before each test
  jest.clearAllMocks()
})

afterEach(() => {
  // Clean up any test-specific state
  jest.resetModules()
})

// Global test utilities
global.mockCurrentTime = (date) => {
  const mockDate = new Date(date)
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate)
  return mockDate
}

global.restoreCurrentTime = () => {
  global.Date.mockRestore?.()
}

// Suppress console warnings in tests unless LOG_LEVEL is debug
const originalWarn = console.warn
console.warn = (...args) => {
  if (process.env.LOG_LEVEL === 'debug') {
    originalWarn(...args)
  }
}

// Suppress console errors for expected test failures
const originalError = console.error
console.error = (...args) => {
  if (process.env.LOG_LEVEL === 'debug') {
    originalError(...args)
  }
}