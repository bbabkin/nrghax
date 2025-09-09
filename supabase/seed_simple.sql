-- Simple seed file with test users and data

-- Create test users directly
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES 
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'test@test.com',
    '$2a$10$PkfZL5y1p1UUQZ2dYczwjuOS.i6D/aGFdX7S8TtmY5TpMq2u6.Mhe', -- test123
    NOW(),
    '{"provider": "email", "providers": ["email"], "is_admin": true}',
    '{"full_name": "Test Admin"}',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'user@test.com',
    '$2a$10$PkfZL5y1p1UUQZ2dYczwjuOS.i6D/aGFdX7S8TtmY5TpMq2u6.Mhe', -- test123
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Test User"}',
    NOW(),
    NOW()
  );

-- Create profiles
INSERT INTO public.profiles (id, email, full_name, avatar_url, is_admin, created_at, updated_at)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'test@test.com', 'Test Admin', NULL, true, NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000002', 'user@test.com', 'Test User', NULL, false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create tags
INSERT INTO public.tags (id, name, slug, category, color, created_at, updated_at)
VALUES 
  ('b0000000-0000-0000-0000-000000000001', 'Renewable Energy', 'renewable-energy', 'skill', '#22c55e', NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000002', 'Solar Power', 'solar-power', 'skill', '#facc15', NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000003', 'Wind Energy', 'wind-energy', 'skill', '#60a5fa', NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000004', 'Battery Storage', 'battery-storage', 'skill', '#a78bfa', NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000005', 'Grid Systems', 'grid-systems', 'skill', '#f97316', NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000006', 'Energy Efficiency', 'energy-efficiency', 'interest', '#06b6d4', NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000007', 'Smart Grid', 'smart-grid', 'interest', '#8b5cf6', NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000008', 'Beginner', 'beginner', 'level', '#10b981', NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000009', 'Intermediate', 'intermediate', 'level', '#f59e0b', NOW(), NOW()),
  ('b0000000-0000-0000-0000-00000000000a', 'Advanced', 'advanced', 'level', '#ef4444', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Create hacks
INSERT INTO public.hacks (id, title, slug, description, difficulty, points, category, is_active, created_at, updated_at)
VALUES 
  (
    'c0000000-0000-0000-0000-000000000001',
    'Solar Panel Efficiency Calculator',
    'solar-panel-efficiency',
    'Build a calculator to determine optimal solar panel placement and efficiency based on location, weather patterns, and energy needs.',
    'beginner',
    100,
    'renewable',
    true,
    NOW(),
    NOW()
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'Smart Grid Load Balancer',
    'smart-grid-load-balancer',
    'Design an algorithm to balance electricity load across a smart grid, minimizing waste and maximizing renewable energy usage.',
    'intermediate',
    250,
    'grid',
    true,
    NOW(),
    NOW()
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'Battery Storage Optimizer',
    'battery-storage-optimizer',
    'Create a system to optimize battery storage and discharge cycles based on energy prices and demand patterns.',
    'advanced',
    500,
    'storage',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;

-- Link hacks with tags
INSERT INTO public.hack_tags (hack_id, tag_id, created_at)
VALUES 
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', NOW()), -- Solar Panel -> Renewable Energy
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', NOW()), -- Solar Panel -> Solar Power
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000008', NOW()), -- Solar Panel -> Beginner
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', NOW()), -- Smart Grid -> Grid Systems
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000007', NOW()), -- Smart Grid -> Smart Grid
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000009', NOW()), -- Smart Grid -> Intermediate
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', NOW()), -- Battery -> Battery Storage
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000006', NOW()), -- Battery -> Energy Efficiency
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-00000000000a', NOW()) -- Battery -> Advanced
ON CONFLICT (hack_id, tag_id) DO NOTHING;

-- Add tags to users
INSERT INTO public.user_tags (user_id, tag_id, source, created_at)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'manual', NOW()), -- Admin -> Renewable Energy
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', 'manual', NOW()), -- Admin -> Smart Grid
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'manual', NOW()), -- User -> Solar Power
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000008', 'manual', NOW()) -- User -> Beginner
ON CONFLICT (user_id, tag_id) DO NOTHING;