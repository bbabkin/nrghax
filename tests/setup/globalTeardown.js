/**
 * Global Jest teardown for Admin User Management tests
 * Runs once after all tests complete
 */

module.exports = async () => {
  console.log('🧹 Starting global test teardown for Admin User Management')

  // Clean up test database if needed
  // This would typically involve:
  // - Removing test data
  // - Closing database connections
  // - Stopping test database container

  // Clean up any global test state
  delete global.TEST_TIMEOUT
  delete global.MOCK_CURRENT_TIME

  // Reset environment variables
  delete process.env.TEST_MODE
  delete process.env.MOCK_SUPABASE
  delete process.env.MOCK_NEXTAUTH
  delete process.env.DISABLE_RATE_LIMITING
  delete process.env.DISABLE_EMAIL_SENDING

  console.log('✅ Global test teardown completed')
}