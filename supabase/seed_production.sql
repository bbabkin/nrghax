-- Production seed data
-- Run this after migrations to add initial content

-- Essential tags for user experience levels
INSERT INTO public.tags (name, slug, tag_type) VALUES
  ('Beginner', 'beginner', 'user_experience'),
  ('Intermediate', 'intermediate', 'user_experience'),
  ('Advanced', 'advanced', 'user_experience'),
  ('Expert', 'expert', 'user_experience')
ON CONFLICT (slug) DO NOTHING;

-- Core interest tags
INSERT INTO public.tags (name, slug, tag_type) VALUES
  ('Solar Energy', 'solar-energy', 'user_interest'),
  ('Wind Energy', 'wind-energy', 'user_interest'),
  ('Energy Storage', 'energy-storage', 'user_interest'),
  ('Grid Systems', 'grid-systems', 'user_interest'),
  ('Sustainability', 'sustainability', 'user_interest')
ON CONFLICT (slug) DO NOTHING;

-- Hack category tags
INSERT INTO public.tags (name, slug, tag_type) VALUES
  ('Solar', 'solar', 'hack_category'),
  ('Wind', 'wind', 'hack_category'),
  ('Storage', 'storage', 'hack_category'),
  ('Grid', 'grid', 'hack_category'),
  ('Fundamentals', 'fundamentals', 'hack_category')
ON CONFLICT (slug) DO NOTHING;

-- Note: Actual hacks should be added via admin interface
-- This ensures proper user attribution and content management