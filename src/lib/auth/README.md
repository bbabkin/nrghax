# Authentication System Documentation

This comprehensive authentication system provides secure, production-ready authentication for Next.js applications using NextAuth.js v5, Supabase, and TypeScript.

## Features

- **Multiple Authentication Methods**
  - Email/password authentication with secure password hashing
  - Google OAuth integration
  - Session-based authentication with JWT

- **Security Features**
  - OWASP-compliant password requirements
  - Rate limiting with progressive blocking
  - CSRF protection
  - Secure cookie configuration
  - Input validation and sanitization

- **User Management**
  - User registration with email verification
  - Password reset functionality
  - Password change for authenticated users
  - Account verification workflows

- **Developer Experience**
  - TypeScript-first with comprehensive type definitions
  - Server-side and client-side utilities
  - Middleware for route protection
  - Centralized error handling

## Quick Start

### 1. Environment Setup

Create a `.env.local` file with the required environment variables:

```bash
# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-nextauth-secret-key-min-32-chars

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/supabase_auth_dev

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Application Configuration
APP_URL=http://localhost:3000
```

### 2. Database Setup

Run the Supabase migrations to set up the required database tables:

```bash
npx supabase db reset
```

### 3. Basic Usage

#### Server Components

```typescript
import { requireAuth, getExtendedSession } from '@/lib/auth'

export default async function ProtectedPage() {
  // Require authentication and redirect if not logged in
  const session = await requireAuth()
  
  // Or get session with user profile data
  const extendedSession = await getExtendedSession()
  
  return (
    <div>
      <h1>Welcome, {session.user.email}!</h1>
    </div>
  )
}
```

#### API Routes

```typescript
import { withAuth, validateApiSession } from '@/lib/auth'

// Protect entire API route
export const GET = withAuth(async (session, request) => {
  return Response.json({ 
    message: `Hello, ${session.user.email}!` 
  })
})

// Manual session validation
export async function POST(request: Request) {
  try {
    const session = await validateApiSession()
    // Handle authenticated request
  } catch (error) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

#### Client Components

```typescript
'use client'

import { signIn, signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'

export function AuthButton() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <div>Loading...</div>
  
  if (session) {
    return (
      <button onClick={() => signOut()}>
        Sign out {session.user.email}
      </button>
    )
  }
  
  return (
    <button onClick={() => signIn()}>
      Sign in
    </button>
  )
}
```

## API Endpoints

The authentication system provides the following API endpoints:

### NextAuth.js Endpoints
- `GET/POST /api/auth/*` - NextAuth.js handlers (signin, callback, etc.)

### Custom Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/reset-password` - Password reset request/execution
- `POST /api/auth/change-password` - Change password for authenticated users
- `GET/POST /api/auth/verify-email` - Email verification
- `POST /api/auth/logout` - Secure logout

### API Usage Examples

#### User Registration
```typescript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePassword123!',
    name: 'John Doe',
    confirmPassword: 'SecurePassword123!'
  })
})
```

#### Password Reset Request
```typescript
const response = await fetch('/api/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'request',
    email: 'user@example.com'
  })
})
```

#### Password Reset Execution
```typescript
const response = await fetch('/api/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'reset',
    token: 'reset-token-from-email',
    password: 'NewSecurePassword123!',
    confirmPassword: 'NewSecurePassword123!'
  })
})
```

## Security Features

### Rate Limiting

The system implements comprehensive rate limiting with progressive blocking:

- **Login**: 5 attempts per 15 minutes
- **Registration**: 3 attempts per 15 minutes  
- **Password Reset**: 3 attempts per 15 minutes
- **Email Verification**: 5 attempts per 15 minutes
- **Change Password**: 3 attempts per 5 minutes

Progressive blocking increases block duration for repeated violations:
1. First violation: 5 minutes
2. Second violation: 30 minutes
3. Third violation: 2 hours
4. Subsequent violations: 24 hours

### Password Requirements

Passwords must meet the following criteria:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Session Security

- HTTP-only cookies
- Secure cookies in production
- SameSite protection
- CSRF token validation
- 24-hour session expiration
- 1-hour session refresh window

## Middleware Configuration

The authentication middleware protects routes automatically:

```typescript
// middleware.ts
import { auth } from '@/lib/auth'

export default auth((req) => {
  // Middleware logic is handled automatically
  // Protected routes: /dashboard, /profile, /settings
  // Auth routes: /login, /register (redirect if authenticated)
})
```

### Route Protection

- **Protected routes** require authentication and redirect to `/login`
- **Auth routes** redirect authenticated users to `/dashboard`
- **Public API routes** allow unauthenticated access
- **Protected API routes** return 401 for unauthenticated requests

## Error Handling

The system provides comprehensive error handling with user-friendly messages:

```typescript
import { getAuthErrorMessage, AUTH_ERRORS } from '@/lib/auth'

// Get user-friendly error message
const message = getAuthErrorMessage(AUTH_ERRORS.INVALID_CREDENTIALS)
// Returns: "Invalid email or password. Please try again."
```

### Common Error Codes
- `INVALID_CREDENTIALS` - Invalid login credentials
- `USER_NOT_FOUND` - User account not found
- `USER_ALREADY_EXISTS` - Email already registered
- `RATE_LIMIT_EXCEEDED` - Too many attempts
- `TOKEN_EXPIRED` - Verification/reset token expired

## Email Verification

The system supports email verification for new accounts:

1. User registers with email/password
2. Verification email sent with secure token
3. User clicks verification link
4. Email marked as verified in database

### Email Templates

Email templates should be customized for production use. The system currently logs verification links to console in development mode.

## Google OAuth Setup

1. Create a Google Cloud Console project
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

## Database Schema

The system uses a `user_profiles` table with the following structure:

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  verification_token_expires_at TIMESTAMPTZ,
  reset_token TEXT,
  reset_token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Performance Considerations

### Rate Limiting Storage

The current implementation uses in-memory storage for rate limiting. For production deployments with multiple server instances, consider using Redis:

```typescript
// Redis rate limiting implementation
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Implement Redis-based rate limiting
// See documentation for Redis adapter examples
```

### Session Storage

NextAuth.js uses JWT tokens by default. For high-traffic applications, consider database session storage:

```typescript
// In auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: SupabaseAdapter({
    url: supabaseUrl,
    secret: supabaseServiceRoleKey,
  }),
  
  session: {
    strategy: "database", // Use database sessions
    maxAge: 24 * 60 * 60, // 24 hours
  },
  
  // ... rest of configuration
})
```

## Testing

The authentication system includes comprehensive test coverage:

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run e2e tests
npm run test:e2e
```

### Test Examples

```typescript
import { registerUser } from '@/lib/auth-utils'

describe('User Registration', () => {
  it('should register a new user successfully', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      name: 'Test User'
    }
    
    const result = await registerUser(userData)
    
    expect(result.success).toBe(true)
    expect(result.user).toBeDefined()
  })
})
```

## Deployment

### Environment Variables

Ensure all production environment variables are properly set:

- Use strong, unique values for `NEXTAUTH_SECRET`
- Configure proper OAuth redirect URLs
- Use production Supabase credentials
- Set up SMTP for email delivery

### Security Headers

Configure security headers in your deployment:

```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}
```

### HTTPS

Always use HTTPS in production. The authentication system sets secure cookies automatically based on the `NODE_ENV` variable.

## Troubleshooting

### Common Issues

1. **Session not persisting**
   - Check `NEXTAUTH_SECRET` is set
   - Verify cookies are not being blocked
   - Ensure correct domain configuration

2. **Rate limiting too restrictive**
   - Adjust rate limits in `RATE_LIMITS` configuration
   - Add IP addresses to whitelist for testing

3. **Email verification not working**
   - Check SMTP configuration
   - Verify email templates are properly configured
   - Check spam folders

4. **OAuth callback errors**
   - Verify OAuth provider configuration
   - Check authorized redirect URIs
   - Ensure correct client ID/secret

### Debug Mode

Enable debug mode in development:

```typescript
// In auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  // ... configuration
  
  debug: process.env.NODE_ENV === "development",
})
```

## Contributing

When contributing to the authentication system:

1. Maintain backward compatibility
2. Add comprehensive tests for new features
3. Update type definitions
4. Follow security best practices
5. Update documentation

## License

This authentication system is part of the Supabase Authentication Starter and follows the project's license terms.