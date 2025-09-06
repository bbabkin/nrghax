# Product Requirements Document: Supabase Next.js Auth Starter

## Introduction/Overview

The Supabase Next.js Auth Starter is a production-ready authentication template that demonstrates best practices for building secure, scalable applications with Supabase and Next.js. It provides developers with a complete authentication system including email/password, OAuth providers, profile management, and protected data access patterns. This starter serves as a foundation for real applications, showcasing both client-side and server-side authentication patterns with proper security implementations.

## Goals

1. Provide a production-ready authentication template that works immediately after environment setup
2. Demonstrate Supabase authentication best practices with Next.js App Router
3. Implement secure data access patterns with Row Level Security (RLS)
4. Create a beautiful, accessible UI using custom forms with shadcn/ui components
5. Showcase proper TypeScript integration with generated Supabase types
6. Enable developers to understand and extend the authentication system easily
7. Include comprehensive testing setup for authentication flows

## User Stories

1. **As a developer**, I want to clone this starter and have a working auth system with minimal setup so that I can focus on building my application features.

2. **As a developer**, I want to see examples of both server-side and client-side authentication so that I can implement protected features correctly.

3. **As an end user**, I want to sign up using email/password or my social accounts (Google/Discord) so that I can access the application quickly.

4. **As an end user**, I want to manage my profile including uploading a profile picture so that I can personalize my account.

5. **As a developer**, I want to see proper RLS implementation so that I can understand how to secure my database.

6. **As a developer**, I want TypeScript types generated from my database schema so that I have type safety throughout the application.

7. **As an end user**, I want my data to be secure and only accessible to me so that my privacy is protected.

## Functional Requirements

### 1. Authentication Core
1.1. The system must support email/password authentication
1.2. The system must support Google OAuth authentication
1.3. The system must support Discord OAuth authentication
1.4. The system must implement server-side authentication with middleware
1.5. The system must provide client-side authentication helpers
1.6. Sessions must persist across browser refreshes
1.7. The system must handle authentication errors gracefully with clear messages

### 2. User Registration & Login
2.1. The system must provide a combined auth page at `/auth` with tabs for login/signup
2.2. Registration must validate email format and password strength (min 6 characters)
2.3. Registration must create a user profile automatically
2.4. Social logins must create profiles on first authentication
2.5. The system must show loading states during authentication
2.6. Successful authentication must redirect to `/dashboard`

### 3. User Profile Management
3.1. The system must provide a profile page at `/account`
3.2. Users must be able to update their display name
3.3. Users must be able to upload a profile picture
3.4. Profile pictures must be stored in Supabase Storage
3.5. The system must show current profile picture or default avatar
3.6. Profile updates must be reflected immediately in the UI

### 4. Navigation & Layout
4.1. The navbar must show login/signup links when unauthenticated
4.2. The navbar must show user avatar and dropdown menu when authenticated
4.3. The dropdown must include links to Dashboard, Account, and Sign Out
4.4. The system must use a consistent layout across all pages
4.5. The UI must be responsive and work on mobile devices

### 5. Protected Routes
5.1. The `/dashboard` route must require authentication
5.2. The `/account` route must require authentication
5.3. Unauthenticated users must be redirected to `/auth` with return URL preserved
5.4. The middleware must check authentication on server-side
5.5. Protected API routes must validate session tokens

### 6. Database & Security
6.1. The system must create a `profiles` table linked to auth.users
6.2. RLS policies must ensure users can only read/update their own profile
6.3. The system must demonstrate fetching protected data
6.4. Database types must be generated from Supabase schema
6.5. All database queries must use the typed Supabase client

### 7. Homepage & Marketing
7.1. The public homepage must explain the starter features
7.2. The homepage must have clear CTAs to sign up or sign in
7.3. The homepage must be accessible without authentication
7.4. The homepage must showcase the tech stack used

### 8. Development Experience
8.1. The system must include `.env.example` with all required variables
8.2. The README must have step-by-step Supabase setup instructions
8.3. The system must include scripts for type generation
8.4. The system must differentiate between development and production configs
8.5. The system must include database migration files

## Non-Goals (Out of Scope)

This starter will NOT include:
- Complex authorization with multiple roles/permissions
- Email template customization beyond defaults
- Advanced RLS policies for team/organization structures
- Supabase Edge Functions
- Realtime subscriptions
- Payment integration
- Admin dashboard
- User management interface
- Password reset flow (uses Supabase defaults)
- Email verification customization
- Multi-factor authentication
- API key management

## Design Considerations

- **UI Components**: Custom forms using shadcn/ui components
- **Color Scheme**: Neutral grays with fuchsia as primary accent color
- **Layout**: Clean, modern design with consistent spacing
- **Typography**: Clear hierarchy with good readability
- **Forms**: Well-designed forms with proper validation feedback
- **Responsive**: Mobile-first approach with responsive breakpoints
- **Accessibility**: WCAG 2.1 AA compliance
- **Loading States**: Skeleton screens and spinners for async operations
- **Error States**: Clear, actionable error messages

## Technical Considerations

- **Framework**: Next.js 14+ with App Router
- **Authentication**: Supabase Auth with both SSR and CSR support
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Storage**: Supabase Storage for profile pictures
- **Styling**: Tailwind CSS with shadcn/ui components
- **Type Safety**: TypeScript with generated Supabase types
- **State Management**: React hooks and context for auth state
- **Middleware**: Next.js middleware for route protection
- **Environment**: Separate configs for development/production
- **Testing**: Playwright for E2E authentication tests

## Success Metrics

1. **Functional Completeness**
   - All three auth methods work without errors
   - Profile management functions correctly
   - RLS policies properly protect user data
   - File uploads work reliably

2. **Developer Experience**
   - Time from clone to running: < 10 minutes
   - Clear documentation with no ambiguity
   - Type safety with no TypeScript errors
   - Passing test suite

3. **Code Quality**
   - 80% test coverage for auth flows
   - No console errors or warnings
   - Consistent code style
   - Well-commented complex sections

4. **Performance**
   - Auth operations complete < 2 seconds
   - Page loads < 3 seconds
   - Optimized images and assets
   - Proper caching strategies

## Testing Requirements

1. **E2E Tests (Playwright)**
   - Email/password registration and login
   - OAuth flow testing (Google, Discord)
   - Profile update flow
   - Protected route access
   - Session persistence

2. **Seed Data**
   - Test user accounts for development
   - Sample profile data
   - Test images for profile pictures

3. **Test Coverage Areas**
   - Authentication flows
   - Authorization checks
   - Profile CRUD operations
   - File upload/storage

## Open Questions

1. Should we include a password strength indicator on the signup form?
2. Should OAuth users be able to set a password for email login?
3. What should be the maximum file size for profile pictures?
4. Should we implement user deletion/account closure?
5. Do we need to support custom Supabase project URLs or assume local development?
6. Should the dashboard show example data or just be a placeholder?
7. Should we include rate limiting on authentication endpoints?
8. Do we need dark mode support in the initial version?

---

## Implementation Notes

**Priority Order**:
1. Basic authentication (email/password)
2. OAuth providers (Google, Discord)
3. Profile management with RLS
4. Storage integration for pictures
5. Testing setup
6. Documentation

**Key Dependencies**:
- @supabase/supabase-js
- @supabase/ssr
- shadcn/ui components
- Tailwind CSS
- TypeScript
- Playwright

**Supabase Setup Requirements**:
- Authentication providers configuration
- Database tables and RLS policies
- Storage bucket for profile pictures
- SQL migrations for initial schema