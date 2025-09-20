# Vercel Production Deployment Guide

## Prerequisites
- Vercel account (https://vercel.com)
- Production Supabase project (https://supabase.com)
- GitHub repository connected to Vercel

## Step 1: Set Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

### Required Environment Variables

```bash
# Database (Production Supabase)
DATABASE_URL="postgresql://postgres:[password]@[host].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL="https://[your-project].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# OAuth (if using)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# NextAuth (if needed)
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

## Step 2: Database Setup

### 2.1 Run Migrations on Production Database

```bash
# Set production DATABASE_URL locally
export DATABASE_URL="postgresql://postgres:[password]@[host].supabase.co:5432/postgres"

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Optional: Seed production data (be careful!)
# npm run db:seed
```

### 2.2 Enable Row Level Security (RLS) in Supabase

Go to Supabase Dashboard → SQL Editor and run:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_hacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE hack_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE hack_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tags ENABLE ROW LEVEL SECURITY;

-- Create basic policies (adjust as needed)
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Hacks are viewable by everyone" ON hacks
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own data" ON user_hacks
  FOR ALL USING (auth.uid() = user_id);
```

## Step 3: Configure Build Settings

### 3.1 Create vercel.json (optional)

```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "regions": ["iad1"],
  "env": {
    "PRISMA_HIDE_UPDATE_MESSAGE": "1"
  }
}
```

### 3.2 Update package.json build script

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

## Step 4: Deploy

### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

### Option B: Auto-deploy via GitHub

1. Connect your GitHub repo to Vercel
2. Push to main/master branch
3. Vercel will auto-deploy

## Step 5: Post-Deployment Checks

### 5.1 Verify Database Connection

```bash
# Check if migrations are applied
npx prisma migrate status

# Test database connection
npx prisma db pull
```

### 5.2 Monitor Logs

Go to Vercel Dashboard → Functions → Logs to monitor:
- Authentication errors
- Database connection issues
- Profile sync operations

### 5.3 Test Critical Flows

1. **Test Login**: Try email/password login
2. **Test OAuth**: Try Google/Discord login
3. **Test Data**: Check if hacks are displayed
4. **Test Admin**: Verify admin access works

## Common Issues & Solutions

### Issue: "Can't reach database server"
**Solution**: Add `?pgbouncer=true&connection_limit=1` to DATABASE_URL

### Issue: "Too many database connections"
**Solution**: Use connection pooling:
```javascript
// In src/lib/db/index.ts
export const prisma = new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})
```

### Issue: "Prisma Client not generated"
**Solution**: Add `"postinstall": "prisma generate"` to package.json

### Issue: "Auth not working in production"
**Solution**:
1. Check NEXT_PUBLIC_SUPABASE_URL is https (not http)
2. Verify callback URLs in Supabase Dashboard
3. Add your production domain to OAuth provider

## Production Checklist

- [ ] All environment variables set in Vercel
- [ ] Database migrations applied
- [ ] Prisma Client generated
- [ ] RLS policies configured
- [ ] OAuth redirect URLs updated
- [ ] Custom domain configured (optional)
- [ ] Error monitoring setup (optional)
- [ ] Analytics configured (optional)

## Monitoring & Maintenance

### Database Backups
- Supabase provides automatic daily backups
- Enable Point-in-Time Recovery for critical data

### Performance Monitoring
- Use Vercel Analytics (free tier available)
- Monitor database query performance in Supabase

### Security
- Regularly update dependencies: `npm audit fix`
- Review RLS policies periodically
- Monitor for suspicious auth attempts

## Rollback Strategy

If deployment fails:
1. Vercel automatically keeps previous deployments
2. Go to Vercel Dashboard → Deployments
3. Click "..." menu on previous deployment
4. Select "Promote to Production"

## Support

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Prisma Docs: https://www.prisma.io/docs