# Production Database Migration Guide

## Prerequisites
- Access to Supabase Dashboard
- Project reference ID (found in project settings)

## Migration Files to Apply (in order)
1. `supabase/migrations/20250915000000_enhance_tag_system_for_onboarding.sql`
2. `supabase/migrations/20250915160000_add_questions_table.sql`

## Method 1: Supabase CLI (Recommended)

```bash
# 1. Link to production (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# 2. Check what migrations will be applied
npx supabase db diff

# 3. Push migrations to production
npx supabase db push

# 4. Verify migrations
npx supabase migration list
```

## Method 2: SQL Editor in Dashboard

1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_REF/sql
2. Create a new query
3. Copy and paste each migration file content
4. Execute in order

## Method 3: GitHub Actions (CI/CD)

Create `.github/workflows/production.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ master ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

Required secrets:
- `SUPABASE_PROJECT_REF`: Your project reference
- `SUPABASE_ACCESS_TOKEN`: Create at https://supabase.com/dashboard/account/tokens

## Post-Migration Verification

Run these queries in SQL Editor to verify:

```sql
-- Check if new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('questions', 'question_options', 'tag_sync_log', 'onboarding_responses');

-- Check tag types
SELECT DISTINCT tag_type, COUNT(*)
FROM tags
GROUP BY tag_type;

-- Verify questions are loaded
SELECT id, title, sort_order
FROM questions
ORDER BY sort_order;

-- Check question options
SELECT q.title, COUNT(qo.id) as option_count
FROM questions q
LEFT JOIN question_options qo ON q.id = qo.question_id
GROUP BY q.id, q.title
ORDER BY q.sort_order;
```

## Rollback Plan

If issues occur, create a rollback migration:

```sql
-- Rollback migration (save as backup)
DROP TABLE IF EXISTS question_options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS onboarding_responses CASCADE;
DROP TABLE IF EXISTS tag_sync_log CASCADE;

-- Remove tag_type enum
ALTER TABLE tags DROP COLUMN IF EXISTS tag_type;
ALTER TABLE tags DROP COLUMN IF EXISTS tag_source;
ALTER TABLE user_tags DROP COLUMN IF EXISTS source;

DROP TYPE IF EXISTS public.tag_type;
DROP TYPE IF EXISTS public.tag_source;
```

## Important Notes

1. **Backup First**: Always backup production data before migrations
   - Use Supabase Dashboard → Database → Backups

2. **Test Migrations**: Test on a staging environment first if available

3. **Maintenance Mode**: Consider putting app in maintenance mode during migration

4. **Monitor**: Watch logs during and after migration:
   - Dashboard → Logs → Postgres logs

5. **Seed Data**: After migration, you may need to run seed data for tags if not already present

## Troubleshooting

### If migrations fail:
1. Check Postgres logs in dashboard
2. Verify user permissions
3. Check for conflicting data
4. Ensure RLS policies don't block operations

### Common issues:
- **Enum already exists**: Drop and recreate
- **Foreign key violations**: Check data integrity
- **Permission denied**: Ensure migrations run as postgres user

## Contact Support
If issues persist, contact Supabase support with:
- Project reference
- Error messages from logs
- Migration SQL that failed