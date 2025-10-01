# Vercel + Supabase Production Deployment Guide

## Prerequisites
- Vercel account (https://vercel.com)
- Production Supabase project (https://supabase.com)
- GitHub repository connected to Vercel

## Step 1: Create Production Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New project"
3. Configure:
   - Name: `nrghax-prod` (or your preference)
   - Database Password: Generate a strong password
   - Region: Choose closest to your users
   - Plan: Free tier is fine to start

## Step 2: Set Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

### Required Environment Variables

```bash
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL="https://[your-project].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Database (from Supabase Dashboard → Settings → Database)
POSTGRES_URL="postgresql://postgres.[project]:[password]@[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"

# OAuth Callback URL
NEXT_PUBLIC_SITE_URL="https://your-domain.vercel.app"
```

### Getting Supabase Keys
1. Go to Supabase Dashboard → Settings → API
2. Copy:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

## Step 3: Apply Database Migrations

### 3.1 Link to Remote Project
```bash
# Login to Supabase CLI
npx supabase login

# Link to your production project
npx supabase link --project-ref [your-project-ref]
# Project ref found in: Supabase Dashboard → Settings → General
```

### 3.2 Push Migrations to Production
```bash
# Push all migrations
npx supabase db push

# Or apply specific migration
npx supabase migration up --remote
```

### 3.3 Verify Migration Status
```bash
npx supabase migration list --remote
```

## Step 4: Configure Authentication

### 4.1 Set Site URL
In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://your-domain.vercel.app`
- Redirect URLs:
  - `https://your-domain.vercel.app/auth/callback`
  - `https://your-domain.vercel.app/**`

### 4.2 Configure OAuth Providers (Optional)

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 Client ID
3. Add to Authorized redirect URIs:
   - `https://[your-project].supabase.co/auth/v1/callback`
4. In Supabase Dashboard → Authentication → Providers → Google:
   - Enable Google
   - Add Client ID and Secret

#### Discord OAuth
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create New Application
3. OAuth2 → Add Redirect:
   - `https://[your-project].supabase.co/auth/v1/callback`
4. In Supabase Dashboard → Authentication → Providers → Discord:
   - Enable Discord
   - Add Client ID and Secret

## Step 5: Configure Build Settings

### 5.1 Update vercel.json
```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "regions": ["iad1"],
  "env": {
    "NEXT_TELEMETRY_DISABLED": "1"
  }
}
```

### 5.2 Update package.json scripts
```json
{
  "scripts": {
    "build": "next build",
    "postinstall": "npx supabase gen types typescript --local > src/types/supabase.ts || true"
  }
}
```

## Step 6: Deploy

### Option A: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

### Option B: Auto-deploy via GitHub
1. Push to main/master branch
2. Vercel will auto-deploy

## Step 7: Post-Deployment Setup

### 7.1 Create Admin User
```sql
-- In Supabase SQL Editor
UPDATE profiles
SET is_admin = true
WHERE email = 'your-admin@email.com';
```

### 7.2 Add Initial Data (Optional)
```bash
# Create seed file for production data
cat > seed-production.sql << 'EOF'
-- Add tags
INSERT INTO tags (name, slug, tag_type) VALUES
  ('Beginner', 'beginner', 'user_experience'),
  ('Intermediate', 'intermediate', 'user_experience'),
  ('Advanced', 'advanced', 'user_experience')
ON CONFLICT (slug) DO NOTHING;
EOF

# Apply via Supabase Dashboard SQL Editor
```

## Step 8: Verification Checklist

### Test Authentication
- [ ] Email/password signup works
- [ ] Email confirmation works
- [ ] Login works
- [ ] OAuth providers work (if configured)
- [ ] Password reset works

### Test Core Features
- [ ] Hacks display correctly
- [ ] User progress tracking works
- [ ] Prerequisites/unlocking works
- [ ] Admin panel accessible (for admin users)

### Monitor Health
- [ ] Check Vercel Functions logs for errors
- [ ] Check Supabase Dashboard → Logs for database errors
- [ ] Verify RLS policies are working

## Common Issues & Solutions

### Issue: "Failed to fetch data"
**Solution**: Check if NEXT_PUBLIC_SUPABASE_URL is set correctly (must start with https://)

### Issue: "Auth session missing"
**Solution**:
- Verify NEXT_PUBLIC_SITE_URL matches your deployment URL
- Check Authentication → URL Configuration in Supabase

### Issue: "RLS policy violation"
**Solution**: Ensure RLS policies are properly configured:
```sql
-- Check which policies exist
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

### Issue: "Too many connections"
**Solution**: Use pooled connection string (with pgbouncer=true)

### Issue: "Types out of sync"
**Solution**: Regenerate types after schema changes:
```bash
npx supabase gen types typescript --project-id [your-project-ref] > src/types/supabase.ts
```

## Monitoring & Maintenance

### Database
- Supabase provides automatic daily backups (Pro plan: 7 days, Free: 1 day)
- Monitor usage in Supabase Dashboard → Database → Statistics
- Set up alerts for high usage

### Performance
- Use Vercel Analytics (free tier available)
- Monitor Supabase Dashboard → API → Metrics
- Check slow queries in Database → Query Performance

### Security
- Regularly rotate database passwords
- Review RLS policies periodically
- Monitor auth logs for suspicious activity
- Keep dependencies updated: `npm audit fix`

## Rollback Strategy

### Database Rollback
```bash
# List migrations
npx supabase migration list --remote

# Create a rollback migration if needed
npx supabase migration new rollback_[description]
```

### Application Rollback
1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

## Scaling Considerations

When you need to scale:

### Database
- Upgrade Supabase plan for:
  - More connections
  - Better performance
  - Longer backup retention
  - Point-in-time recovery

### Application
- Enable Vercel Edge Functions for global distribution
- Implement caching strategies
- Use ISR (Incremental Static Regeneration) for static content

## Support Resources

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Discord Community: https://discord.gg/supabase

## Emergency Contacts

- Supabase Status: https://status.supabase.com
- Vercel Status: https://vercel-status.com
- Support Email: Set up your own monitoring/alerting