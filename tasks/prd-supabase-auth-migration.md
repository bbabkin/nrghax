# Product Requirements Document: Migrate to Supabase Auth

## Introduction/Overview

This feature involves completely removing NextAuth.js from the application and replacing it with Supabase's built-in authentication system. The current NextAuth implementation has persistent session management issues, complexity with adapter configurations, and poor integration with Supabase. By using Supabase Auth exclusively, we'll have a simpler, more reliable authentication system that's fully integrated with our database.

## Goals

1. **Eliminate authentication complexity** by removing NextAuth and its dependencies
2. **Fix persistent session issues** including admin panel access redirect loops
3. **Implement reliable authentication** that works across HTTP (development) and HTTPS (production)
4. **Reduce authentication latency** for navbar and protected route rendering
5. **Establish a clean foundation** for future user management features

## User Stories

1. **As a regular user**, I want to sign up and log in using email/password or OAuth providers so that I can access my account reliably
2. **As a regular user**, I want my session to persist for a month so that I don't have to log in frequently
3. **As an admin user**, I want to access the admin panel without redirect loops so that I can manage the application
4. **As a super_admin**, I want to access all admin features including user management so that I can perform administrative tasks
5. **As a developer**, I want a simple authentication system so that I can easily maintain and extend it

## Functional Requirements

### Authentication Methods
1. The system must support email/password authentication with Supabase Auth
2. The system must support Google OAuth through Supabase
3. The system must support Discord OAuth through Supabase
4. The system must provide password reset functionality via email
5. The system must validate email addresses during registration

### Session Management
6. User sessions must persist for 30 days
7. Sessions must work across multiple browser tabs
8. The system must properly handle session expiration
9. The system must clear sessions on logout

### User Interface
10. The system must use Supabase's pre-built Auth UI components
11. The system must display appropriate error messages for auth failures
12. The system must show validation messages for form inputs
13. The navbar must quickly reflect authentication state changes

### Protected Routes
14. The system must protect `/admin/*` routes for admin/super_admin users only
15. The system must protect `/dashboard` for authenticated users
16. The system must allow public access to home page (`/`)
17. The system must redirect unauthenticated users to login when accessing protected routes

### Admin Access
18. The system must properly authenticate admin users without redirect loops
19. The system must verify user roles from Supabase database
20. The system must allow super_admin users to access `/admin/users`

### Data Migration
21. The system must clear all existing user data and sessions
22. The system must establish new user table structure in Supabase
23. The system must store user roles (user, admin, super_admin) in profiles table

### Security
24. The system must implement rate limiting for authentication attempts
25. The system must handle Supabase service outages gracefully
26. The system must work with both HTTP (localhost) and HTTPS configurations

### Cleanup
27. All NextAuth dependencies must be removed from package.json
28. All NextAuth configuration files must be deleted
29. All NextAuth API routes must be removed
30. All NextAuth imports and hooks must be replaced with Supabase equivalents

## Non-Goals (Out of Scope)

1. **Row Level Security (RLS)** - Will be implemented in a future iteration
2. **Refresh token rotation** - Not needed for initial implementation
3. **Additional OAuth providers** - Only Google and Discord for now
4. **User data preservation** - Existing users will be removed
5. **Custom auth UI** - Using Supabase pre-built components initially
6. **Social login linking** - Users can't link multiple auth methods yet
7. **Two-factor authentication** - Not included in this migration

## Design Considerations

- Use Supabase Auth UI for consistency and reduced development time
- Maintain similar visual styling to current forms where possible
- Keep error messages user-friendly and actionable
- Ensure loading states are visible during authentication operations
- Navigation bar should immediately reflect auth state changes

## Technical Considerations

### Dependencies to Remove
- `next-auth` and `@auth/supabase-adapter`
- All NextAuth type definitions
- NextAuth middleware configurations

### Dependencies to Add/Update
- `@supabase/auth-ui-react` for pre-built components
- `@supabase/auth-ui-shared` for theming
- Existing `@supabase/supabase-js` will handle auth

### Key Implementation Areas
1. Replace `useSession()` with `useUser()` from Supabase
2. Replace `auth()` server function with Supabase server client
3. Update all protected route middleware
4. Configure Supabase Auth settings for 30-day sessions
5. Set up OAuth providers in Supabase dashboard
6. Implement custom claims for user roles

### Environment Variables
- Remove: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- Keep: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Add OAuth redirect URLs for both HTTP and HTTPS

## Success Metrics

1. **Authentication works** - Users can sign up, log in, and log out without errors
2. **Admin access fixed** - Admin users can access `/admin` and `/admin/users` without redirect loops
3. **Session persistence** - Users remain logged in across page refreshes and browser tabs
4. **OAuth functional** - Google and Discord login work on both HTTP and HTTPS
5. **Performance improved** - Navbar auth state loads without noticeable delay
6. **Zero NextAuth traces** - All NextAuth code and dependencies completely removed
7. **Error handling** - Auth failures show clear error messages
8. **Rate limiting active** - Multiple failed login attempts are properly throttled

## Open Questions

1. Should we implement email verification for new signups immediately or in a follow-up?
2. Do you want audit logging for authentication events (login, logout, failed attempts)?
3. Should we add a "Remember me" checkbox even though sessions last 30 days by default?
4. Do you need any specific user profile fields beyond email and role?
5. Should we implement a user impersonation feature for super_admin users?
6. Do you want to customize the Supabase Auth UI theme to match the app's design system?
7. Should we add auth event webhooks for future integrations?