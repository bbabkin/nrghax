# Supabase API Key Migration Guide

## 🚨 Important: Legacy API Keys Disabled

Supabase has disabled legacy API keys. You must update to the new secret key format.

## Required Changes

### 1. Get New Secret Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings → API**
4. Copy the **Secret Key** (not the legacy service role key)

### 2. Update Environment Variables

**Replace in your .env file:**

```bash
# ❌ OLD (Legacy - No longer works)
SUPABASE_SERVICE_ROLE_KEY=sbp_your_old_key_here

# ✅ NEW (Required)
SUPABASE_SECRET_KEY=sbp_your_new_secret_key_here
```

### 3. Test Connection

Run the test script to verify:

```bash
node test-db-connection.js
```

**Expected output when working:**
```
✅ Environment variables found
   Key type: SUPABASE_SECRET_KEY
✅ Found X hacks in database
✅ Successfully fetched Y sample hacks
```

**Error output with legacy keys:**
```
❌ Error: Legacy API keys are disabled
```

## Bot Compatibility

The bot code already supports both key formats:

```typescript
// Automatically uses new format if available, falls back to legacy
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
```

## Next Steps

1. Update your `.env` file with the new `SUPABASE_SECRET_KEY`
2. Run `node test-db-connection.js` to verify
3. Restart your bot to use the new credentials

The bot will automatically detect and use the new key format once you update your environment variables.