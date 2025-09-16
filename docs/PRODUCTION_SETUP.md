# Production Setup Guide

## Current State

We've migrated from Drizzle ORM to Prisma ORM due to connection issues with Supabase. The codebase has been updated to use Prisma.

## Issues Found

1. **Missing Tables**: The production database has `user_hacks` table but the code was looking for `user_hack_likes` and `user_hack_completions`
2. **Foreign Key Relationships**: PostgREST can't find the proper relationships between tables
3. **Drizzle Connection Issues**: Drizzle Kit cannot connect properly to Supabase (IPv6 issues, pooler problems)

## Solution: Clean Migration to Prisma

### Prerequisites

1. Access to Supabase Dashboard
2. Database password from Supabase (Settings → Database → Connection string)
3. Node.js and npm installed

### Step 1: Backup Current Data (If Needed)

If you have any data you want to keep, export it from Supabase Dashboard first.

### Step 2: Wipe Production Database

Run this SQL in Supabase Dashboard SQL Editor:

```sql
-- Drop all custom tables (in dependency order)
DROP TABLE IF EXISTS public.hack_prerequisites CASCADE;
DROP TABLE IF EXISTS public.hack_tags CASCADE;
DROP TABLE IF EXISTS public.user_hack_completions CASCADE;
DROP TABLE IF EXISTS public.user_hack_likes CASCADE;
DROP TABLE IF EXISTS public.user_hacks CASCADE;
DROP TABLE IF EXISTS public.user_tags CASCADE;
DROP TABLE IF EXISTS public.tag_sync_log CASCADE;
DROP TABLE IF EXISTS public.onboarding_responses CASCADE;
DROP TABLE IF EXISTS public.question_options CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.hacks CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS public.content_type CASCADE;
DROP TYPE IF EXISTS public.question_type CASCADE;
DROP TYPE IF EXISTS public.tag_source CASCADE;
DROP TYPE IF EXISTS public.tag_type CASCADE;
```

### Step 3: Push Prisma Schema

1. Get your database password from Supabase Dashboard
2. Run the migration script:

```bash
# Option 1: With password
./scripts/migrate-to-production.sh --with-password YOUR_DB_PASSWORD

# Option 2: Manual
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.iwvfegsrtgpqkctxvzqk.supabase.co:5432/postgres" npx prisma db push
```

### Step 4: Verify Setup

1. Check tables in Supabase Dashboard
2. Test the application locally:
   ```bash
   npm run dev
   ```
3. Visit http://localhost:3000/hacks - should work without errors

## Production Deployment

### Environment Variables

Ensure `.env.production` has:
```env
DATABASE_URL="postgresql://postgres.iwvfegsrtgpqkctxvzqk:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL=https://iwvfegsrtgpqkctxvzqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Deploy to Vercel/Railway/etc

1. Set environment variables in your platform
2. Deploy the application
3. The build process will run `prisma generate` automatically

## Troubleshooting

### Issue: "Could not find relationship" errors

**Solution**: The PostgREST schema cache needs to be reloaded. This happens automatically but can take a few minutes.

### Issue: Cannot connect to database

**Solution**: Use the connection string format that works:
- For migrations: Direct connection without pooler
- For application: Pooler connection on port 5432 or 6543

### Issue: Tables exist but foreign keys missing

**Solution**: Wipe and recreate. Since the app is new, this is the cleanest approach.

## Database Schema

The application uses these main tables:
- `profiles` - User profiles linked to auth.users
- `hacks` - Learning materials/challenges
- `user_hacks` - Tracks user interactions (liked, completed status)
- `tags` - Categories for hacks
- `hack_tags` - Many-to-many relationship
- `user_tags` - User interests
- `hack_prerequisites` - Hack dependencies

## Key Changes from Drizzle

1. Schema definition in `prisma/schema.prisma` instead of TypeScript
2. Use `npx prisma generate` to generate client
3. Use `npx prisma db push` for schema changes
4. Use `npx prisma studio` for database GUI
5. Import from `@prisma/client` instead of custom schema

## Next Steps

1. Run the migration script
2. Test all functionality
3. Deploy to production
4. Monitor for any issues

## Support

If you encounter issues:
1. Check the Prisma documentation: https://www.prisma.io/docs
2. Verify Supabase connection: https://supabase.com/docs/guides/database/connecting-to-postgres
3. Check PostgREST logs in Supabase Dashboard