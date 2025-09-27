-- Add media fields to hacks table for embedded content
ALTER TABLE hacks
ADD COLUMN IF NOT EXISTS media_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_thumbnail_url TEXT;

-- Add constraint for media_type values
ALTER TABLE hacks
ADD CONSTRAINT valid_media_type CHECK (
  media_type IS NULL OR media_type IN ('youtube', 'tiktok', 'mp3', 'video', 'audio')
);

-- Create storage bucket for routine images if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'routine-images',
  'routine-images',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for hack media if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hack-media',
  'hack-media',
  true,
  52428800, -- 50MB
  ARRAY['audio/mpeg', 'audio/mp3', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for routine-images bucket
CREATE POLICY "Public read access for routine images"
ON storage.objects FOR SELECT
USING (bucket_id = 'routine-images');

CREATE POLICY "Authenticated users can upload routine images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'routine-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own routine images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'routine-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own routine images"
ON storage.objects FOR DELETE
USING (bucket_id = 'routine-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create RLS policies for hack-media bucket
CREATE POLICY "Public read access for hack media"
ON storage.objects FOR SELECT
USING (bucket_id = 'hack-media');

CREATE POLICY "Authenticated users can upload hack media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'hack-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own hack media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'hack-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own hack media"
ON storage.objects FOR DELETE
USING (bucket_id = 'hack-media' AND auth.uid()::text = (storage.foldername(name))[1]);