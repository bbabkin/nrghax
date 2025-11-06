-- Seed file for NRGHax development
-- This file will be run after migrations during `supabase db reset`

-- Add admin email (for development/testing)
INSERT INTO public.admin_emails (email) VALUES ('admin@example.com'), ('test@test.com')
ON CONFLICT (email) DO NOTHING;

-- Insert sample tags
INSERT INTO public.tags (name, slug, tag_type, description, category, color) VALUES
  ('Productivity', 'productivity', 'content', 'Hacks to boost your productivity', 'Lifestyle', '#fb0'),
  ('Sleep', 'sleep', 'content', 'Improve your sleep quality', 'Health', '#6366F1'),
  ('Exercise', 'exercise', 'content', 'Physical fitness and movement', 'Health', '#F59E0B'),
  ('Nutrition', 'nutrition', 'content', 'Dietary and nutrition hacks', 'Health', '#EF4444'),
  ('Focus', 'focus', 'content', 'Improve concentration and focus', 'Mental', '#8B5CF6'),
  ('Stress', 'stress', 'content', 'Stress management techniques', 'Mental', '#EC4899'),
  ('Morning', 'morning', 'content', 'Morning routine optimization', 'Lifestyle', '#14B8A6'),
  ('Evening', 'evening', 'content', 'Evening routine optimization', 'Lifestyle', '#F97316'),
  ('Beginner', 'beginner', 'user_experience', 'Suitable for beginners', 'Level', '#22C55E'),
  ('Advanced', 'advanced', 'user_experience', 'For experienced users', 'Level', '#DC2626')
ON CONFLICT (slug) DO NOTHING;

-- Note: Hacks and Routines are now managed by the migration file:
-- See: supabase/migrations/20251105162646_simplify_to_5_hacks_and_2_routines.sql
-- That migration creates:
--   - 5 Hacks with linear progression
--   - 2 Routines with proper hack associations

-- Note: User-specific data will be created when users sign up and interact with the app
