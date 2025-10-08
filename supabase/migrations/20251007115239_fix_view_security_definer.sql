-- Fix security issues with views
-- Views should use SECURITY INVOKER (the default) to respect the querying user's permissions
-- SECURITY DEFINER should only be used for functions that need elevated privileges

-- Drop existing views first
DROP VIEW IF EXISTS public.hack_details CASCADE;
DROP VIEW IF EXISTS public.user_hack_progress CASCADE;

-- Recreate hack_details view without SECURITY DEFINER
-- This view aggregates hack information with creator details and stats
CREATE VIEW public.hack_details AS
SELECT
  h.*,
  p.name as creator_name,
  p.avatar_url as creator_avatar,
  COUNT(DISTINCT uh.user_id) FILTER (WHERE uh.liked = true) as likes_count,
  COUNT(DISTINCT uh.user_id) FILTER (WHERE uh.viewed = true) as views_count
FROM public.hacks h
LEFT JOIN public.profiles p ON h.created_by = p.id
LEFT JOIN public.user_hacks uh ON h.id = uh.hack_id
GROUP BY h.id, p.name, p.avatar_url;

-- Recreate user_hack_progress view without SECURITY DEFINER
-- This view shows user progress on hacks
CREATE VIEW public.user_hack_progress AS
SELECT
  h.id,
  h.slug,
  h.name,
  h.difficulty,
  uh.user_id,
  uh.started_at,
  uh.completed_at,
  uh.status,
  CASE
    WHEN uh.completed_at IS NOT NULL THEN 'completed'
    WHEN uh.started_at IS NOT NULL THEN 'in_progress'
    ELSE 'not_started'
  END as progress_status
FROM public.hacks h
LEFT JOIN public.user_hacks uh ON h.id = uh.hack_id;

-- Re-grant permissions on the views
GRANT SELECT ON public.hack_details TO anon, authenticated;
GRANT SELECT ON public.user_hack_progress TO anon, authenticated;

-- Add helpful comments
COMMENT ON VIEW public.hack_details IS 'Aggregated view of hacks with creator info and engagement stats';
COMMENT ON VIEW public.user_hack_progress IS 'View showing user progress status for each hack';

-- Note: These views will automatically respect the Row Level Security (RLS) policies
-- of the underlying tables (hacks, profiles, user_hacks), which is the desired behavior