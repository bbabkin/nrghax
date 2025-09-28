-- Create storage bucket for hack images if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES (
  'hack-images',
  'hack-images'
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access for hack images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload hack images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own hack images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own hack images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all hack images" ON storage.objects;

-- Create RLS policies for hack-images bucket
-- Public read access
CREATE POLICY "Public read access for hack images"
ON storage.objects FOR SELECT
USING (bucket_id = 'hack-images');

-- Authenticated users can upload hack images
CREATE POLICY "Authenticated users can upload hack images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hack-images'
  AND auth.role() = 'authenticated'
);

-- Users can update their own hack images
CREATE POLICY "Users can update their own hack images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hack-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'hack-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own hack images
CREATE POLICY "Users can delete their own hack images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hack-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can manage all hack images
CREATE POLICY "Admins can manage all hack images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'hack-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);