# Product Requirements Document: Supabase Authentication Starter App

## Introduction/Overview

This PRD outlines the development of a foundational authentication application using Supabase, Next.js, and modern web technologies. The application serves as a starter template for future projects, providing a complete authentication system with email/password login, Google OAuth, and user management features. The app will be built using Test-Driven Development (TDD) principles to ensure reliability and maintainability.

**Problem Statement**: Developers frequently need to implement authentication systems from scratch, leading to repeated work and potential security vulnerabilities. This starter app provides a battle-tested foundation with modern authentication patterns.

**Goal**: Create a production-ready authentication starter application that can be easily extended for future projects.

## Goals

1. **Secure Authentication**: Implement robust email/password and Google OAuth authentication flows
2. **User Experience**: Provide intuitive registration, login, and logout experiences
3. **Code Quality**: Achieve high test coverage using TDD methodology
4. **Developer Experience**: Easy setup with Docker and clear documentation
5. **Extensibility**: Clean architecture that supports future feature additions
6. **Security**: Follow authentication best practices and security standards

## User Stories

### Authentication Flow
- **As a new user**, I want to register with email and password so that I can create an account
- **As a new user**, I want to receive an email verification so that my account is secure
- **As a returning user**, I want to log in with email and password so that I can access my account
- **As a user**, I want to log in with Google OAuth so that I can use my existing Google account
- **As a user**, I want to reset my password so that I can regain access if I forget it
- **As a logged-in user**, I want to see a personalized greeting so that I know I'm authenticated
- **As a logged-in user**, I want to log out from a user menu so that I can secure my session

### Navigation & Pages
- **As a visitor**, I want to see a home page with navigation so that I can understand the app
- **As a visitor**, I want to click a login button so that I can access authentication
- **As a logged-in user**, I want to access a dashboard so that I can see protected content
- **As a logged-in user**, I want to access a user menu so that I can manage my session

## Functional Requirements

### Authentication System
1. The system must support user registration with email and password
2. The system must send email verification during registration
3. The system must validate email format and password strength
4. The system must support login with verified email and password
5. The system must integrate Google OAuth using NextAuth.js
6. The system must support password reset functionality via email
7. The system must maintain user sessions securely
8. The system must provide secure logout functionality

### User Interface
9. The app must display a home page with navigation bar
10. The navbar must show a "Login" button when user is not authenticated
11. The app must provide login and registration forms with proper validation
12. The app must show loading states during authentication processes
13. The app must display appropriate error messages for failed authentication
14. The app must redirect authenticated users to a dashboard page
15. The dashboard must display a personalized greeting with user's name or email
16. The app must show a user menu dropdown in the top-right corner when authenticated
17. The user menu must include a logout option

### Technical Requirements
18. The app must be built with Next.js and TypeScript
19. The app must use Tailwind CSS for styling
20. The app must use shadCN UI components for consistent design
21. The app must integrate with Supabase for authentication and database
22. The app must use NextAuth.js for authentication management
23. The app must include comprehensive test coverage (unit, integration, e2e)
24. The app must be containerized with Docker for development
25. The app must use local Supabase instance for development

### Security Requirements
26. The system must hash passwords securely
27. The system must validate all user inputs
28. The system must protect routes that require authentication
29. The system must implement proper session management
30. The system must follow OWASP security guidelines

## Non-Goals (Out of Scope)

- User profile management or editing
- Advanced user roles and permissions
- Social login providers other than Google
- Multi-factor authentication (MFA)
- Advanced password policies beyond basic strength
- User avatar uploads
- Account deletion functionality
- Email preferences management
- API rate limiting
- Advanced analytics or tracking

## Design Considerations

### UI/UX Requirements
- **Component Library**: Use shadCN UI components for forms, buttons, and navigation
- **Styling**: Tailwind CSS for responsive design and consistent spacing
- **Forms**: Implement proper form validation with clear error states
- **Loading States**: Show spinners or skeleton loaders during authentication
- **Responsive Design**: Ensure mobile-first responsive design
- **Accessibility**: Follow WCAG guidelines for form accessibility

### Key Components Needed
- `LoginForm` - Email/password login with validation
- `RegisterForm` - User registration with email verification
- `PasswordResetForm` - Password reset request form
- `UserMenu` - Dropdown menu with logout option
- `ProtectedRoute` - HOC for authentication-required pages
- `Navbar` - Navigation with conditional login/user menu
- `Dashboard` - Protected dashboard with greeting

## Technical Considerations

### Architecture
- **Framework**: Next.js 14+ with App Router
- **Authentication**: NextAuth.js v5 with Supabase adapter
- **Database**: Supabase (PostgreSQL) with local development setup
- **State Management**: React Context for auth state or NextAuth session
- **Styling**: Tailwind CSS with shadCN UI component system
- **Testing**: Jest + React Testing Library + Playwright for e2e

### Dependencies
- Core: `next`, `react`, `typescript`
- Auth: `next-auth`, `@supabase/supabase-js`
- UI: `tailwindcss`, `@shadcn/ui`, `lucide-react`
- Testing: `jest`, `@testing-library/react`, `playwright`
- Development: `docker`, `docker-compose`

### Docker Setup
- Single container with Node.js, Next.js app, and Supabase local
- Hot reload for development
- Environment variable management
- Database migrations and seeding

### Database Schema
```sql
-- Users table (managed by Supabase Auth)
-- Additional user profile data if needed
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Success Metrics

### Functional Success
- **Authentication Flow**: 100% of login/logout/registration flows working correctly
- **OAuth Integration**: Google OAuth successfully authenticates users
- **Email Verification**: Registration emails sent and verified successfully
- **Password Reset**: Password reset emails sent and processed correctly
- **Session Management**: User sessions persist correctly across browser sessions

### Technical Success
- **Test Coverage**: Minimum 80% code coverage across unit and integration tests
- **Performance**: Page load times under 2 seconds on 3G connection
- **Security**: No authentication bypass vulnerabilities
- **Docker Setup**: One-command development environment setup
- **Code Quality**: TypeScript strict mode with zero errors

### User Experience Success
- **Form Validation**: Clear, helpful error messages for all validation scenarios
- **Loading States**: No blank screens during authentication processes
- **Responsive Design**: App works correctly on mobile, tablet, and desktop
- **Accessibility**: Forms navigable via keyboard and screen reader compatible

## Open Questions

1. **Email Templates**: Should we customize the email templates for verification and password reset, or use Supabase defaults? use defaults.
2. **Rate Limiting**: Should we implement client-side or server-side rate limiting for login attempts? server-side.
3. **Session Duration**: What should be the default session timeout duration? as long as possible.
4. **Error Logging**: Should we integrate with a service like Sentry for error tracking? provide free options.
5. **Environment Management**: Should we include staging environment setup in Docker? your call.
6. **Database Seeding**: Should we include test user data seeding for development? yes.

## Implementation Notes

### TDD Approach
1. Write failing tests for each authentication flow
2. Implement minimum code to pass tests
3. Refactor while keeping tests green
4. Focus on integration tests for auth flows
5. Include e2e tests for critical user journeys

### Development Phases
1. **Phase 1**: Project setup, Docker, and basic Next.js structure
2. **Phase 2**: Supabase integration and database setup
3. **Phase 3**: Email/password authentication with tests
4. **Phase 4**: Google OAuth integration
5. **Phase 5**: Password reset functionality
6. **Phase 6**: UI polish and responsive design
7. **Phase 7**: Comprehensive testing and documentation