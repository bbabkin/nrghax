-- Add completion_count column to track repetitions for color progression system
-- Color progression: 1x=green, 2-10x=blue, 11-50x=purple, 50+=orange
ALTER TABLE public.user_hacks
ADD COLUMN IF NOT EXISTS completion_count INTEGER DEFAULT 0 CHECK (completion_count >= 0);

-- Create index for better query performance when fetching user progress
CREATE INDEX IF NOT EXISTS idx_user_hacks_completion_count
ON public.user_hacks(user_id, hack_id, completion_count);

-- Update existing records to set completion_count based on completion status
-- If completed_at is set, they've completed it at least once
UPDATE public.user_hacks
SET completion_count = 1
WHERE completed_at IS NOT NULL AND completion_count = 0;

-- Create a function to increment completion count
CREATE OR REPLACE FUNCTION public.increment_hack_completion(
  p_user_id UUID,
  p_hack_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Insert or update the user_hack record
  INSERT INTO public.user_hacks (user_id, hack_id, viewed, viewed_at, completion_count, completed_at)
  VALUES (p_user_id, p_hack_id, true, NOW(), 1, NOW())
  ON CONFLICT (user_id, hack_id)
  DO UPDATE SET
    completion_count = COALESCE(user_hacks.completion_count, 0) + 1,
    completed_at = CASE
      WHEN user_hacks.completed_at IS NULL THEN NOW()
      ELSE user_hacks.completed_at
    END,
    viewed = true,
    viewed_at = CASE
      WHEN user_hacks.viewed_at IS NULL THEN NOW()
      ELSE user_hacks.viewed_at
    END,
    updated_at = NOW()
  RETURNING completion_count INTO v_count;

  RETURN v_count;
END;
$$;

-- Create a function to get color based on completion count
CREATE OR REPLACE FUNCTION public.get_hack_color(
  p_completion_count INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_completion_count IS NULL OR p_completion_count = 0 THEN
    RETURN 'gray';
  ELSIF p_completion_count = 1 THEN
    RETURN 'green';
  ELSIF p_completion_count <= 10 THEN
    RETURN 'blue';
  ELSIF p_completion_count <= 50 THEN
    RETURN 'purple';
  ELSE
    RETURN 'orange';
  END IF;
END;
$$;

-- Drop existing view if it exists and create a new view to get user hack progress with colors
DROP VIEW IF EXISTS public.user_hack_progress;
CREATE VIEW public.user_hack_progress AS
SELECT
  uh.user_id,
  uh.hack_id,
  uh.completion_count,
  uh.view_count,
  uh.completed_at,
  uh.viewed_at,
  public.get_hack_color(uh.completion_count) as color,
  h.name as hack_name,
  h.slug as hack_slug,
  h.duration_minutes,
  CASE
    WHEN hcp.total_checks > 0 THEN
      ROUND((hcp.completed_checks::NUMERIC / hcp.total_checks) * 100)
    ELSE 0
  END as completion_percentage
FROM public.user_hacks uh
JOIN public.hacks h ON h.id = uh.hack_id
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) as total_checks,
    COUNT(CASE WHEN uhc.completed_at IS NOT NULL THEN 1 END) as completed_checks
  FROM public.hack_checks hc
  LEFT JOIN public.user_hack_checks uhc ON uhc.hack_check_id = hc.id AND uhc.user_id = uh.user_id
  WHERE hc.hack_id = uh.hack_id
) hcp ON true;

-- Grant appropriate permissions
GRANT SELECT ON public.user_hack_progress TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_hack_completion TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_hack_color TO authenticated;

-- Add RLS policy for the view
ALTER VIEW public.user_hack_progress SET (security_invoker = true);

-- Add comment for documentation
COMMENT ON COLUMN public.user_hacks.completion_count IS 'Number of times user has completed this hack. Used for color progression: 1x=green, 2-10x=blue, 11-50x=purple, 50+=orange';
COMMENT ON FUNCTION public.get_hack_color IS 'Returns color name based on completion count for UI progression system';
COMMENT ON FUNCTION public.increment_hack_completion IS 'Safely increments the completion count for a hack and returns the new count';
