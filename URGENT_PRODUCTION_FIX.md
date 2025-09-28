# 🚨 URGENT: Production Supabase Key Fix

## Problem
Production is currently failing with:
```
Legacy API keys are disabled
Your legacy API keys (anon, service_role) were disabled on 2025-09-28
```

## Immediate Solution

### 1. Get Your New Secret Key from Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings → API**
4. Find the **Secret API Key** section (starts with `sb_secret_`)
5. Copy the entire key

### 2. Add to Vercel Environment Variables

Since your Vercel project is linked to Supabase, you **CANNOT** edit the synced `SUPABASE_SERVICE_ROLE_KEY`. You must add a NEW variable:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings → Environment Variables**
4. Click **Add New**
5. Create the following:
   - **Key**: `SUPABASE_SECRET_KEY`
   - **Value**: `sb_secret_[YOUR_KEY_HERE]` (paste the key from Supabase)
   - **Environment**: Select all (Production, Preview, Development)
6. Click **Save**

### 3. Redeploy Your Application

Option A: Via Vercel Dashboard
1. Go to **Deployments** tab
2. Find your latest deployment
3. Click the three dots menu → **Redeploy**

Option B: Via Git Push
```bash
git commit --allow-empty -m "Trigger redeploy with new Supabase secret key"
git push
```

## Verification

After deployment completes (2-3 minutes):

1. Check your application logs in Vercel
2. Look for: `[Supabase] Using sb_secret_ key for admin client`
3. Test admin functions to ensure they work

## Why This Happened

- Supabase disabled legacy JWT-based service_role keys on 2025-09-28
- The new format uses `sb_secret_` prefixed keys
- Our code already supports both formats with automatic fallback
- You just need to add the new key to production

## Code Already Updated

The codebase already has full support for the new keys:

- ✅ `/src/lib/supabase/server.ts` - Uses `SUPABASE_SECRET_KEY` with fallback
- ✅ `/bot/src/database/supabase.ts` - Uses `SUPABASE_SECRET_KEY` with fallback
- ✅ All repositories and services use the shared Supabase client

## Long-term Migration

After confirming everything works:

1. Keep both keys for 1-2 weeks
2. Monitor for any issues
3. Eventually remove `SUPABASE_SERVICE_ROLE_KEY` from Vercel
4. Update any CI/CD pipelines to use new key format

## Need Help?

If you encounter issues:
1. Check that the key starts with `sb_secret_`
2. Ensure no extra spaces or quotes when pasting
3. Verify the key matches exactly from Supabase dashboard
4. Check Vercel function logs for error details