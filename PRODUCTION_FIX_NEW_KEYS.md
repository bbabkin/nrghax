# 🔑 Production Fix: New Supabase Key Structure

## Understanding the New Key Structure

Supabase has introduced a new key naming convention:

| Old Name | New Name | Format | Usage |
|----------|----------|---------|--------|
| `anon` key | `publishable` key | `sb_publishable_...` | Client-side (browser) |
| `service_role` key | `secret` key | `sb_secret_...` | Server-side (admin) |

## Your Production Keys

Based on your information:
- **URL**: `https://chbfahyrdfoboddqahdk.supabase.co`
- **Publishable Key**: `sb_publishable_gnPVG5mIkoQgfqrqZHmoFQ_teLaq6IK`
- **Secret Key**: `sb_secret_gfADo7NSoghdXjkgwyxSvQ_ZitIYuq4` (from .env.production)

## Step 1: Update Vercel Environment Variables

### Add the New Keys

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → **Settings → Environment Variables**

### Add These Variables:

1. **NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY**
   - Value: `sb_publishable_gnPVG5mIkoQgfqrqZHmoFQ_teLaq6IK`
   - Environment: All (Production, Preview, Development)
   - ✅ This replaces the old ANON key for client-side

2. **SUPABASE_SECRET_KEY**
   - Value: `sb_secret_gfADo7NSoghdXjkgwyxSvQ_ZitIYuq4`
   - Environment: All (Production, Preview, Development)
   - ✅ This replaces the old SERVICE_ROLE key for server-side

3. **CUSTOM_SUPABASE_SERVICE_KEY** (If the above doesn't work due to Vercel integration)
   - Value: Same as SUPABASE_SECRET_KEY
   - Environment: All
   - ✅ This is our fallback for integration issues

### Verify URL is Correct:

- **NEXT_PUBLIC_SUPABASE_URL** should be: `https://chbfahyrdfoboddqahdk.supabase.co`

## Step 2: Deploy the Code Updates

The code has been updated to support both old and new key formats with automatic fallback.

```bash
git add .
git commit -m "Support new Supabase publishable and secret key format"
git push
```

## Step 3: How the Code Works Now

### Client-Side (Browser)
```typescript
// Checks in order:
1. NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (new format)
2. NEXT_PUBLIC_SUPABASE_ANON_KEY (old format fallback)
```

### Server-Side (Admin Operations)
```typescript
// Checks in order:
1. CUSTOM_SUPABASE_SERVICE_KEY (Vercel override)
2. SUPABASE_SECRET_KEY (new sb_secret_ format)
3. SUPABASE_SERVICE_ROLE_KEY (old format from integration)
```

## Step 4: Verify It's Working

After deployment:

1. **Check the /hacks page**: Should load content
2. **Check browser console**: No "Legacy API keys" errors
3. **Check Vercel Functions logs**: Look for successful Supabase connections

## Troubleshooting

### If you still see "Legacy API keys are disabled":

1. **Double-check the publishable key** is set correctly
   - It should start with `sb_publishable_`
   - This is what the browser uses to fetch data

2. **Ensure the secret key** is set
   - It should start with `sb_secret_`
   - This is for server-side admin operations

3. **Clear Vercel cache**:
   ```bash
   vercel --force
   ```

### If Vercel Integration is Blocking You:

The Vercel-Supabase integration might provide old keys that can't be edited. Our code now checks for `CUSTOM_SUPABASE_SERVICE_KEY` first, so you can override the integration's keys.

## Summary

The key changes are:
- ✅ Client uses `sb_publishable_` key (not anon)
- ✅ Server uses `sb_secret_` key (not service_role)
- ✅ Code supports both formats with fallback
- ✅ Custom override for Vercel integration issues

Once you add these environment variables to Vercel and redeploy, your production should work!