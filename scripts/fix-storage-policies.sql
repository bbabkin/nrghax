-- Fix storage policies in production
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/iwvfegsrtgpqkctxvzqk/sql/new

-- First, ensure buckets exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880,
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('hack-images', 'hack-images', true, 10485760,
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop ALL existing storage policies to start fresh
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop all policies on storage.objects
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  )
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
  END LOOP;
END $$;

-- Create clean storage policies
-- Public read for both buckets
CREATE POLICY "Public read access for avatars and hack-images"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('avatars', 'hack-images'));

-- Authenticated users can upload to both buckets
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('avatars', 'hack-images')
    AND auth.uid() IS NOT NULL
  );

-- Authenticated users can update their uploads
CREATE POLICY "Authenticated users can update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id IN ('avatars', 'hack-images')
    AND auth.uid() IS NOT NULL
  )
  WITH CHECK (
    bucket_id IN ('avatars', 'hack-images')
    AND auth.uid() IS NOT NULL
  );

-- Authenticated users can delete their uploads
CREATE POLICY "Authenticated users can delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id IN ('avatars', 'hack-images')
    AND auth.uid() IS NOT NULL
  );

-- Verify setup
SELECT 'Storage buckets:' as info;
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id IN ('avatars', 'hack-images');

SELECT 'Storage policies:' as info;
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';