# CLAUDE.md

This file provides critical guidance to Claude Code (claude.ai/code) when working in this repository. All instructions here OVERRIDE default behavior and MUST be followed exactly.

## Project Overview

This is a **Supabase Authentication Starter App** built with Next.js, TypeScript, Tailwind CSS, and shadCN UI. The project serves as a foundational template for modern web applications requiring secure authentication with both email/password and OAuth (Google) support.

## Project Architecture

### Tech Stack
- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS, shadCN UI
- **Authentication**: NextAuth.js v5 with Supabase adapter
- **Database**: Supabase (PostgreSQL) with local development setup
- **Testing**: Jest + React Testing Library (unit), Playwright (e2e)
- **Development**: Docker for containerized development environment
- **Deployment**: Containerized with Docker

### Key Features
- Email/password authentication with verification
- Google OAuth integration
- Password reset functionality
- Protected routes and session management
- Responsive design with accessibility compliance
- Comprehensive test coverage (80% minimum)
- TDD development approach

## Specialized Agent System

This project uses a coordinated team of specialized agents. ALWAYS use the appropriate agent for specific tasks to ensure consistency and quality. Agents have been optimized for specific domains and include critical safety measures like process cleanup and port preservation:

### Core Agents

#### @agent-project-organizer
- **Role**: Project coordination and task management
- **Responsibilities**: Optimize task sequencing, monitor progress, manage dependencies, ensure quality standards
- **Use when**: Need to coordinate multiple agents, optimize workflow, or manage project timeline

#### @agent-project-setup-specialist  
- **Role**: Infrastructure and project initialization
- **Responsibilities**: Next.js setup, TypeScript config, Docker, testing frameworks, shadCN UI
- **Tasks**: 1.1-1.9 (Project Setup and Infrastructure)
- **Use when**: Starting new projects or configuring development environment

#### @agent-supabase-integration
- **Role**: Database and backend services specialist
- **Responsibilities**: Local Supabase setup, database schema, OAuth providers, migrations
- **Tasks**: 2.1-2.9 (Supabase Integration and Database Configuration)
- **Use when**: Setting up authentication backend or database operations

#### Authentication System Agent (see `agents/authentication-system-agent.md`)
- **Role**: Security and authentication logic specialist
- **Responsibilities**: NextAuth.js configuration, security features, session management
- **Tasks**: 3.1-3.11 (Authentication System Implementation)
- **Use when**: Implementing authentication flows or security features

#### @agent-ui-component-developer
- **Role**: Frontend component and user interface specialist  
- **Responsibilities**: React components, responsive design, forms, navigation, accessibility
- **Tasks**: 4.1-4.14 (User Interface and Components Development)
- **Use when**: Building UI components, forms, or frontend features

#### @agent-testing-specialist
- **Role**: Quality assurance and test implementation
- **Responsibilities**: Unit tests, integration tests, e2e tests, coverage reporting, process cleanup
- **Critical**: ALWAYS performs teardown - kills all background processes after testing
- **Tasks**: 5.1-5.14 (Testing Implementation and Documentation)
- **Use when**: Implementing tests or ensuring quality standards

#### @agent-deployment-devops-specialist
- **Role**: Deployment and DevOps specialist
- **Responsibilities**: Production deployments, CI/CD pipelines, containerization, cloud platforms, monitoring
- **Critical**: NEVER exposes secrets, ALWAYS validates configurations, implements proper rollback strategies
- **Tasks**: Environment setup, build optimization, deployment execution, monitoring setup
- **Use when**: Deploying to production, setting up CI/CD, configuring cloud infrastructure

## Agent Coordination Strategy

The agents work together following this optimized execution order:
1. **Foundation Phase**: Project Setup Specialist (infrastructure)
2. **Backend Phase**: Supabase Integration (database & auth setup)  
3. **Security Phase**: Authentication System Agent (NextAuth & security)
4. **Frontend Phase**: UI Component Developer (can run parallel with phase 3)
5. **Validation Phase**: Testing Specialist (runs continuously with TDD)
6. **Deployment Phase**: Deployment DevOps Specialist (production release)

**Key Principles**:
- Each agent builds upon the previous agents' work
- Agents MUST preserve existing configurations (especially ports)
- Agents MUST perform proper cleanup (kill processes, clean temp files)
- Agents should be invoked proactively when their expertise matches the task

## Development Commands

```bash
# Development environment
docker-compose up              # Start full development environment
npm run dev                   # Start Next.js development server
npm run build                 # Build production application

# Testing
npm test                      # Run unit tests with Jest
npm run test:watch           # Run tests in watch mode  
npm run test:e2e             # Run Playwright e2e tests
npm run test:coverage        # Generate test coverage report

# Database
npx supabase start           # Start local Supabase instance
npx supabase db reset        # Reset database with fresh migrations
npx supabase gen types       # Generate TypeScript types

# Code Quality
npm run lint                 # Run ESLint
npm run type-check          # Run TypeScript compiler check
```

## Project Structure

```
├── app/                     # Next.js App Router pages
├── components/              # Reusable UI components
│   ├── ui/                 # shadCN UI components
│   └── *.tsx               # Feature components with tests
├── lib/                    # Utility libraries
│   ├── supabase.ts        # Supabase client configuration
│   └── auth.ts            # NextAuth.js configuration
├── agents/                 # Agent documentation and configs
├── tasks/                  # PRD and task management
├── tests/                  # End-to-end tests
├── supabase/              # Database migrations and config
└── docker-compose.yml     # Development environment
```

## Task Management

- **PRD**: See `tasks/prd-supabase-auth-starter.md` for complete requirements
- **Tasks**: See `tasks/tasks-prd-supabase-auth-starter.md` for detailed implementation tasks  
- **Progress**: Use @agent-project-organizer to coordinate and track progress across all agents

## Development Workflow

1. **Planning**: Use @agent-project-organizer to optimize task sequence
2. **Implementation**: Invoke appropriate specialized agents based on task category
3. **Integration**: Ensure agents coordinate at defined integration points
4. **Testing**: @agent-testing-specialist validates all implementations
5. **Visual Verification**: Run screenshot tests after bug fixes
6. **Quality Gates**: Each phase requires sign-off before proceeding to next

## CRITICAL: Visual Testing After Bug Fixes

**⚠️ ALWAYS VERIFY BUG FIXES WITH VISUAL TESTING ⚠️**

After fixing any bugs, especially authentication or UI-related issues, you MUST:

### Automated Visual Testing Procedure

1. **Create a Playwright test script** that clicks through the fixed functionality
2. **Take screenshots at each critical step** of the user flow
3. **Save screenshots with descriptive names** indicating the test step
4. **Document the visual test results** in the bug log

### Implementation Steps

```typescript
// Example: Testing Google OAuth fix
import { test, expect } from '@playwright/test';

test('verify-google-oauth-fix', async ({ page }) => {
  // Step 1: Navigate to login
  await page.goto('https://localhost:3002/login');
  await page.screenshot({ path: 'screenshots/01-login-page.png' });
  
  // Step 2: Click Google sign-in
  await page.click('text=Sign in with Google');
  await page.screenshot({ path: 'screenshots/02-google-oauth-clicked.png' });
  
  // Step 3: Verify redirect or success
  await page.waitForURL(/dashboard|profile/);
  await page.screenshot({ path: 'screenshots/03-auth-success.png' });
});
```

### Required Screenshots for Common Fixes

#### Authentication Fixes:
- Login page load
- Form submission
- Error states (if any)
- Success redirect
- Dashboard/protected page access

#### Registration Fixes:
- Registration form
- Validation errors
- Success message
- Email verification notice

#### Password Reset Fixes:
- Reset request form
- Email sent confirmation
- Reset link page
- New password form
- Success confirmation

#### OAuth Fixes:
- OAuth button click
- Provider consent screen (if accessible)
- Callback handling
- Profile data display

### Visual Test Execution

```bash
# Run visual verification test
npx playwright test tests/visual-verification.spec.ts --headed

# Generate HTML report with screenshots
npx playwright show-report

# For specific bug fix verification
npx playwright test -g "verify-bug-fix-name" --screenshot=on
```

### Documentation Requirements

After running visual tests, update bug_log.md with:
- Screenshot file paths
- Description of what each screenshot verifies
- Any visual anomalies noticed
- Confirmation that the fix works end-to-end

### Example Bug Log Entry with Visual Testing

```markdown
### Bug Fix: Google OAuth Authentication
**Status**: ✅ RESOLVED
**Visual Verification**: Completed

Screenshots taken:
1. `screenshots/oauth-01-login.png` - Login page with Google button
2. `screenshots/oauth-02-consent.png` - Google consent screen
3. `screenshots/oauth-03-callback.png` - Successful callback
4. `screenshots/oauth-04-dashboard.png` - User logged in to dashboard

Visual test confirms:
- Google button is visible and clickable
- OAuth flow completes without errors
- User session is established correctly
- Protected routes are accessible post-login
```

## Important Notes

- Follow TDD principles throughout development
- Maintain 80% minimum test coverage  
- All authentication must comply with OWASP security guidelines
- Ensure WCAG 2.1 accessibility compliance
- Use TypeScript strict mode with proper typing
- Container-first development approach with Docker
- ALWAYS prefer editing existing files over creating new ones
- NEVER create documentation files unless explicitly requested
- ALWAYS use appropriate specialized agents for specific tasks

## CRITICAL: Port Management Rules

**⚠️ NEVER CHANGE ESTABLISHED PORTS ⚠️**

All agents must follow these strict port management rules:

1. **Never modify environment files** to change ports (NEXTAUTH_URL, APP_URL, etc.)
2. **Always check existing port configuration** before starting services
3. **Preserve OAuth callback URLs** - changing ports breaks Google Console configuration  
4. **Use existing dev server ports** - if dev server runs on port 3002, keep using 3002
5. **Document current port usage** but never change established configurations

**OAuth Integration Impact:**
- Current Google OAuth is configured for: `http://localhost:3002`
- Callback URL: `http://localhost:3002/api/auth/callback/google`
- Changing ports requires manual Google Console reconfiguration
- This creates unnecessary overhead and breaks existing OAuth setup

**Before Starting Any Services:**
```bash
# Check existing dev server port
BashOutput(existing_dev_server_id)
# Use the same port - never change environment files
```

## Best Practices & Common Pitfalls

### ✅ ALWAYS DO:
- Use TodoWrite tool to track multi-step tasks
- Check for existing background processes before starting new ones
- Kill all background processes after testing/development sessions
- Use specialized agents for their designated domains
- Preserve existing port configurations
- Edit existing files rather than creating new ones
- Check file existence before reading or editing

### ❌ NEVER DO:
- Change NEXTAUTH_URL or port configurations
- Leave background processes running after completion
- Create documentation files unless explicitly requested
- Modify OAuth callback URLs
- Use generic approaches when specialized agents exist
- Ignore process cleanup and teardown procedures
- Create duplicate functionality that already exists

### Process Management Best Practices:
1. **Before starting**: Check and kill stale processes
2. **During execution**: Monitor process health
3. **After completion**: ALWAYS terminate all started processes
4. **Use tools**: BashOutput for monitoring, KillBash for cleanup

### Error Handling:
- Always provide clear error messages with resolution steps
- Log all critical operations for debugging
- Handle JSON parsing errors gracefully
- Validate environment variables before use
- Check port availability before binding