-- Production seed data for NRGHax
-- This script adds essential initial data for production

-- Only insert if tables are empty (safe for re-running)

-- Insert tags if they don't exist
INSERT INTO public.tags (name, slug, tag_type, description, category, color)
SELECT * FROM (VALUES
  ('Productivity', 'productivity', 'content', 'Hacks to boost your productivity', 'Lifestyle', '#fb0'),
  ('Sleep', 'sleep', 'content', 'Improve your sleep quality', 'Health', '#6366F1'),
  ('Exercise', 'exercise', 'content', 'Physical fitness and movement', 'Health', '#F59E0B'),
  ('Nutrition', 'nutrition', 'content', 'Dietary and nutrition hacks', 'Health', '#EF4444'),
  ('Focus', 'focus', 'content', 'Improve concentration and focus', 'Mental', '#8B5CF6'),
  ('Stress', 'stress', 'content', 'Stress management techniques', 'Mental', '#EC4899'),
  ('Morning', 'morning', 'content', 'Morning routine optimization', 'Lifestyle', '#14B8A6'),
  ('Evening', 'evening', 'content', 'Evening routine optimization', 'Lifestyle', '#F97316'),
  ('Beginner', 'beginner', 'user_experience', 'Suitable for beginners', 'Level', '#22C55E'),
  ('Advanced', 'advanced', 'user_experience', 'For experienced users', 'Level', '#DC2626'),
  ('confidence', 'confidence', 'content', 'Build self-confidence and assertiveness', '#FF6B6B', NULL),
  ('energy', 'energy', 'content', 'Boost physical and mental energy levels', '#4ECDC4', NULL),
  ('social', 'social', 'content', 'Improve social skills and connections', '#45B7D1', NULL),
  ('mindfulness', 'mindfulness', 'content', 'Develop awareness and presence', '#9B59B6', NULL),
  ('strength', 'strength', 'content', 'Build mental and physical resilience', '#F39C12', NULL),
  ('quick', 'quick', 'content', '5 minutes or less', '#2ECC71', NULL)
) AS v(name, slug, tag_type, description, category, color)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tags WHERE tags.slug = v.slug
);

-- Insert initial hacks
INSERT INTO public.hacks (name, slug, description, content_type, content_body, difficulty, time_minutes, category)
SELECT * FROM (VALUES
  ('Morning Sunlight Exposure', 'morning-sunlight', 'Get 10-30 minutes of sunlight within 30 minutes of waking', 'content',
   E'# Morning Sunlight Exposure\n\n## Why It Works\n\nExposure to bright light early in the day helps regulate your circadian rhythm, improving both sleep quality and daytime alertness.\n\n## How to Do It\n\n1. Go outside within 30 minutes of waking\n2. Spend 10-30 minutes in direct sunlight\n3. Don''t wear sunglasses during this time\n4. If it''s cloudy, spend more time (20-40 minutes)\n\n## Benefits\n\n- Better sleep at night\n- Increased daytime energy\n- Improved mood\n- Better vitamin D production',
   'Beginner', 20, 'energy'),

  ('Box Breathing', 'box-breathing', '4-4-4-4 breathing technique for instant calm', 'content',
   E'# Box Breathing Technique\n\n## What Is It?\n\nA powerful stress-reduction technique used by Navy SEALs and first responders.\n\n## Steps\n\n1. Exhale completely\n2. Inhale through nose for 4 counts\n3. Hold breath for 4 counts\n4. Exhale through mouth for 4 counts\n5. Hold empty for 4 counts\n6. Repeat 4-8 times\n\n## When to Use\n\n- Before stressful situations\n- When feeling anxious\n- To improve focus\n- Before sleep',
   'Beginner', 5, 'strength'),

  ('Pomodoro Technique', 'pomodoro', '25-minute focused work sessions', 'content',
   E'# The Pomodoro Technique\n\n## How It Works\n\n1. Choose a task\n2. Set timer for 25 minutes\n3. Work with full focus\n4. Take a 5-minute break\n5. After 4 pomodoros, take a 15-30 minute break\n\n## Tips for Success\n\n- Turn off all notifications\n- Have a notepad for random thoughts\n- Don''t skip breaks\n- Track your pomodoros',
   'Beginner', 30, 'productivity'),

  ('Power Pose', 'power-pose', 'Stand in a confident posture for 2 minutes to boost confidence', 'content',
   E'# Power Pose Challenge\n\n## The Science\n\nResearch shows that standing in powerful positions for just 2 minutes can increase testosterone and decrease cortisol levels.\n\n## How to Power Pose\n\n1. Stand with feet shoulder-width apart\n2. Place hands on hips or raise arms in victory\n3. Lift chin slightly and expand chest\n4. Hold for 2 full minutes\n5. Breathe deeply and visualize success\n\n## Best Times to Use\n\n- Before important meetings\n- Before presentations\n- Start of your day\n- Before social events',
   'Beginner', 2, 'confidence'),

  ('2-Minute Rule', 'two-minute-rule', 'If it takes less than 2 minutes, do it now', 'content',
   E'# The 2-Minute Rule\n\n## The Principle\n\nAny task that takes less than 2 minutes should be done immediately rather than added to your to-do list.\n\n## Why It Works\n\n- Prevents small tasks from piling up\n- Reduces mental clutter\n- Creates momentum\n- Eliminates procrastination on simple tasks\n\n## Implementation\n\n1. When a task comes up, estimate the time\n2. If under 2 minutes, do it immediately\n3. If over 2 minutes, schedule it\n4. Batch similar 2-minute tasks together\n5. Use a timer to stay honest',
   'Beginner', 2, 'productivity')
) AS v(name, slug, description, content_type, content_body, difficulty, time_minutes, category)
WHERE NOT EXISTS (
  SELECT 1 FROM public.hacks WHERE hacks.slug = v.slug
);

-- Ensure admin emails are set up
INSERT INTO public.admin_emails (email)
SELECT email FROM (VALUES
  ('bbabkin@gmail.com'),
  ('boris@practiceenergy.com'),
  ('admin@nrghax.com')
) AS v(email)
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_emails WHERE admin_emails.email = v.email
);

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('hack-images', 'hack-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Verify the setup
SELECT
  'Tags' as entity,
  COUNT(*) as count
FROM public.tags
UNION ALL
SELECT
  'Hacks' as entity,
  COUNT(*) as count
FROM public.hacks
UNION ALL
SELECT
  'Admin Emails' as entity,
  COUNT(*) as count
FROM public.admin_emails
UNION ALL
SELECT
  'Storage Buckets' as entity,
  COUNT(*) as count
FROM storage.buckets;