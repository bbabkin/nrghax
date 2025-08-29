/**
 * Global Jest setup for Admin User Management tests
 * Runs once before all tests start
 */

module.exports = async () => {
  console.log('🚀 Starting global test setup for Admin User Management')

  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.NEXTAUTH_URL = 'https://localhost:3002'
  process.env.TEST_MODE = 'true'
  process.env.MOCK_SUPABASE = 'true'
  process.env.MOCK_NEXTAUTH = 'true'
  process.env.DISABLE_RATE_LIMITING = 'true'
  process.env.DISABLE_EMAIL_SENDING = 'true'

  // Initialize test database if needed
  // This would typically involve:
  // - Starting test database container
  // - Running migrations
  // - Seeding initial data
  
  // For now, we're using mocked data, so no actual database setup required
  console.log('✅ Using mocked Supabase client for testing')

  // Set up global test utilities
  global.TEST_TIMEOUT = 30000
  global.MOCK_CURRENT_TIME = new Date('2024-01-28T12:00:00Z')

  console.log('✅ Global test setup completed')
}