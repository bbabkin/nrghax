# OAuth Troubleshooting Guide

## Problem: "Could not authenticate user" Error

When users try to sign in with Google or Discord in production, they get redirected to:
```
/auth?error=Could%20not%20authenticate%20user
```

---

## Root Causes & Solutions

### 1. ✅ Check Supabase URL Configuration

**Supabase Dashboard → Authentication → URL Configuration**

Ensure these URLs are set correctly for your production domain:

```
Site URL: https://your-domain.com
Redirect URLs:
  - https://your-domain.com/**
  - https://your-domain.com/auth/callback
```

⚠️ **Common mistake**: Having `http://localhost:3000` as Site URL in production

---

### 2. ✅ Verify OAuth Provider Configuration

#### Google OAuth (Google Cloud Console)

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. **Authorized JavaScript origins**:
   ```
   https://your-project-id.supabase.co
   https://your-domain.com
   ```
4. **Authorized redirect URIs**:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```

⚠️ **Common mistakes**:
- Missing the Supabase callback URL
- Using `http://` instead of `https://`
- Trailing slashes (don't include them)

#### Discord OAuth (Discord Developer Portal)

1. Go to: https://discord.com/developers/applications
2. Select your application
3. **OAuth2 → Redirects**:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```

⚠️ **Common mistakes**:
- Wrong Supabase project URL
- Not saving changes after adding redirect

---

### 3. ✅ Verify Environment Variables

Check your production environment (Vercel/hosting provider):

```bash
# Required for OAuth
GOOGLE_OAUTH_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-xxxxx

DISCORD_CLIENT_ID=xxxxx
DISCORD_CLIENT_SECRET=xxxxx

# Supabase (must match production project)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Common mistakes**:
- Using local Supabase URL in production
- Missing OAuth credentials
- Using development credentials in production

---

### 4. ✅ Configure Supabase OAuth Providers

**Supabase Dashboard → Authentication → Providers**

#### Enable Google:
1. Toggle "Google" to enabled
2. **Client ID**: Your Google OAuth Client ID
3. **Client Secret**: Your Google OAuth Client Secret
4. **Authorized Client IDs**: (optional, leave empty if not using server-side)
5. Click "Save"

#### Enable Discord:
1. Toggle "Discord" to enabled
2. **Client ID**: Your Discord Application ID
3. **Client Secret**: Your Discord Client Secret
4. Click "Save"

⚠️ **Common mistakes**:
- Provider enabled in Supabase but credentials not set
- Copy-paste errors (extra spaces, missing characters)
- Using local project credentials

---

### 5. ✅ Check Callback Route

Verify `/auth/callback/route.ts` exists and is correct:

```typescript
// src/app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=Could not authenticate user`)
}
```

---

## Quick Diagnostic Steps

### Step 1: Check Vercel Logs
```bash
vercel logs --follow
```

Look for errors from `/auth/callback` route. The improved error logging will show:
- `[OAuth Callback] Provider error:` - OAuth provider rejected the auth
- `[OAuth Callback] Exchange error:` - Supabase couldn't exchange the code
- `[OAuth Callback] No code or error received` - Redirect is broken

### Step 2: Test OAuth Flow
1. Click "Continue with Google/Discord"
2. Look at the browser URL during redirect
3. Note any error parameters in the URL

### Step 3: Compare URLs
**Expected flow**:
```
1. your-domain.com/auth (click OAuth button)
2. accounts.google.com/... (Google login)
3. your-project.supabase.co/auth/v1/callback (Supabase processes)
4. your-domain.com/auth/callback?code=... (Your app exchanges code)
5. your-domain.com/dashboard (Success!)
```

**If it fails at step 3**: OAuth provider misconfiguration
**If it fails at step 4**: Supabase configuration or code exchange issue

---

## Production Checklist

- [ ] Site URL in Supabase matches production domain
- [ ] Redirect URLs include production domain
- [ ] Google OAuth has correct authorized origins and redirect URIs
- [ ] Discord OAuth has correct redirect URI
- [ ] Production environment variables are set
- [ ] OAuth providers are enabled in Supabase dashboard
- [ ] OAuth client IDs and secrets are correct in Supabase
- [ ] Latest code is deployed to production
- [ ] Callback route exists and works

---

## Testing Locally

To test OAuth locally:

1. **Add localhost to Supabase redirect URLs**:
   ```
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```

2. **Add localhost to Google OAuth**:
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:54321/auth/v1/callback`

3. **Test the flow**:
   ```bash
   npm run dev
   # Visit http://localhost:3000/auth
   # Click "Continue with Google"
   ```

4. **Check logs**: Terminal should show callback route being hit

---

## Still Not Working?

### Check Supabase Auth Logs
1. Go to Supabase Dashboard
2. **Logs** → **Auth Logs**
3. Filter by timestamp when you tested
4. Look for errors related to OAuth

### Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `redirect_uri_mismatch` | OAuth provider doesn't recognize redirect URL | Update OAuth provider settings |
| `invalid_client` | Wrong client ID or secret | Check Supabase provider configuration |
| `access_denied` | User cancelled or provider blocked | Normal user behavior or check provider status |
| `Could not authenticate user` | Generic error, check logs | Enable better error logging (done in updated callback) |

---

## Need More Help?

1. **Check Vercel/hosting logs** for detailed error messages
2. **Check Supabase Auth logs** for provider-specific errors
3. **Test with a fresh incognito window** to rule out cached credentials
4. **Verify DNS and SSL** are working correctly for your production domain

---

## Updated Files

The following file has been updated with better error logging:
- `/src/app/auth/callback/route.ts` - Now logs specific OAuth errors

Deploy these changes to production to get more detailed error messages in your logs.
