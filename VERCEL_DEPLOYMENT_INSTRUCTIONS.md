# Vercel Deployment Instructions for Supabase Secret Keys

## 🔐 Adding SUPABASE_SECRET_KEY to Vercel

Since your Vercel project is linked to Supabase, the integration automatically syncs certain environment variables. However, you **cannot directly edit** these synced variables. Here's how to add the new `SUPABASE_SECRET_KEY`:

### Option A: Add Custom Environment Variable (Recommended)

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/dashboard
   - Select your project

2. **Access Environment Variables**
   - Click on "Settings" tab
   - Click on "Environment Variables" in the left sidebar

3. **Add New Variable**
   - Click the "Add New" button
   - Enter the following:
     - **Name**: `SUPABASE_SECRET_KEY`
     - **Value**: `[YOUR_SECRET_KEY_HERE - DO NOT COMMIT]`
     - **Environment**: Select all (Production, Preview, Development)

4. **Save and Deploy**
   - Click "Save"
   - Go to the "Deployments" tab
   - Click "Redeploy" on the latest deployment
   - Select "Redeploy with existing Build Cache"

### Option B: Use Vercel CLI

If you prefer command line:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Link to your project (if not already linked)
vercel link

# Add the environment variable
vercel env add SUPABASE_SECRET_KEY production
# When prompted, paste: sb_secret_gfADo7NSoghdXjkgwyxSvQ_ZitIYuq4

# Also add for preview and development
vercel env add SUPABASE_SECRET_KEY preview
vercel env add SUPABASE_SECRET_KEY development

# Trigger a new deployment
vercel --prod
```

## 🔄 Migration Strategy

The codebase now supports both keys with automatic fallback:
- **Primary**: `SUPABASE_SECRET_KEY` (new sb_secret_ format)
- **Fallback**: `SUPABASE_SERVICE_ROLE_KEY` (legacy, synced from Supabase)

### Current Implementation

```javascript
// The code automatically uses the new key if available
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
```

## ⚠️ Important Notes

### Linked Integration Limitations
- Variables synced from Supabase (like `SUPABASE_SERVICE_ROLE_KEY`) **cannot be edited** in Vercel
- These appear with a lock icon 🔒 in the Vercel dashboard
- You must add `SUPABASE_SECRET_KEY` as a **new custom variable**

### Verification Steps
1. After adding the variable, check the deployment logs
2. Look for: `[Supabase] Using sb_secret_ key for admin client` in development logs
3. Test admin functions to ensure they work correctly

### Troubleshooting

**If admin functions stop working:**
1. Verify `SUPABASE_SECRET_KEY` is set in Vercel
2. Check that the value matches exactly (no extra spaces)
3. Ensure you redeployed after adding the variable
4. The fallback to `SUPABASE_SERVICE_ROLE_KEY` should prevent downtime

**If you see "Missing Supabase admin environment variables":**
- Neither key is set properly
- Check Vercel environment variables
- Ensure the Supabase integration is still connected

## 📋 Checklist

- [ ] Added `SUPABASE_SECRET_KEY` to Vercel environment variables
- [ ] Set for Production, Preview, and Development environments
- [ ] Redeployed the application
- [ ] Verified admin functions still work
- [ ] Checked deployment logs for any errors

## 🔮 Future Steps

Once verified that everything works with `SUPABASE_SECRET_KEY`:
1. Monitor for 1-2 weeks
2. Remove `SUPABASE_SERVICE_ROLE_KEY` references from code
3. Update all documentation

## 📚 References

- [Vercel Environment Variables Documentation](https://vercel.com/docs/environment-variables)
- [Supabase API Keys Documentation](https://supabase.com/docs/guides/api/api-keys)
- [Vercel-Supabase Integration](https://vercel.com/marketplace/supabase)