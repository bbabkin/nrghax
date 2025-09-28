# 🔧 Fix for Vercel-Supabase Integration with Disabled Legacy Keys

## The Problem

Your Supabase project has disabled legacy API keys, but the Vercel-Supabase integration is still providing the old key format through `SUPABASE_SERVICE_ROLE_KEY`. This is causing the "Legacy API keys are disabled" error.

## Solutions (Try in Order)

### Solution 1: Re-sync the Integration (Recommended)

The integration should automatically update to use new keys if you re-sync:

1. **In Supabase Dashboard:**
   - Go to your project → Settings → API
   - Check if you see a message about "Legacy keys disabled"
   - Look for an option to "Regenerate keys" or "Update to new key format"

2. **In Vercel Dashboard:**
   - Go to your project → Settings → Integrations
   - Find the Supabase integration
   - Click on it and look for:
     - "Re-sync" or "Refresh" button
     - "Configure" → then "Save" to trigger a re-sync
   - This should pull the latest keys from Supabase

3. **Trigger a Redeploy:**
   ```bash
   vercel --force
   ```

### Solution 2: Disconnect and Reconnect Integration

If re-syncing doesn't work:

1. **Disconnect the Integration:**
   - Vercel Dashboard → Settings → Integrations
   - Find Supabase → Remove/Disconnect
   - Confirm removal

2. **Reconnect:**
   - Go to [Vercel Integrations](https://vercel.com/integrations/supabase)
   - Click "Add Integration"
   - Select your project
   - This should pull the new key format

3. **Verify New Keys:**
   - Check Environment Variables
   - `SUPABASE_SERVICE_ROLE_KEY` should now work with the new format

### Solution 3: Manual Override (Workaround)

If the integration still provides old keys, override manually:

1. **Get your Service Role Key from Supabase:**
   - Supabase Dashboard → Settings → API
   - Copy the "service_role" key (should be a new JWT, not the `sb_secret_` format)
   - Note: The service_role key is different from the secret key

2. **Add Custom Environment Variable:**
   Since you can't edit the synced `SUPABASE_SERVICE_ROLE_KEY`, create a new one:

   In Vercel:
   - Add new variable: `CUSTOM_SUPABASE_SERVICE_KEY`
   - Value: [Your new service_role key from Supabase]
   - Apply to all environments

3. **Update Code to Use Custom Variable:**

   Edit `/src/lib/supabase/server.ts`:
   ```typescript
   const secretKey =
     process.env.CUSTOM_SUPABASE_SERVICE_KEY ||
     process.env.SUPABASE_SECRET_KEY ||
     process.env.SUPABASE_SERVICE_ROLE_KEY
   ```

   Edit `/bot/src/database/supabase.ts`:
   ```typescript
   const supabaseSecretKey =
     process.env.CUSTOM_SUPABASE_SERVICE_KEY ||
     process.env.SUPABASE_SECRET_KEY ||
     process.env.SUPABASE_SERVICE_ROLE_KEY;
   ```

### Solution 4: Use Supabase's New Management API

If none of the above work, Supabase might have migrated your project differently:

1. **Check Supabase Status:**
   - Visit [Supabase Status](https://status.supabase.com/)
   - Check for any migration notices

2. **Contact Supabase Support:**
   - They may need to manually update your integration
   - Mention: "Vercel integration providing disabled legacy keys"

## Verify It's Working

After applying any solution:

1. Check your function logs in Vercel
2. Look for successful Supabase connections
3. Visit `/hacks` - it should load data
4. No more "Legacy API keys are disabled" errors

## Important Notes

### About Key Formats

Supabase has multiple key types:
- **anon (public)**: Used by browser, safe to expose
- **service_role**: Used by server, has admin privileges
- **secret (sb_secret_)**: New format, also for server use

The Vercel integration typically provides:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon)
- `SUPABASE_SERVICE_ROLE_KEY` (service_role)

Both should be updated to new JWT format (not the sb_secret_ format).

### Why This Happened

On 2025-09-28, Supabase disabled legacy keys for security. Projects created before a certain date had old key formats that are now invalid. The Vercel integration needs to be refreshed to get the new keys.

## Quick Debugging

To see what keys you're actually using:

1. Add temporary logging in your code:
   ```typescript
   console.log('Key format check:', {
     hasCustom: !!process.env.CUSTOM_SUPABASE_SERVICE_KEY,
     hasSecret: !!process.env.SUPABASE_SECRET_KEY,
     hasService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
     serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10)
   });
   ```

2. Check Vercel function logs to see which key is being used

## If All Else Fails

Create a new Supabase project and migrate your data. New projects automatically use the new key format and won't have this issue.