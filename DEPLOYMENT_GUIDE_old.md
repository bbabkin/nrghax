# Modern Deployment Guide: GitHub → Vercel → Supabase

This guide provides the streamlined deployment workflow using GitHub for version control, Vercel for hosting, and Supabase for the database with automatic migrations.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Workflow Overview](#workflow-overview)
3. [Supabase Project Setup](#supabase-project-setup)
4. [Google OAuth Configuration](#google-oauth-configuration)
5. [GitHub Repository Setup](#github-repository-setup)
6. [Vercel Deployment](#vercel-deployment)
7. [Database Migrations](#database-migrations)
8. [Post-Deployment](#post-deployment)
9. [Testing & Monitoring](#testing--monitoring)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- [x] GitHub account with your repository
- [x] Vercel account (free tier works)
- [x] Supabase account
- [x] Google Cloud Console access for OAuth
- [x] Supabase CLI installed locally (`npm install -g supabase`)

---

## Workflow Overview

```mermaid
graph LR
    A[GitHub Repo] -->|Auto Deploy| B[Vercel]
    B -->|API Calls| C[Supabase]
    D[Supabase CLI] -->|Migrations| C
```

1. Push code to GitHub
2. Vercel automatically builds and deploys
3. Supabase CLI handles database migrations
4. Vercel connects to Supabase via environment variables

---

## Supabase Project Setup

### Step 1: Create New Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Organization**: Select or create one
   - **Project name**: `your-app-production`
   - **Database Password**: Generate and save securely
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free or Pro

### Step 2: Get Connection Details

Navigate to **Settings > API** and copy:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (Keep secret!)

### Step 3: Link Local Project to Supabase

```bash
# Initialize Supabase CLI (if not already done)
supabase init

# Login to Supabase
supabase login

# Link to your remote project
supabase link --project-ref [your-project-ref]
# Project ref is found in Settings > General
```

---

## Google OAuth Configuration

### Step 1: Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project or create new
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**

### Step 2: Configure OAuth Client

**Application type**: Web application

**Authorized JavaScript origins**:
```
http://localhost:3000
http://localhost:3002
https://your-app.vercel.app
https://your-custom-domain.com
```

**Authorized redirect URIs**:
```
http://localhost:3000/api/auth/callback/google
http://localhost:3002/api/auth/callback/google
https://your-app.vercel.app/api/auth/callback/google
https://your-custom-domain.com/api/auth/callback/google
```

### Step 3: Save Credentials

Download JSON and extract:
- `client_id` → `GOOGLE_CLIENT_ID`
- `client_secret` → `GOOGLE_CLIENT_SECRET`

---

## GitHub Repository Setup

### Step 1: Prepare Your Repository

```bash
# Ensure .env.local is in .gitignore
echo ".env.local" >> .gitignore

# Commit all changes
git add .
git commit -m "Prepare for deployment"

# Push to GitHub
git push origin main
```

### Step 2: Repository Structure

Ensure your repo has:
```
/
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utilities
├── supabase/
│   └── migrations/         # Database migrations (critical!)
├── package.json
├── next.config.js
└── .env.example           # Template for environment variables
```

---

## Vercel Deployment

### Step 1: Import from GitHub

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 2: Configure Environment Variables

Add all environment variables in Vercel dashboard:

```env
# Authentication
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=[generate with: openssl rand -base64 32]

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# Google OAuth
GOOGLE_CLIENT_ID=[your-client-id]
GOOGLE_CLIENT_SECRET=[your-client-secret]

# Optional: Direct Database Connection
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### Step 3: Deploy

Click **Deploy** and wait for build to complete.

---

## Database Migrations

### Method 1: Using Supabase CLI (Recommended)

```bash
# Push all local migrations to production
supabase db push

# Verify migrations were applied
supabase db diff

# If you need to reset (WARNING: destroys data)
supabase db reset --db-url "postgresql://..."
```

### Method 2: Using Supabase Dashboard

1. Go to **SQL Editor** in Supabase dashboard
2. Run migrations in order:

```sql
-- Run each file from supabase/migrations/ folder:
-- 1. 20250826231124_create_user_profiles_table.sql
-- 2. 20250826233014_add_password_hash_to_user_profiles.sql
-- 3. 20250826235145_remove_foreign_key_constraint.sql
-- 4. 20250827000000_create_nextauth_tables.sql
```

### Method 3: Automated with GitHub Actions

Create `.github/workflows/deploy-migrations.yml`:

```yaml
name: Deploy Migrations

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
      
      - name: Deploy Migrations
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

Add secrets to GitHub:
- `SUPABASE_PROJECT_REF`: Your project reference
- `SUPABASE_ACCESS_TOKEN`: Personal access token from Supabase dashboard

---

## Post-Deployment

### Step 1: Update Production URLs

After first deployment, update in Vercel:
- `NEXTAUTH_URL` to actual Vercel URL
- Redeploy to apply changes

### Step 2: Configure Custom Domain (Optional)

1. In Vercel: **Settings > Domains**
2. Add your domain
3. Configure DNS as instructed
4. Update environment variables with new domain
5. Update Google OAuth redirect URIs

### Step 3: Enable Vercel + Supabase Integration

1. Go to [Vercel Integrations](https://vercel.com/integrations/supabase)
2. Click **Add Integration**
3. Select your project
4. This automatically syncs environment variables

---

## Testing & Monitoring

### Quick Health Check

```bash
# Test API endpoint
curl https://your-app.vercel.app/api/health

# Check build logs
vercel logs --follow
```

### Create Health Endpoint

`app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { error } = await supabase.from('users').select('count').single();
    
    return NextResponse.json({
      status: 'healthy',
      database: error ? 'disconnected' : 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
```

### Monitoring Setup

1. **Vercel Analytics**: Enable in dashboard
2. **Supabase Monitoring**: Check Dashboard > Reports
3. **Error Tracking**: Add Sentry integration
4. **Uptime Monitoring**: Use Better Uptime or similar

---

## Troubleshooting

### Common Issues

#### "Invalid NEXTAUTH_URL"
- Ensure URL matches exactly (including https://)
- Redeploy after changing

#### "Google OAuth Error"
- Verify redirect URIs in Google Console
- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- Wait 5-10 minutes for Google changes to propagate

#### "Database Connection Failed"
- Check Supabase project is active
- Verify SERVICE_ROLE_KEY is correct
- Ensure migrations ran successfully

#### "Migrations Not Applied"
```bash
# Check migration status
supabase migration list

# Apply pending migrations
supabase db push

# Verify with direct connection
psql $DATABASE_URL -c "\dt"
```

### Debug Mode

Add to Vercel environment variables:
```
NEXTAUTH_DEBUG=true
```

Check logs:
```bash
vercel logs --follow --output raw
```

---

## Quick Deploy Checklist

- [ ] GitHub repo ready with all code
- [ ] Supabase project created
- [ ] Google OAuth configured
- [ ] Environment variables prepared
- [ ] Connect GitHub to Vercel
- [ ] Add env vars to Vercel
- [ ] Deploy to Vercel
- [ ] Run database migrations
- [ ] Test authentication flows
- [ ] Configure monitoring

---

## Commands Reference

```bash
# Supabase CLI
supabase login
supabase link --project-ref xxxxx
supabase db push
supabase migration list
supabase gen types typescript --local > types/supabase.ts

# Vercel CLI
vercel login
vercel --prod
vercel env add VARIABLE_NAME
vercel logs --follow

# Local Testing Before Deploy
npm run build
npm run test
npm run lint
```

---

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)
- [Vercel + Supabase Integration](https://vercel.com/integrations/supabase)

---

**Last Updated**: January 2025
**Version**: 2.0.0

This guide follows the modern deployment workflow where Vercel handles CI/CD and Supabase CLI manages database migrations.