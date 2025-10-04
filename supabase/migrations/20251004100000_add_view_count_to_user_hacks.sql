-- Add view_count column to user_hacks table to track multiple views
ALTER TABLE public.user_hacks
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Update existing records: Set view_count to 1 where viewed is true
UPDATE public.user_hacks
SET view_count = 1
WHERE viewed = true AND view_count = 0;

-- Create an index for better performance when querying view counts
CREATE INDEX IF NOT EXISTS idx_user_hacks_view_count
ON public.user_hacks(user_id, hack_id, view_count)
WHERE view_count > 0;

-- Create or replace function to increment view count
CREATE OR REPLACE FUNCTION public.increment_hack_view_count(
  p_user_id UUID,
  p_hack_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_view_count INTEGER;
BEGIN
  -- Insert or update the view count
  INSERT INTO public.user_hacks (user_id, hack_id, view_count, viewed, viewed_at, started_at)
  VALUES (p_user_id, p_hack_id, 1, true, NOW(), NOW())
  ON CONFLICT (user_id, hack_id)
  DO UPDATE SET
    view_count = COALESCE(user_hacks.view_count, 0) + 1,
    viewed = true,
    viewed_at = NOW(),
    updated_at = NOW()
  RETURNING view_count INTO v_view_count;

  RETURN v_view_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_hack_view_count TO authenticated;

-- Add comment for documentation
COMMENT ON COLUMN public.user_hacks.view_count IS 'Number of times the user has viewed this hack';
COMMENT ON FUNCTION public.increment_hack_view_count IS 'Increments the view count for a hack and returns the new count';