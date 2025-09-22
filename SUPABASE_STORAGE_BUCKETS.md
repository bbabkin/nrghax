# Supabase Storage Buckets Configuration

## Required Storage Buckets

You need to create the following storage buckets in your Supabase project:

### 1. **avatars** (User Profile Images)
- **Bucket Name**: `avatars`
- **Public**: Yes ✅
- **File Size Limit**: 5MB
- **Allowed MIME Types**:
  - `image/jpeg`
  - `image/jpg`
  - `image/png`
  - `image/webp`
  - `image/gif`
- **RLS Policies**:
  - **SELECT**: Allow anyone to view avatars (public)
  - **INSERT**: Allow authenticated users to upload their own avatar
  - **UPDATE**: Allow users to update their own avatar
  - **DELETE**: Allow users to delete their own avatar

### 2. **hack-images** (Hack Cover Images)
- **Bucket Name**: `hack-images`
- **Public**: Yes ✅
- **File Size Limit**: 10MB
- **Allowed MIME Types**:
  - `image/jpeg`
  - `image/jpg`
  - `image/png`
  - `image/webp`
  - `image/svg+xml`
- **RLS Policies**:
  - **SELECT**: Allow anyone to view hack images (public)
  - **INSERT**: Allow admins only to upload
  - **UPDATE**: Allow admins only to update
  - **DELETE**: Allow admins only to delete

### 3. **routine-images** (Routine Cover Images)
- **Bucket Name**: `routine-images`
- **Public**: Yes ✅
- **File Size Limit**: 10MB
- **Allowed MIME Types**:
  - `image/jpeg`
  - `image/jpg`
  - `image/png`
  - `image/webp`
  - `image/svg+xml`
- **RLS Policies**:
  - **SELECT**: Allow anyone to view routine images (public)
  - **INSERT**: Allow authenticated users to upload for their own routines
  - **UPDATE**: Allow users to update images for their own routines
  - **DELETE**: Allow users to delete images for their own routines

## How to Create Buckets in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Storage** section
3. Click **New Bucket** for each bucket above

### For each bucket:

#### Step 1: Create the Bucket
```sql
-- Example for avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);
```

#### Step 2: Set up RLS Policies

**For `avatars` bucket:**
```sql
-- Allow public access to view avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**For `hack-images` bucket:**
```sql
-- Allow public access to view hack images
CREATE POLICY "Hack images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'hack-images');

-- Allow admins to upload hack images
CREATE POLICY "Admins can upload hack images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hack-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Allow admins to update hack images
CREATE POLICY "Admins can update hack images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hack-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Allow admins to delete hack images
CREATE POLICY "Admins can delete hack images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hack-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);
```

**For `routine-images` bucket:**
```sql
-- Allow public access to view routine images
CREATE POLICY "Routine images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'routine-images');

-- Allow users to upload routine images for their own routines
CREATE POLICY "Users can upload routine images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'routine-images'
  AND auth.uid() IS NOT NULL
);

-- Allow users to update their routine images
CREATE POLICY "Users can update routine images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'routine-images'
  AND auth.uid() IS NOT NULL
);

-- Allow users to delete their routine images
CREATE POLICY "Users can delete routine images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'routine-images'
  AND auth.uid() IS NOT NULL
);
```

## File Upload Paths Structure

The application expects files to be organized as follows:

### Avatars
- Path format: `avatars/{user_id}/avatar.{extension}`
- Example: `avatars/123e4567-e89b-12d3-a456-426614174000/avatar.png`

### Hack Images
- Path format: `hack-images/{hack_id}.{extension}`
- Example: `hack-images/solar-panel-basics.jpg`

### Routine Images
- Path format: `routine-images/{routine_id}.{extension}`
- Example: `routine-images/morning-energy-boost.jpg`

## Testing Your Buckets

After creating the buckets, test them by:

1. **Upload Test**: Try uploading an image through your app
2. **Public Access Test**: Access the image URL directly:
   ```
   https://[YOUR_PROJECT_ID].supabase.co/storage/v1/object/public/[BUCKET_NAME]/[FILE_PATH]
   ```
3. **Permission Test**: Try uploading as different user roles to verify RLS policies

## Environment Variables

Make sure these are set in your `.env.local` and production environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
```

## Notes

- All buckets are set to **public** for read access, allowing images to be displayed without authentication
- File size limits prevent abuse and manage storage costs
- MIME type restrictions ensure only images are uploaded
- RLS policies ensure users can only modify their own content
- Admins have special privileges for hack images