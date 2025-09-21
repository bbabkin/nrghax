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

Ensure your production environment (Vercel, Railway, etc.) has these variables:

#### Database Configuration
```env
# Use POSTGRES_URL instead of DATABASE_URL for Vercel/Supabase standard
POSTGRES_URL="postgresql://postgres.iwvfegsrtgpqkctxvzqk:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
POSTGRES_URL_NON_POOLING="postgresql://postgres:[PASSWORD]@db.iwvfegsrtgpqkctxvzqk.supabase.co:5432/postgres"

# Supabase (if using Supabase features directly)
NEXT_PUBLIC_SUPABASE_URL=https://iwvfegsrtgpqkctxvzqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

#### Auth.js Configuration
```env
# Required for NextAuth.js/Auth.js
AUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://www.nrghax.com  # Your production URL

# OAuth Providers
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>
DISCORD_CLIENT_ID=<from-discord-developer-portal>
DISCORD_CLIENT_SECRET=<from-discord-developer-portal>

# Email Provider (optional for magic links)
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@example.com
EMAIL_SERVER_PASSWORD=your-password
EMAIL_FROM=noreply@nrghax.com
```

### Generating AUTH_SECRET

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

### OAuth Provider Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://www.nrghax.com/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for local dev)

#### Discord OAuth
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 settings
4. Add redirect URLs:
   - `https://www.nrghax.com/api/auth/callback/discord`
   - `http://localhost:3000/api/auth/callback/discord` (for local dev)

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

## Database Schema Updates

### Adding hashedPassword Column (Required for Auth.js)

The Auth.js credentials provider requires a hashedPassword column. Add it to your production database:

```sql
-- Add hashedPassword column to User table
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "hashed_password" TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'User' AND column_name = 'hashed_password';
```

### Main Tables

The application uses these main tables:
- `User` - User accounts (replaces profiles, now managed by Auth.js)
- `hacks` - Learning materials/challenges
- `user_hacks` - Tracks user interactions (liked, completed status)
- `tags` - Categories for hacks
- `hack_tags` - Many-to-many relationship
- `user_tags` - User interests
- `hack_prerequisites` - Hack dependencies
- `Account`, `Session`, `VerificationToken` - Auth.js tables

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