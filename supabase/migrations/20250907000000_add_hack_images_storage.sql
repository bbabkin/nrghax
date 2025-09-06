-- Create storage bucket for hack images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'hack-images',
    'hack-images',
    true, -- Public bucket so images can be accessed directly
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for hack-images bucket
CREATE POLICY "Public can view hack images" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'hack-images');

CREATE POLICY "Authenticated users can upload hack images" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'hack-images' AND (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL));

CREATE POLICY "Users can update their own hack images" ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'hack-images' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'hack-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own hack images" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'hack-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add new column for storage path (we'll keep image_url for backward compatibility during migration)
ALTER TABLE public.hacks 
ADD COLUMN IF NOT EXISTS image_path TEXT;

-- Make image_url nullable since we now support image_path as an alternative
ALTER TABLE public.hacks 
ALTER COLUMN image_url DROP NOT NULL;

-- Update the constraint to allow either image_url or image_path
ALTER TABLE public.hacks 
DROP CONSTRAINT IF EXISTS hacks_image_url_check,
ADD CONSTRAINT hacks_image_check CHECK (
    image_url IS NOT NULL OR image_path IS NOT NULL
);

-- Create a function to get the full public URL for an image
CREATE OR REPLACE FUNCTION public.get_hack_image_url(p_image_path TEXT, p_image_url TEXT)
RETURNS TEXT AS $$
BEGIN
    -- If image_path exists, construct the storage URL
    IF p_image_path IS NOT NULL THEN
        RETURN concat(
            'https://',
            (SELECT project_ref FROM auth.config LIMIT 1),
            '.supabase.co/storage/v1/object/public/hack-images/',
            p_image_path
        );
    -- Otherwise fall back to image_url
    ELSIF p_image_url IS NOT NULL THEN
        RETURN p_image_url;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- For local development, we need a different URL pattern
CREATE OR REPLACE FUNCTION public.get_hack_image_url_local(p_image_path TEXT, p_image_url TEXT)
RETURNS TEXT AS $$
BEGIN
    -- If image_path exists, construct the storage URL for local development
    IF p_image_path IS NOT NULL THEN
        RETURN concat(
            'http://localhost:54321/storage/v1/object/public/hack-images/',
            p_image_path
        );
    -- Otherwise fall back to image_url
    ELSIF p_image_url IS NOT NULL THEN
        RETURN p_image_url;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;