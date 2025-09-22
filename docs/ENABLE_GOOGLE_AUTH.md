# Enable Google OAuth in Supabase

## Error
`{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`

This error occurs when the OAuth provider (Google) is not enabled in your Supabase project.

## Solution

### 1. Enable Google Provider in Supabase

1. Go to your Supabase Dashboard:
   https://supabase.com/dashboard/project/chbfahyrdfoboddqahdk/auth/providers

2. Find **Google** in the provider list

3. Click on Google to expand the settings

4. Toggle **"Enable Google provider"** to ON

### 2. Add Google OAuth Credentials

You need to provide your Google OAuth credentials to Supabase:

#### Option A: Use Existing Credentials from Auth.js
If you were using Google OAuth with Auth.js, you can reuse the same credentials:
- Copy your `GOOGLE_CLIENT_ID` from your `.env` file
- Copy your `GOOGLE_CLIENT_SECRET` from your `.env` file
- Paste them in the Supabase Google provider settings

#### Option B: Create New Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Choose "Web application"
6. Add Authorized redirect URIs:
   ```
   https://chbfahyrdfoboddqahdk.supabase.co/auth/v1/callback
   ```
7. Copy the Client ID and Client Secret
8. Paste them in Supabase Dashboard

### 3. Configure URL Settings

In Supabase Dashboard > Authentication > URL Configuration:

- **Site URL**: `https://www.nrghax.com`
- **Redirect URLs**: Add these URLs:
  ```
  https://www.nrghax.com/auth/callback
  http://localhost:3000/auth/callback
  ```

### 4. Enable Discord Provider (Optional)

Repeat the same process for Discord if you want Discord OAuth:
1. Enable Discord provider in Supabase
2. Add Discord OAuth credentials
3. Discord OAuth callback URL:
   ```
   https://chbfahyrdfoboddqahdk.supabase.co/auth/v1/callback
   ```

### 5. Save Changes

Click **Save** at the bottom of the providers page.

## Testing

After enabling the providers:
1. Try logging in again at https://www.nrghax.com/auth
2. The Google/Discord login buttons should now work

## Important Notes

- Changes take effect immediately after saving
- No code changes needed - the Supabase client already handles OAuth
- Make sure the callback URLs match exactly
- For local development, also add `http://localhost:3000/auth/callback` to redirect URLs