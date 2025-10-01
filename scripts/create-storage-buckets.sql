-- Production Storage Buckets Setup for NRGHax
-- Run this in Supabase SQL Editor to create and configure storage buckets

-- ============================================
-- 1. CREATE STORAGE BUCKETS
-- ============================================

-- Create avatars bucket for user profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public bucket
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Create hack-images bucket for hack images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hack-images',
  'hack-images',
  true, -- Public bucket
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

-- ============================================
-- 2. DROP EXISTING POLICIES (to avoid conflicts)
-- ============================================

-- Drop avatar policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Drop hack-images policies
DROP POLICY IF EXISTS "Public read access for hack images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload hack images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own hack images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own hack images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all hack images" ON storage.objects;

-- ============================================
-- 3. CREATE POLICIES FOR AVATARS BUCKET
-- ============================================

-- Public read access for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND auth.role() = 'authenticated'
);

-- Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
)
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
);

-- ============================================
-- 4. CREATE POLICIES FOR HACK-IMAGES BUCKET
-- ============================================

-- Public read access for hack images
CREATE POLICY "Public read access for hack images"
ON storage.objects FOR SELECT
USING (bucket_id = 'hack-images');

-- Authenticated users can upload hack images
CREATE POLICY "Authenticated users can upload hack images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hack-images'
  AND auth.uid() IS NOT NULL
  AND auth.role() = 'authenticated'
);

-- Authenticated users can update hack images they uploaded
CREATE POLICY "Users can update their own hack images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hack-images'
  AND auth.uid() IS NOT NULL
)
WITH CHECK (
  bucket_id = 'hack-images'
  AND auth.uid() IS NOT NULL
);

-- Authenticated users can delete hack images they uploaded
CREATE POLICY "Users can delete their own hack images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hack-images'
  AND auth.uid() IS NOT NULL
);

-- Admins can manage all hack images (additional policy for admins)
CREATE POLICY "Admins can manage all hack images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'hack-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
)
WITH CHECK (
  bucket_id = 'hack-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

-- ============================================
-- 5. VERIFY SETUP
-- ============================================

-- Check that buckets were created
SELECT
  id,
  name,
  public,
  file_size_limit,
  array_to_string(allowed_mime_types, ', ') as allowed_types
FROM storage.buckets
WHERE id IN ('avatars', 'hack-images');

-- Check that policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%' OR policyname LIKE '%hack%'
ORDER BY policyname;