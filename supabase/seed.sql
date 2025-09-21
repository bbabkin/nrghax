-- Seed file for NRGHax development
-- This file will be run after migrations during `supabase db reset`

-- Insert sample tags
INSERT INTO public.tags (name, slug, tag_type, description, category, color) VALUES
  ('Productivity', 'productivity', 'content', 'Hacks to boost your productivity', 'Lifestyle', '#10B981'),
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

-- Insert sample hacks (only in development)
INSERT INTO public.hacks (name, slug, description, content_type, content_body, difficulty, time_minutes) VALUES
  ('Morning Sunlight Exposure', 'morning-sunlight', 'Get 10-30 minutes of sunlight within 30 minutes of waking', 'content',
   E'# Morning Sunlight Exposure\n\n## Why It Works\n\nExposure to bright light early in the day helps regulate your circadian rhythm, improving both sleep quality and daytime alertness.\n\n## How to Do It\n\n1. Go outside within 30 minutes of waking\n2. Spend 10-30 minutes in direct sunlight\n3. Don''t wear sunglasses during this time\n4. If it''s cloudy, spend more time (20-40 minutes)\n\n## Benefits\n\n- Better sleep at night\n- Increased daytime energy\n- Improved mood\n- Better vitamin D production',
   'Beginner', 20),

  ('Box Breathing', 'box-breathing', '4-4-4-4 breathing technique for instant calm', 'content',
   E'# Box Breathing Technique\n\n## What Is It?\n\nA powerful stress-reduction technique used by Navy SEALs and first responders.\n\n## Steps\n\n1. Exhale completely\n2. Inhale through nose for 4 counts\n3. Hold breath for 4 counts\n4. Exhale through mouth for 4 counts\n5. Hold empty for 4 counts\n6. Repeat 4-8 times\n\n## When to Use\n\n- Before stressful situations\n- When feeling anxious\n- To improve focus\n- Before sleep',
   'Beginner', 5),

  ('Pomodoro Technique', 'pomodoro', '25-minute focused work sessions', 'content',
   E'# The Pomodoro Technique\n\n## How It Works\n\n1. Choose a task\n2. Set timer for 25 minutes\n3. Work with full focus\n4. Take a 5-minute break\n5. After 4 pomodoros, take a 15-30 minute break\n\n## Tips for Success\n\n- Turn off all notifications\n- Have a notepad for random thoughts\n- Don''t skip breaks\n- Track your pomodoros',
   'Beginner', 30),

  ('Cold Shower Finish', 'cold-shower', 'End showers with 30-60 seconds of cold water', 'content',
   E'# Cold Shower Protocol\n\n## Benefits\n\n- Increased alertness\n- Improved circulation\n- Enhanced mood\n- Better stress resilience\n\n## How to Start\n\n1. Take your normal warm shower\n2. Gradually decrease temperature\n3. End with 30-60 seconds of cold\n4. Focus on controlled breathing\n5. Increase duration over time',
   'Intermediate', 10)
ON CONFLICT (slug) DO NOTHING;

-- Note: User-specific data will be created when users sign up and interact with the app