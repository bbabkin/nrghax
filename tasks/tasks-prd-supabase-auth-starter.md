# Task List: Supabase Next.js Auth Starter

## Overview
Build a production-ready authentication starter using Supabase and Next.js that developers can clone and immediately use as a foundation for their applications. This includes email/password auth, OAuth (Google/Discord), profile management with image uploads, and proper security with RLS.

## Implementation Approach
- **Testing Strategy**: Mixed - TDD for auth logic and API routes, test-after for UI components
- **Priority Order**: Core auth first → OAuth → Profiles → Storage → Polish
- **Key Dependencies**: Supabase (local instance), Next.js 14+, shadcn/ui, Tailwind CSS

## User Stories
1. **Developer Quick Start**: Clone repo and have working auth in < 10 minutes
2. **Multiple Auth Methods**: Email/password and OAuth (Google, Discord) 
3. **Profile Management**: Users can update profile and upload pictures
4. **Secure by Default**: RLS policies protect all user data

## Relevant Files
### Implementation Files
- `src/app/layout.tsx` - Root layout with providers
- `src/app/page.tsx` - Public homepage
- `src/app/auth/page.tsx` - Combined login/signup page
- `src/app/dashboard/page.tsx` - Protected dashboard
- `src/app/account/page.tsx` - Profile management
- `src/lib/supabase/client.ts` - Browser client
- `src/lib/supabase/server.ts` - Server client (cookies)
- `src/middleware.ts` - Auth middleware for protected routes
- `src/components/auth/auth-form.tsx` - Login/signup form
- `src/components/auth/user-nav.tsx` - User dropdown menu

### Configuration Files
- `.env.local.example` - Environment variables template
- `supabase/migrations/` - Database schema
- `supabase/config.toml` - Local Supabase config

### Test Files
- `tests/e2e/auth.spec.ts` - Auth flow tests
- `tests/e2e/profile.spec.ts` - Profile management tests

## Tasks

### Phase 1: Setup & Configuration
- [ ] 1.1 Initialize Next.js project with TypeScript and Tailwind
  ```bash
  npx create-next-app@latest nrghax --typescript --tailwind --app
  ```
- [ ] 1.2 Install Supabase dependencies
  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  ```
- [ ] 1.3 Install shadcn/ui and setup components
  ```bash
  npx shadcn-ui@latest init
  npx shadcn-ui@latest add button card form input label tabs toast dropdown-menu avatar
  ```
- [ ] 1.4 Setup local Supabase project
  ```bash
  npx supabase init
  npx supabase start
  ```
- [ ] 1.5 Create environment variables file
  - Copy Supabase URL and anon key from `npx supabase status`
  - Create `.env.local` with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

### Phase 2: Core Authentication (Email/Password)
- [ ] 2.1 Create Supabase client utilities
  - [ ] 2.1.1 Browser client (`src/lib/supabase/client.ts`)
  - [ ] 2.1.2 Server client with cookie handling (`src/lib/supabase/server.ts`)
  - [ ] 2.1.3 Middleware client for route protection
- [ ] 2.2 Setup authentication middleware
  - [ ] 2.2.1 Create `src/middleware.ts` for protected routes
  - [ ] 2.2.2 Configure matcher for /dashboard and /account
  - [ ] 2.2.3 Handle redirects with return URL preservation
- [ ] 2.3 Build auth UI components
  - [ ] 2.3.1 Create auth form with tabs for login/signup
  - [ ] 2.3.2 Add email/password fields with validation
  - [ ] 2.3.3 Implement loading states and error handling
- [ ] 2.4 Implement auth routes
  - [ ] 2.4.1 Create `/auth` page with form
  - [ ] 2.4.2 Setup server actions for login/signup
  - [ ] 2.4.3 Handle success redirects to dashboard

### Phase 3: OAuth Integration
- [ ] 3.1 Configure OAuth providers in Supabase
  - [ ] 3.1.1 Setup Google OAuth in Supabase dashboard
  - [ ] 3.1.2 Setup Discord OAuth in Supabase dashboard
  - [ ] 3.1.3 Add redirect URLs for local development
- [ ] 3.2 Add OAuth buttons to auth form
  - [ ] 3.2.1 Create OAuth button components
  - [ ] 3.2.2 Implement OAuth sign-in handlers
  - [ ] 3.2.3 Handle OAuth callbacks
- [ ] 3.3 Create auth callback route
  - [ ] 3.3.1 Add `/auth/callback/route.ts` for OAuth returns
  - [ ] 3.3.2 Exchange code for session
  - [ ] 3.3.3 Redirect to intended destination

### Phase 4: User Profile & Database
- [ ] 4.1 Setup database schema
  - [ ] 4.1.1 Create profiles table migration
  ```sql
  create table profiles (
    id uuid references auth.users primary key,
    updated_at timestamp with time zone,
    username text unique,
    full_name text,
    avatar_url text
  );
  ```
  - [ ] 4.1.2 Create RLS policies for profiles
  - [ ] 4.1.3 Setup automatic profile creation trigger
- [ ] 4.2 Generate TypeScript types
  ```bash
  npx supabase gen types typescript --local > src/lib/database.types.ts
  ```
- [ ] 4.3 Build profile management page
  - [ ] 4.3.1 Create `/account` page with profile form
  - [ ] 4.3.2 Implement profile data fetching
  - [ ] 4.3.3 Add update profile server action

### Phase 5: Storage for Profile Pictures
- [ ] 5.1 Setup Supabase Storage
  - [ ] 5.1.1 Create avatars bucket
  - [ ] 5.1.2 Configure public access policies
  - [ ] 5.1.3 Set file size limits
- [ ] 5.2 Implement avatar upload
  - [ ] 5.2.1 Add file input to profile form
  - [ ] 5.2.2 Create upload handler
  - [ ] 5.2.3 Update avatar_url in profiles table
- [ ] 5.3 Display avatars
  - [ ] 5.3.1 Create Avatar component with fallback
  - [ ] 5.3.2 Add to user navigation dropdown
  - [ ] 5.3.3 Show on profile page

### Phase 6: Navigation & Layout
- [ ] 6.1 Create navigation component
  - [ ] 6.1.1 Build navbar with auth state detection
  - [ ] 6.1.2 Add login/signup links for guests
  - [ ] 6.1.3 Create user dropdown for authenticated users
- [ ] 6.2 Implement protected pages
  - [ ] 6.2.1 Create dashboard page with user data
  - [ ] 6.2.2 Add loading states for auth checks
  - [ ] 6.2.3 Handle unauthorized access
- [ ] 6.3 Build homepage
  - [ ] 6.3.1 Create marketing homepage
  - [ ] 6.3.2 Add feature list and tech stack
  - [ ] 6.3.3 Include CTAs to auth page

### Phase 7: Testing
- [ ] 7.1 Setup Playwright
  ```bash
  npm init playwright@latest
  ```
- [ ] 7.2 Write E2E tests
  - [ ] 7.2.1 Test email/password registration and login
  - [ ] 7.2.2 Test OAuth flows (if possible locally)
  - [ ] 7.2.3 Test profile updates
  - [ ] 7.2.4 Test protected route access
- [ ] 7.3 Add seed data
  - [ ] 7.3.1 Create seed script for test users
  - [ ] 7.3.2 Add sample profile data

### Phase 8: Polish & Documentation
- [ ] 8.1 UI improvements
  - [ ] 8.1.1 Add fuchsia accent color to theme
  - [ ] 8.1.2 Ensure responsive design works
  - [ ] 8.1.3 Add proper loading skeletons
- [ ] 8.2 Error handling
  - [ ] 8.2.1 Add toast notifications for actions
  - [ ] 8.2.2 Improve error messages
  - [ ] 8.2.3 Handle edge cases gracefully
- [ ] 8.3 Documentation
  - [ ] 8.3.1 Write comprehensive README
  - [ ] 8.3.2 Document environment setup
  - [ ] 8.3.3 Add deployment instructions
  - [ ] 8.3.4 Include troubleshooting guide

## Testing Notes

### When to Use TDD
- Authentication logic (login, signup, session management)
- RLS policies and database operations
- API routes and server actions

### When Testing After is Fine
- UI components (forms, buttons, navigation)
- Static pages (homepage, marketing)
- Third-party integrations (OAuth providers)

## Success Criteria
- All auth methods work seamlessly
- Profile management with image upload functions
- RLS policies protect user data
- Developer can clone and run in < 10 minutes
- Clean, modern UI with fuchsia accents
- Comprehensive documentation