# NRGHax Development Guidelines

## 🚀 Core Architecture

This project uses **Supabase** for the complete backend stack:
- **Database**: PostgreSQL with Supabase
- **Auth**: Supabase Auth (replacing Auth.js)
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage for images/files

## 📁 Project Structure

```
├── app/                     # Next.js 15.3 App Router
│   ├── (auth)/             # Auth routes (signin, signup)
│   ├── (dashboard)/        # Protected user routes
│   ├── (admin)/           # Admin-only routes
│   └── api/               # API endpoints
├── components/
│   ├── ui/                # shadcn/ui components
│   └── features/          # Feature-specific components
├── lib/
│   ├── supabase/         # Supabase client configs
│   └── utils.ts          # Helper functions
├── server/
│   ├── queries/          # Database queries (cached)
│   └── actions/          # Server Actions
├── hooks/                 # Custom React hooks
├── test/                  # Test configuration & setup
├── types/                 # TypeScript types
└── supabase/
    ├── migrations/       # SQL migrations (source of truth)
    ├── seed.sql         # Development seed data
    └── config.toml      # Supabase configuration
```

## 🗄️ Database Management

### Migration-First Development

**NEVER modify the database directly!** Always use migrations:

```bash
# Development workflow
supabase start                                    # Start local Supabase
supabase migration new descriptive_name_here      # Create migration
# Edit the migration file in supabase/migrations/
supabase db reset                                 # Apply migrations + seed
npm run db:types                                  # Generate TypeScript types

# Production deployment
supabase db push                                  # Deploy to production
```

### Naming Conventions

- **Migrations**: `create_[table]_table`, `add_[column]_to_[table]`, `update_[table]_[change]`
- **Tables**: Plural, snake_case (e.g., `user_hacks`, `routine_tags`)
- **Columns**: snake_case (e.g., `created_at`, `is_admin`)

### Required for ALL Tables

1. Enable RLS: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Add updated_at trigger
3. Create appropriate RLS policies
4. Add indexes for foreign keys and commonly queried fields

## 🔐 Authentication

### Supabase Auth Setup

```typescript
// Client-side (browser)
import { createClient } from '@/lib/supabase/client'

// Server-side (Server Components, Server Actions)
import { createClient } from '@/lib/supabase/server'

// Admin operations (service role)
import { createAdminClient } from '@/lib/supabase/server'
```

### Auth Flow

1. User signs up → Trigger creates profile automatically
2. OAuth providers: Google, Discord
3. Session management via Supabase middleware
4. Protected routes check auth in layout

## 🎯 Development Patterns

### Server Components by Default

```typescript
// ✅ Server Component (default)
export default async function Page() {
  const data = await getServerData()
  return <ClientComponent initialData={data} />
}

// ✅ Client Component (when needed)
'use client'
export function InteractiveComponent() { ... }
```

### Server Actions with Validation

```typescript
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const Schema = z.object({
  name: z.string().min(1),
  // ...
})

export async function createItem(formData: FormData) {
  const validated = Schema.parse(Object.fromEntries(formData))

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('items')
    .insert(validated)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/items')
  return data
}
```

### Type-Safe Queries

```typescript
import type { Tables } from '@/types/supabase'

type Hack = Tables<'hacks'>
type Profile = Tables<'profiles'>

// Always use generated types!
```

## 🧪 Testing Strategy

### Test Configuration

```bash
npm test                    # Run tests in watch mode
npm run test:coverage      # Generate coverage report
npm run test:e2e          # Run E2E tests
```

### What to Test

- ✅ Server Actions (business logic)
- ✅ Utility functions
- ✅ Custom hooks
- ✅ Critical user flows (E2E)
- ❌ Don't test: Supabase internals, UI appearance only

## 📝 Environment Variables

### Development (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# New secret key format (recommended - use sb_secret_ keys)
SUPABASE_SECRET_KEY=sb_secret_your-secret-key
# Legacy service role key (deprecated - will be removed Nov 2025)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OAuth (optional)
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...

# Database (for Prisma compatibility if needed)
POSTGRES_URL=postgresql://postgres:postgres@localhost:54322/postgres
POSTGRES_URL_NON_POOLING=postgresql://postgres:postgres@localhost:54322/postgres
```

### Production (Vercel/Supabase)

```bash
# Set in Vercel dashboard
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
# New secret key format (recommended - use sb_secret_ keys)
SUPABASE_SECRET_KEY=[sb_secret_key]
# Legacy service role key (keep for backward compatibility during migration)
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

### Supabase Key Migration (2025)

**Important:** Supabase is transitioning to new key formats:
- **New Format**: `sb_secret_...` (recommended)
- **Legacy Format**: JWT-based service_role keys (will be deprecated Nov 2025)
- **Migration**: The codebase supports both formats with automatic fallback
- **Zero Downtime**: Keep both keys during migration, remove legacy after verification

## 🚀 Key Commands

```bash
# Development
npm run dev               # Start Next.js with Turbopack
supabase start           # Start local Supabase
supabase stop            # Stop local Supabase

# Database
supabase migration new   # Create new migration
supabase db reset       # Reset + migrate + seed
npm run db:types        # Generate TypeScript types

# Testing
npm test                # Run tests
npm run test:e2e       # Run E2E tests

# Production
npm run build          # Build for production
supabase db push      # Deploy migrations
```

## ⚠️ Critical Rules

1. **NEVER commit secrets** - Use environment variables
2. **ALWAYS use migrations** - Never modify DB directly
3. **ALWAYS enable RLS** - Security by default
4. **ALWAYS validate inputs** - Use Zod schemas
5. **ALWAYS regenerate types** after schema changes
6. **PREFER Server Components** - Client only when needed
7. **USE generated types** - Never hardcode DB types

## 🎯 Simplicity Principles

### Keep Solutions Simple

**STOP and reassess if you:**
- Spend more than 5 iterations on a simple CSS/styling issue
- Create complex workarounds for basic features
- Add wrapper divs, z-index hacks, or JavaScript for simple styling
- Refactor working code without being asked
- Debug issues that don't exist (always verify the problem first)

**Simple tasks have simple solutions:**
- **CSS Backgrounds**: Just use `background-image`, `background-position`, `background-size`
- **Styling**: Use existing Tailwind classes before custom CSS
- **State Management**: Use local state before context/stores
- **Components**: Keep flat structure when possible

### When to Stop Iterating

**Stop immediately when:**
1. The feature works as requested (even if not "perfect")
2. The user says "it's fine" or "good enough"
3. You're on iteration #10 of a simple task
4. You're fixing problems the user hasn't mentioned

**Examples of what NOT to do:**
```css
/* ❌ WRONG: Overcomplicating a simple background */
background-position: center -25%;  /* Iteration 1 */
background-position: center -50%;  /* Iteration 2 */
background-position: center -200px; /* Iteration 3 */
background-blend-mode: multiply;   /* Iteration 4 */
/* ... 10 more attempts ... */

/* ✅ RIGHT: Simple, direct solution */
background-image: url(/image.svg);
background-position: center top;  /* User said "center aligned to top" */
background-size: 100% auto;
```

### Working with Existing Code

**Before adding new solutions:**
1. Check if the feature already exists in the codebase
2. Follow existing patterns - don't introduce new ones
3. Assume existing implementations work unless proven otherwise
4. Test your changes before claiming completion

**When given feedback like "I'm not seeing it":**
- Take a screenshot first
- Verify the actual problem
- Don't assume and start changing random parameters
- Ask for clarification if needed

## 🔍 Common Issues & Solutions

### Issue: Types out of sync
```bash
npm run db:types  # Regenerate from database
```

### Issue: Migration conflicts
```bash
supabase db reset  # Reset to clean state
```

### Issue: Auth not working
- Check middleware configuration
- Verify environment variables
- Check Supabase dashboard for auth settings

### Issue: RLS blocking access
- Check policies in Supabase dashboard
- Use `createAdminClient()` for admin operations
- Verify auth.uid() in policies

## File Organization

**Root folder must contain ONLY:**
- Config files (next.config.js, tsconfig.json, etc.)
- Package files (package.json, package-lock.json)
- Dot files (.env, .gitignore, .eslintrc.json)
- README.md, LICENSE, CLAUDE.md

**Never put in root:**
- Test scripts → Use `test/` or `__tests__/`
- Documentation → Use `docs/`
- Screenshots → Delete after use
- SQL files → Use Supabase migrations
- Temporary files → Delete immediately

## Security

**NEVER commit:**
- API keys, passwords, tokens
- .env files (except .env.example)
- Database URLs with passwords
- Service account credentials
- Any `sb_secret_` or service role keys

**NEVER read or display:**
- `.env.production` files (contain secret keys)
- Any file containing `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- Production environment variables

**Best Practices:**
- Always use environment variables for secrets
- Use `SUPABASE_SECRET_KEY` (new format) over `SUPABASE_SERVICE_ROLE_KEY` (legacy)
- Rotate keys immediately if exposed
- Check for exposed keys before any deployment

## Pre-Commit Checklist

Always run before commits:
```bash
npm run lint          # Check code style
npm run typecheck    # Verify TypeScript types
npm test             # Run unit tests
npm run db:types     # Update types if schema changed
```
- ensure that there are no build errors before pushing to production or claiming that everything works
- Before claiming that something works, you should Test it in browser and validate with screenshots.
- Always test all code paths - different pages may implement the same feature differently (client vs server).