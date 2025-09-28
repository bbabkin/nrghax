# 🔥 Complete Production Fix for Supabase Keys

## The Problem

Your production app is failing because **BOTH** types of Supabase keys need updating:
1. **ANON KEY** (public, used by browser) - Currently using legacy format
2. **SECRET KEY** (private, used by server) - Currently using legacy format

Both legacy key formats were disabled on 2025-09-28.

## Get Your New Keys from Supabase

### 1. Go to Supabase Dashboard
1. Visit [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings → API**

### 2. Copy BOTH Keys

You need TWO different keys:

1. **Public Anon Key** (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Look for: "Anon (public) key"
   - Format: Long JWT string (NOT starting with sb_)
   - This is safe to expose in browser

2. **Secret Key** (for `SUPABASE_SECRET_KEY`)
   - Look for: "Secret API key"
   - Format: Starts with `sb_secret_`
   - NEVER expose this publicly

## Update Vercel Environment Variables

### Step 1: Add the Secret Key
Since Vercel syncs some variables from Supabase integration, add this as a NEW variable:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → **Settings → Environment Variables**
3. Click **Add New**
4. Add:
   - Key: `SUPABASE_SECRET_KEY`
   - Value: `sb_secret_[YOUR_KEY_HERE]`
   - Environment: All (Production, Preview, Development)
5. Click **Save**

### Step 2: Update the Anon Key
The anon key might already be synced from Supabase. Check if it's updated:

1. Look for `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your environment variables
2. If it shows the old JWT format (starting with `eyJ...`), it needs updating
3. If it's locked (🔒), you may need to:
   - Disconnect and reconnect the Supabase integration
   - OR add it as a custom variable with a slightly different name

### Step 3: Verify Both Keys Are Set
After updating, you should have:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: New anon key (JWT format, but newer)
- `SUPABASE_SECRET_KEY`: `sb_secret_...` format

## Redeploy Your Application

### Option A: Via Vercel Dashboard
1. Go to **Deployments** tab
2. Find your latest deployment
3. Click the three dots menu → **Redeploy**

### Option B: Via Git Push
```bash
git commit --allow-empty -m "Update Supabase keys to new format"
git push
```

## Verify It's Working

1. After deployment (2-3 minutes), visit your site
2. Go to `/hacks` page
3. You should see hacks loading properly
4. Check browser console - no "Legacy API keys are disabled" errors

## Important Notes

### What Changed in Supabase

Supabase introduced new key formats:
- **Old Format**: JWT-based keys for both anon and service role
- **New Format**:
  - Anon keys: Still JWT but with new signing
  - Secret keys: `sb_secret_` prefixed keys

### Your Code Is Ready

The codebase already supports both formats:
- ✅ Server code uses `SUPABASE_SECRET_KEY` with fallback
- ✅ Client code uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ All functions handle the new format

You just need to update the environment variables in Vercel.

## Troubleshooting

### If hacks still don't load:
1. Check Vercel function logs for the actual error
2. Verify both keys are from the same Supabase project
3. Make sure you're using the production project keys, not local

### If you see authentication errors:
1. The anon key might be wrong
2. Double-check you copied the "Anon (public)" key, not the service key

### If admin functions fail:
1. The secret key might be wrong
2. Ensure `SUPABASE_SECRET_KEY` starts with `sb_secret_`

## Quick Checklist

- [ ] Got new Anon key from Supabase Dashboard
- [ ] Got new Secret key (sb_secret_) from Supabase Dashboard
- [ ] Added `SUPABASE_SECRET_KEY` to Vercel
- [ ] Updated `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
- [ ] Redeployed the application
- [ ] Verified `/hacks` page loads data