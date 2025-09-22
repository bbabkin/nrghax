# Supabase OAuth Configuration

## Important: Configure These Settings in Supabase Dashboard

### 1. Go to your Supabase Dashboard
Navigate to: https://supabase.com/dashboard/project/chbfahyrdfoboddqahdk/auth/providers

### 2. Configure OAuth Providers

#### Google OAuth
1. Enable Google provider
2. Add these Authorized redirect URIs:
   - For development: `http://localhost:3000/auth/callback`
   - For production: `https://www.nrghax.com/auth/callback`
3. Enter your Google OAuth credentials:
   - Client ID: `[YOUR_GOOGLE_CLIENT_ID]`
   - Client Secret: `[YOUR_GOOGLE_CLIENT_SECRET]`

#### Discord OAuth
1. Enable Discord provider
2. Add these Authorized redirect URIs:
   - For development: `http://localhost:3000/auth/callback`
   - For production: `https://www.nrghax.com/auth/callback`
3. Enter your Discord OAuth credentials:
   - Client ID: `[YOUR_DISCORD_CLIENT_ID]`
   - Client Secret: `[YOUR_DISCORD_CLIENT_SECRET]`

### 3. Update Site URL Settings
Go to: https://supabase.com/dashboard/project/chbfahyrdfoboddqahdk/auth/url-configuration

Set these URLs:
- Site URL: `https://www.nrghax.com`
- Redirect URLs (add all of these):
  - `http://localhost:3000/auth/callback`
  - `https://www.nrghax.com/auth/callback`
  - `http://localhost:3000/**`
  - `https://www.nrghax.com/**`

### 4. Discord Application Settings
Also update in Discord Developer Portal (https://discord.com/developers/applications/[YOUR_APP_ID]/oauth2):
- Add redirect URIs:
  - `http://localhost:3000/auth/callback`
  - `https://www.nrghax.com/auth/callback`
  - The Supabase-specific callback URL (shown in Supabase dashboard)

### 5. Google Cloud Console
Update in Google Cloud Console (https://console.cloud.google.com/):
- Add authorized redirect URIs:
  - `http://localhost:3000/auth/callback`
  - `https://www.nrghax.com/auth/callback`
  - The Supabase-specific callback URL (shown in Supabase dashboard)

## Testing OAuth Flow

After configuring the above settings:

1. Clear your browser cookies for localhost
2. Restart the dev server
3. Try logging in with Discord/Google
4. You should be redirected to the OAuth provider
5. After authorization, you should return to `/auth/callback`
6. The callback will exchange the code for a session
7. You'll be redirected to `/dashboard`

## Troubleshooting

If OAuth still redirects to wrong URL:
1. Check Supabase dashboard for the correct callback URLs
2. Ensure NEXT_PUBLIC_APP_URL is set correctly in `.env.local`
3. Check browser network tab to see the exact redirect URL being used
4. Verify the OAuth provider settings match exactly