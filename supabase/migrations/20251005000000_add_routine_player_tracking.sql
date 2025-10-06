-- Add routine player position tracking columns
-- This migration enables auto-play functionality by tracking user's current position in a routine

-- Add columns to user_routines table for tracking playback position
ALTER TABLE public.user_routines
ADD COLUMN IF NOT EXISTS current_hack_position INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_played_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS autoplay_enabled BOOLEAN DEFAULT true;

-- Add index for faster queries on last played routines
CREATE INDEX IF NOT EXISTS idx_user_routines_last_played
ON public.user_routines(user_id, last_played_at DESC)
WHERE last_played_at IS NOT NULL;

-- Add index for current position queries
CREATE INDEX IF NOT EXISTS idx_user_routines_position
ON public.user_routines(user_id, routine_id, current_hack_position);

-- Add comments for documentation
COMMENT ON COLUMN public.user_routines.current_hack_position IS 'Zero-based index of the current hack in the routine that the user is on';
COMMENT ON COLUMN public.user_routines.last_played_at IS 'Timestamp of when the user last accessed the routine player';
COMMENT ON COLUMN public.user_routines.autoplay_enabled IS 'User preference for auto-advancing to next hack when video ends';

-- Create function to update routine position
CREATE OR REPLACE FUNCTION public.update_routine_position(
  p_routine_id UUID,
  p_position INT,
  p_total_hacks INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_progress INT;
  v_result JSONB;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Calculate progress if total hacks provided
  IF p_total_hacks IS NOT NULL AND p_total_hacks > 0 THEN
    v_progress := FLOOR((p_position::NUMERIC / p_total_hacks) * 100);
  END IF;

  -- Upsert user_routines record
  INSERT INTO public.user_routines (
    user_id,
    routine_id,
    current_hack_position,
    last_played_at,
    progress,
    started,
    started_at
  ) VALUES (
    v_user_id,
    p_routine_id,
    p_position,
    NOW(),
    COALESCE(v_progress, 0),
    true,
    COALESCE((SELECT started_at FROM public.user_routines WHERE user_id = v_user_id AND routine_id = p_routine_id), NOW())
  )
  ON CONFLICT (user_id, routine_id)
  DO UPDATE SET
    current_hack_position = p_position,
    last_played_at = NOW(),
    progress = COALESCE(v_progress, user_routines.progress),
    started = true,
    started_at = COALESCE(user_routines.started_at, NOW()),
    updated_at = NOW()
  RETURNING
    jsonb_build_object(
      'id', id,
      'current_hack_position', current_hack_position,
      'progress', progress,
      'last_played_at', last_played_at
    ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_routine_position TO authenticated;

-- Create function to toggle autoplay preference
CREATE OR REPLACE FUNCTION public.toggle_routine_autoplay(
  p_routine_id UUID,
  p_enabled BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Update autoplay preference
  UPDATE public.user_routines
  SET
    autoplay_enabled = p_enabled,
    updated_at = NOW()
  WHERE
    user_id = v_user_id
    AND routine_id = p_routine_id;

  -- Insert if not exists
  IF NOT FOUND THEN
    INSERT INTO public.user_routines (
      user_id,
      routine_id,
      autoplay_enabled
    ) VALUES (
      v_user_id,
      p_routine_id,
      p_enabled
    );
  END IF;

  RETURN p_enabled;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.toggle_routine_autoplay TO authenticated;

-- Create view for routine play state
CREATE OR REPLACE VIEW public.routine_play_state AS
SELECT
  ur.id,
  ur.user_id,
  ur.routine_id,
  ur.current_hack_position,
  ur.last_played_at,
  ur.autoplay_enabled,
  ur.progress,
  ur.started,
  ur.completed,
  ur.started_at,
  ur.completed_at,
  r.name as routine_name,
  r.slug as routine_slug,
  (
    SELECT COUNT(*)
    FROM public.routine_hacks rh
    WHERE rh.routine_id = ur.routine_id
  ) as total_hacks,
  (
    SELECT json_agg(
      json_build_object(
        'hack_id', uh.hack_id,
        'viewed', uh.viewed,
        'viewed_at', uh.viewed_at
      )
      ORDER BY uh.viewed_at DESC
    )
    FROM public.user_hacks uh
    JOIN public.routine_hacks rh ON uh.hack_id = rh.hack_id
    WHERE uh.user_id = ur.user_id
      AND rh.routine_id = ur.routine_id
      AND uh.viewed = true
  ) as completed_hacks
FROM public.user_routines ur
JOIN public.routines r ON r.id = ur.routine_id
WHERE ur.user_id = auth.uid();

-- Grant select on view
GRANT SELECT ON public.routine_play_state TO authenticated;

COMMENT ON VIEW public.routine_play_state IS 'Comprehensive view of user routine playback state including position, progress, and completed hacks';
COMMENT ON FUNCTION public.update_routine_position IS 'Updates user current position in a routine and calculates progress percentage';
COMMENT ON FUNCTION public.toggle_routine_autoplay IS 'Toggles autoplay preference for a specific routine';
