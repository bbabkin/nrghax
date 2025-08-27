# Google OAuth Setup Guide

This guide explains how to set up Google OAuth for your Supabase Authentication Starter app.

## Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:3000` (for local development)
     - Your production domain (e.g., `https://yourdomain.com`)
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for local development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)
     - `http://127.0.0.1:54321/auth/v1/callback` (for Supabase local development)
     - Your Supabase project callback URL (for production)

## Step 2: Configure Environment Variables

1. Copy your Google OAuth credentials from the Google Cloud Console
2. Update your `.env.local` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret

# Google OAuth for Supabase (same values)
GOOGLE_OAUTH_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-actual-client-secret
```

## Step 3: Configure Supabase

1. Open your Supabase dashboard
2. Go to "Authentication" > "Providers"
3. Enable Google provider
4. Add your Google OAuth credentials:
   - Client ID: Your Google OAuth Client ID
   - Client Secret: Your Google OAuth Client Secret
5. Save the configuration

## Step 4: Test the Integration

1. Start your development server: `npm run dev`
2. Start Supabase: `npx supabase start`
3. Navigate to `http://localhost:3000/login`
4. Click the "Sign in with Google" button
5. You should be redirected to Google's OAuth consent screen

## Troubleshooting

### Common Issues:

1. **"Error 400: redirect_uri_mismatch"**
   - Make sure your redirect URIs are correctly configured in Google Cloud Console
   - Check that you're using the exact URLs (including http/https)

2. **"Error 403: access_blocked"**
   - Make sure the Google+ API is enabled
   - Check that your OAuth consent screen is configured

3. **"Invalid client_id or client_secret"**
   - Verify your credentials in `.env.local`
   - Make sure there are no extra spaces or characters

4. **Supabase OAuth not working**
   - Check that the Google provider is enabled in Supabase
   - Verify the callback URL is correct
   - Make sure your environment variables match between NextAuth and Supabase

### Development vs Production:

- For local development, use `http://localhost:3000`
- For production, use your actual domain with HTTPS
- Make sure to update redirect URIs when deploying

## Security Notes

- Never commit your actual OAuth credentials to version control
- Use different OAuth applications for development and production
- Regularly rotate your client secrets
- Monitor OAuth usage in Google Cloud Console

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [Supabase Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)