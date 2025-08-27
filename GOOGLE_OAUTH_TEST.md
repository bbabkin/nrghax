# Google OAuth Testing Guide

## ✅ HTTPS Setup Complete

Your application is now running with HTTPS at: **https://localhost:3002**

## 🔐 Current Configuration

- **Dev Server**: Running with HTTPS using self-signed certificates
- **NEXTAUTH_URL**: `https://localhost:3002`
- **OAuth Callback URL**: `https://localhost:3002/api/auth/callback/google`
- **Google Client ID**: Configured ✅
- **Google Client Secret**: Configured ✅

## 📋 Google Console Configuration Required

**IMPORTANT**: You need to update your Google Cloud Console OAuth settings:

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/apis/credentials

### 2. Update your OAuth 2.0 Client

Add these to your OAuth client configuration:

**Authorized JavaScript Origins:**
```
https://localhost:3002
```

**Authorized Redirect URIs:**
```
https://localhost:3002/api/auth/callback/google
```

## 🧪 Testing Steps

### Step 1: Accept Certificate Warning
1. Open your browser
2. Navigate to: https://localhost:3002
3. You'll see a certificate warning (this is normal for self-signed certificates)
4. Click "Advanced" → "Proceed to localhost (unsafe)"
   - Chrome: "Advanced" → "Proceed to localhost (unsafe)"
   - Firefox: "Advanced" → "Accept the Risk and Continue"
   - Safari: "Show Details" → "visit this website"

### Step 2: Test Google Login
1. Navigate to: https://localhost:3002/login
2. Click "Sign in with Google"
3. You should be redirected to Google's OAuth consent screen
4. Sign in with your Google account
5. Grant permissions when prompted
6. You should be redirected back to your application

## 🔍 Verification Endpoints

Test these endpoints to verify setup:

```bash
# Check OAuth providers (already tested ✅)
curl -k https://localhost:3002/api/auth/providers

# Check session (after login)
curl -k https://localhost:3002/api/auth/session
```

## 🐛 Troubleshooting

### Issue: "redirect_uri_mismatch"
**Solution**: Ensure Google Console has `https://localhost:3002/api/auth/callback/google`

### Issue: Certificate Warning Won't Go Away
**Solution**: This is normal for local development. The warning appears because we're using a self-signed certificate.

### Issue: "Invalid redirect_uri"
**Solution**: Make sure you're using HTTPS (not HTTP) in Google Console configuration

### Issue: OAuth Not Working After Config
**Solution**: 
1. Clear browser cookies for localhost
2. Restart the dev server
3. Try in an incognito/private window

## 🚀 Current Server Status

- **Server**: Running on HTTPS ✅
- **Port**: 3002 ✅
- **SSL**: Self-signed certificate active ✅
- **OAuth Providers**: Google and Credentials configured ✅

## 📝 Commands Reference

```bash
# Start HTTPS dev server
npm run dev:https

# Start regular HTTP dev server (don't use for OAuth)
npm run dev

# Check server status
curl -k https://localhost:3002/api/auth/providers
```

## ⚠️ Important Notes

1. **Keep the server running**: The HTTPS server is currently running in the background
2. **Don't change ports**: Google OAuth is configured for port 3002
3. **Use HTTPS URLs**: All URLs must use `https://` not `http://`
4. **Browser cache**: If issues persist, clear browser cache and cookies

---

**Ready to Test!** 🎉

Your HTTPS server is running and configured. Update your Google Console settings with the URLs above, then test the login flow at https://localhost:3002/login