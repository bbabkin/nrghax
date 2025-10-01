# Production Deployment Checklist

## Pre-Deployment
- [ ] All tests passing locally
- [ ] Environment variables documented
- [ ] Database migrations tested locally
- [ ] No sensitive data in code

## Supabase Setup
- [ ] Production project created on Supabase
- [ ] Project credentials saved securely
- [ ] Authentication providers configured
- [ ] Database password is strong

## Vercel Configuration
- [ ] Project connected to GitHub repository
- [ ] Environment variables added:
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] POSTGRES_URL
  - [ ] POSTGRES_URL_NON_POOLING
  - [ ] NEXT_PUBLIC_SITE_URL

## Database Migration
- [ ] Link Supabase CLI to production project
- [ ] Run migrations on production database
- [ ] Verify tables created correctly
- [ ] Apply seed data if needed
- [ ] Test database connectivity

## Authentication Setup
- [ ] Site URL configured in Supabase
- [ ] Redirect URLs added
- [ ] OAuth providers configured (if using)
- [ ] Email templates customized (optional)

## Deployment
- [ ] Code committed to repository
- [ ] Deploy triggered (manual or auto)
- [ ] Build successful on Vercel
- [ ] No deployment errors

## Post-Deployment Verification
- [ ] Site loads correctly
- [ ] Authentication flow works:
  - [ ] Sign up
  - [ ] Email confirmation
  - [ ] Sign in
  - [ ] Password reset
- [ ] Data displays correctly:
  - [ ] Hacks visible
  - [ ] User progress tracking
  - [ ] Prerequisites working
- [ ] Admin functionality (if applicable)
- [ ] No console errors
- [ ] No 404 errors

## Production Configuration
- [ ] Create at least one admin user
- [ ] Add initial content (hacks/tags)
- [ ] Test user journey completely
- [ ] Set up monitoring/alerts
- [ ] Document admin procedures

## Security
- [ ] RLS policies active and tested
- [ ] API keys not exposed in client
- [ ] HTTPS enforced
- [ ] CORS configured properly

## Performance
- [ ] Images optimized
- [ ] Database queries efficient
- [ ] No N+1 query problems
- [ ] Caching configured

## Final Steps
- [ ] Update README with production URL
- [ ] Document deployment process
- [ ] Set up backup strategy
- [ ] Plan for monitoring and maintenance