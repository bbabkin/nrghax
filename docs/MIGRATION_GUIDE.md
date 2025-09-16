# Database Migration Guide

## Overview
This guide explains how to properly manage database migrations between local development and production environments.

## Migration Workflow

### 1. Create New Migration Locally

```bash
# Create a new migration file
npx supabase migration new <descriptive_name>

# Example:
npx supabase migration new add_user_preferences_table
```

This creates a timestamped file in `supabase/migrations/`:
- `20250920123456_add_user_preferences_table.sql`

### 2. Write Your Migration

Edit the generated file with your SQL changes:

```sql
-- Example migration
CREATE TABLE public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'dark',
    notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);
```

### 3. Test Migration Locally

```bash
# Reset local database with new migration
npx supabase db reset

# Or apply just the new migration
npx supabase migration up
```

### 4. Deploy to Production

#### Option A: Using Supabase CLI (Recommended)

```bash
# Make sure you're linked to production
npx supabase link --project-ref iwvfegsrtgpqkctxvzqk

# Check what will be applied
npx supabase db diff --linked

# Push migrations to production
npx supabase db push
```

#### Option B: Manual via Dashboard

1. Go to SQL Editor in Supabase Dashboard
2. Copy your migration SQL
3. Run it manually
4. Record in migration tracking table (if using manual tracking)

#### Option C: GitHub Actions (CI/CD)

`.github/workflows/deploy.yml`:

```yaml
name: Deploy Database Migrations

on:
  push:
    branches: [main]
    paths:
      - 'supabase/migrations/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Deploy migrations
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

## Best Practices

### 1. Never Modify Existing Migrations
- Once a migration is in production, NEVER edit it
- Create a new migration to make changes

### 2. Make Migrations Reversible
Include rollback instructions in comments:

```sql
-- Migration: Add user_preferences table
-- Rollback: DROP TABLE IF EXISTS public.user_preferences CASCADE;

CREATE TABLE public.user_preferences (
    -- ... table definition
);
```

### 3. Use Transactions for Complex Migrations

```sql
BEGIN;

-- Multiple related changes
ALTER TABLE public.profiles ADD COLUMN preferences JSONB DEFAULT '{}';
UPDATE public.profiles SET preferences = '{"theme": "dark"}' WHERE preferences IS NULL;
ALTER TABLE public.profiles ALTER COLUMN preferences SET NOT NULL;

COMMIT;
```

### 4. Handle Existing Data Carefully

```sql
-- Add column with default for existing rows
ALTER TABLE public.profiles
ADD COLUMN newsletter_subscribed BOOLEAN DEFAULT false;

-- Then update based on existing data if needed
UPDATE public.profiles
SET newsletter_subscribed = true
WHERE created_at < '2024-01-01';
```

### 5. Test Migration Rollback

Always include and test rollback procedures:

```sql
-- rollback_20250920123456.sql
BEGIN;

-- Reverse the changes
DROP TABLE IF EXISTS public.user_preferences CASCADE;

-- Remove any functions, triggers, etc.
DROP FUNCTION IF EXISTS update_user_preferences_updated_at();

COMMIT;
```

## Common Migration Patterns

### Adding a Column

```sql
-- Safe way to add column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT;

-- With default value for existing rows
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
```

### Renaming a Column

```sql
-- Rename column (be careful - this can break app code!)
ALTER TABLE public.profiles
RENAME COLUMN username TO display_name;
```

### Adding an Index

```sql
-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_created_at
ON public.profiles(created_at DESC);
```

### Modifying Constraints

```sql
-- Drop and recreate constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_email_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_email_check
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

## Migration Tracking

### Check Migration Status

```bash
# List all migrations and their status
npx supabase migration list

# Show just remote migrations
npx supabase migration list --remote
```

### Manual Migration Tracking Table

If you need custom tracking, create this table:

```sql
CREATE TABLE IF NOT EXISTS public.migration_history (
    id SERIAL PRIMARY KEY,
    version TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    executed_by TEXT DEFAULT current_user,
    execution_time_ms INTEGER,
    rollback_sql TEXT,
    notes TEXT
);
```

## Troubleshooting

### Migration Failed in Production

1. **Check error in Dashboard logs**
   - Dashboard → Logs → Postgres logs

2. **Common issues:**
   - Table/column already exists → Use `IF NOT EXISTS`
   - Foreign key violation → Check data integrity
   - Permission denied → Check user roles
   - Lock timeout → Run during low traffic

3. **Recovery steps:**
   ```sql
   -- Check current state
   SELECT * FROM information_schema.tables
   WHERE table_schema = 'public';

   -- Manually fix issues
   -- Then mark migration as complete if needed
   ```

### Sync Issues Between Local and Production

```bash
# Pull production schema to local
npx supabase db remote commit

# This creates a migration file from production changes
# Review and commit to git
```

### Emergency Rollback

```sql
-- If something goes wrong, rollback immediately
BEGIN;

-- Your rollback SQL here
DROP TABLE IF EXISTS problem_table CASCADE;

-- Restore previous state
-- ...

COMMIT;
```

## Example: Complete Migration Flow

Let's say we need to add a "achievements" system:

### Step 1: Create Migration

```bash
npx supabase migration new add_achievements_system
```

### Step 2: Write Migration

`supabase/migrations/20250920000000_add_achievements_system.sql`:

```sql
-- Create achievements table
CREATE TABLE public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    points INTEGER DEFAULT 10,
    criteria JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_achievements junction table
CREATE TABLE public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Add indexes
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_earned_at ON public.user_achievements(earned_at DESC);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Achievements are public" ON public.achievements
    FOR SELECT USING (true);

CREATE POLICY "Users can view all user achievements" ON public.user_achievements
    FOR SELECT USING (true);

CREATE POLICY "System can grant achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Insert some default achievements
INSERT INTO public.achievements (name, description, icon, points) VALUES
('First Steps', 'Complete your first hack', '🎯', 10),
('Quick Learner', 'Complete 5 hacks', '📚', 50),
('Dedicated', 'Complete 10 hacks', '🏆', 100);
```

### Step 3: Test Locally

```bash
npx supabase db reset
# Test your app with new tables
```

### Step 4: Deploy to Production

```bash
npx supabase db push
```

### Step 5: Verify in Production

```sql
-- Run in Dashboard SQL Editor
SELECT COUNT(*) FROM public.achievements;
SELECT COUNT(*) FROM public.user_achievements;
```

## Summary

✅ **DO:**
- Create new migrations for changes
- Test locally first
- Use `IF EXISTS/IF NOT EXISTS` clauses
- Keep migrations small and focused
- Document rollback procedures
- Use transactions for related changes

❌ **DON'T:**
- Edit existing migrations
- Reset production database
- Make breaking changes without app updates
- Run untested SQL in production
- Ignore foreign key constraints

## Additional Resources

- [Supabase Migrations Docs](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [SQL Best Practices](https://www.postgresql.org/docs/current/sql-syntax.html)