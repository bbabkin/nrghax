-- Production-ready migration
-- This ensures all necessary components are in place

-- Ensure handle_new_user function exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger for profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_hacks_slug ON public.hacks(slug);
CREATE INDEX IF NOT EXISTS idx_hacks_created_at ON public.hacks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON public.tags(slug);
CREATE INDEX IF NOT EXISTS idx_user_hacks_completed ON public.user_hacks(user_id, completed_at) WHERE completed_at IS NOT NULL;

-- Create view for hack progress
CREATE OR REPLACE VIEW public.user_hack_progress AS
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

-- Grant permissions
GRANT SELECT ON public.user_hack_progress TO authenticated;
GRANT SELECT ON public.user_hack_progress TO anon;

-- Add helpful comments
COMMENT ON TABLE public.profiles IS 'User profiles with admin status';
COMMENT ON TABLE public.hacks IS 'Energy system learning challenges';
COMMENT ON TABLE public.user_hacks IS 'User progress and interaction with hacks';
COMMENT ON TABLE public.hack_prerequisites IS 'Prerequisites required before accessing certain hacks';
COMMENT ON COLUMN public.profiles.is_admin IS 'Admin users can create/edit/delete hacks';
COMMENT ON COLUMN public.hacks.is_locked IS 'Whether hack requires prerequisites to unlock';