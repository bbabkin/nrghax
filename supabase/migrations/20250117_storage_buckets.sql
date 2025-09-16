-- Create storage buckets for avatars and hack images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880,
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('hack-images', 'hack-images', true, 10485760,
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Hack images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload hack images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update hack images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete hack images" ON storage.objects;

-- Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for hack-images bucket
CREATE POLICY "Hack images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hack-images');

CREATE POLICY "Authenticated users can upload hack images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'hack-images'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can update hack images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'hack-images'
    AND auth.uid() IS NOT NULL
  )
  WITH CHECK (
    bucket_id = 'hack-images'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can delete hack images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'hack-images'
    AND auth.uid() IS NOT NULL
  );