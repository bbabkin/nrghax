# CLAUDE.md

This file provides guidance for Claude Code when working in this repository.

## Project Overview

Next.js application with Supabase for authentication and database.

### Tech Stack
- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS, shadCN UI
- **Backend**: Supabase (PostgreSQL database + authentication)
- **Testing**: Vitest (unit/integration), Playwright + Supawright (E2E), pgTAP (database)

## Development Commands

```bash
# Development
npm run dev                   # Start Next.js development server
npm run build                 # Build production application

# Database
npx supabase start           # Start local Supabase instance
npx supabase db reset        # Reset database with fresh migrations
npx supabase status          # Check if Supabase is running

# Testing
npm test                     # Run unit tests with Vitest
npm run test:coverage        # Run tests with coverage report
npx playwright test          # Run E2E tests
npx supabase test db         # Run database tests with pgTAP
npm run test:all             # Run all test suites
```

## Project Structure

```
├── src/
│   ├── app/                # Next.js App Router pages
│   ├── components/         # React components
│   └── lib/               # Utilities (Supabase client, etc.)
├── supabase/              # Database migrations and seed files
└── tests/                 # End-to-end tests
```

## Important Guidelines

### Authentication
- Use **Supabase Auth** consistently throughout the application
- Do NOT mix different authentication systems (no JWT in localStorage, no NextAuth)
- Supabase handles sessions via cookies automatically

### File Structure
- Check if project uses `/src/app/` or `/app/` before creating files
- Follow existing patterns in the codebase

### Best Practices
- Edit existing files rather than creating new ones when possible
- Use established npm packages instead of building custom solutions
- Test actual user flows, not just API responses

## Common Issues & Solutions

### Authentication Not Working
- Ensure Supabase is running: `npx supabase status`
- Check environment variables are set correctly
- Verify using Supabase Auth consistently (not mixing with JWT/localStorage)

### Routes Return 404
- Check for conflicting app directories: `ls -la app/ src/app/`
- Clear Next.js cache: `rm -rf .next`
- Restart dev server

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

## Testing Strategy

For comprehensive testing guidance, use the **Supabase Testing Expert Agent** at `tasks/supabase-testing-expert.md`. This agent provides:
- Complete testing infrastructure setup (pgTAP, Vitest, Playwright, Supawright)
- Database testing patterns with RLS policy validation
- Integration testing without mocks (real Supabase calls)
- E2E testing with automatic cleanup
- Security and performance testing patterns
- Test data management with factories and seed data
- CI/CD integration examples

## Best Practices

### Testing & Verification
- **ALWAYS run `npm run build` before claiming everything works** - Build must succeed without errors
- **Restart dev server after build** - The dev server doesn't work properly after running build command, restart it
- **Check TypeScript errors** - Run `npx tsc --noEmit` before saying code is error-free
- **Never assume code works** - Always verify with actual testing
- **Test in real environment** - Use actual localhost URLs, not theoretical ones
- **Capture evidence** - Take screenshots or logs to prove features work
- **Clean up after tests** - Kill all processes you start (dev servers, test runners)
- **Check for stale processes** - Run `ps aux | grep node` before starting new ones

### Development
- **One auth system only** - Supabase Auth everywhere, no mixing with JWT/localStorage
- **Preserve existing ports** - Never change ports (breaks OAuth callbacks)
- **Edit don't create** - Modify existing files rather than creating new ones
- **Use established packages** - Don't build custom solutions when npm packages exist

### Security
- **Never log secrets** - No passwords, tokens, or API keys in console/files
- **Validate environment** - Check env variables are set before using them
- **Sanitize user input** - Especially for authentication forms

### Problem Solving
- **Fix directly** - Don't overthink, just solve the immediate problem
- **Test empirically** - Click through the actual flow, don't just read code
- **Clear error messages** - Help users understand what went wrong
- restart dev server after build commands.