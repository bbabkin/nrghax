const mockAuth = {
  handlers: { GET: jest.fn(), POST: jest.fn() },
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}

const NextAuth = jest.fn(() => mockAuth)

module.exports = { 
  default: NextAuth,
  NextAuth,
  ...mockAuth
}