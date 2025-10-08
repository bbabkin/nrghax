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

-- Insert sample hacks (only in development)
INSERT INTO public.hacks (name, slug, description, content_type, content_body, difficulty, time_minutes, category, external_link, media_url, media_type) VALUES
  ('Morning Sunlight Exposure', 'morning-sunlight', 'Get 10-30 minutes of sunlight within 30 minutes of waking', 'content',
   E'# Morning Sunlight Exposure\n\n## Why It Works\n\nExposure to bright light early in the day helps regulate your circadian rhythm, improving both sleep quality and daytime alertness.\n\n## How to Do It\n\n1. Go outside within 30 minutes of waking\n2. Spend 10-30 minutes in direct sunlight\n3. Don''t wear sunglasses during this time\n4. If it''s cloudy, spend more time (20-40 minutes)\n\n## Benefits\n\n- Better sleep at night\n- Increased daytime energy\n- Improved mood\n- Better vitamin D production',
   'Beginner', 20, 'energy', NULL, NULL, NULL),

  ('Box Breathing', 'box-breathing', '4-4-4-4 breathing technique for instant calm', 'content',
   E'# Box Breathing Technique\n\n## What Is It?\n\nA powerful stress-reduction technique used by Navy SEALs and first responders.\n\n## Steps\n\n1. Exhale completely\n2. Inhale through nose for 4 counts\n3. Hold breath for 4 counts\n4. Exhale through mouth for 4 counts\n5. Hold empty for 4 counts\n6. Repeat 4-8 times\n\n## When to Use\n\n- Before stressful situations\n- When feeling anxious\n- To improve focus\n- Before sleep',
   'Beginner', 5, 'strength', NULL, NULL, NULL),

  ('Pomodoro Technique', 'pomodoro', '25-minute focused work sessions', 'content',
   E'# The Pomodoro Technique\n\n## How It Works\n\n1. Choose a task\n2. Set timer for 25 minutes\n3. Work with full focus\n4. Take a 5-minute break\n5. After 4 pomodoros, take a 15-30 minute break\n\n## Tips for Success\n\n- Turn off all notifications\n- Have a notepad for random thoughts\n- Don''t skip breaks\n- Track your pomodoros',
   'Beginner', 30, 'productivity', NULL, NULL, NULL),

  ('Cold Shower Finish', 'cold-shower', 'End showers with 30-60 seconds of cold water', 'content',
   E'# Cold Shower Protocol\n\n## Benefits\n\n- Increased alertness\n- Improved circulation\n- Enhanced mood\n- Better stress resilience\n\n## How to Start\n\n1. Take your normal warm shower\n2. Gradually decrease temperature\n3. End with 30-60 seconds of cold\n4. Focus on controlled breathing\n5. Increase duration over time',
   'Intermediate', 10, 'confidence', NULL, NULL, NULL),

  ('Power Pose', 'power-pose', 'Stand in a confident posture for 2 minutes to boost confidence', 'content',
   E'# Power Pose Challenge\n\n## The Science\n\nResearch shows that standing in powerful positions for just 2 minutes can increase testosterone and decrease cortisol levels.\n\n## How to Power Pose\n\n1. Stand with feet shoulder-width apart\n2. Place hands on hips or raise arms in victory\n3. Lift chin slightly and expand chest\n4. Hold for 2 full minutes\n5. Breathe deeply and visualize success\n\n## Best Times to Use\n\n- Before important meetings\n- Before presentations\n- Start of your day\n- Before social events',
   'Beginner', 2, 'confidence', NULL, NULL, NULL),

  ('FORD Method', 'ford-method', 'Never run out of conversation topics with this simple framework', 'content',
   E'# FORD Conversation Method\n\n## What Does FORD Stand For?\n\n- **F**amily: Ask about family, relationships, pets\n- **O**ccupation: Work, studies, career goals\n- **R**ecreation: Hobbies, interests, fun activities\n- **D**reams: Goals, aspirations, bucket list\n\n## How to Use It\n\n1. Start with one topic that feels natural\n2. Ask open-ended questions\n3. Listen actively and ask follow-ups\n4. Share related experiences\n5. Transition smoothly between topics\n\n## Example Questions\n\n- Family: "Do you have any siblings?"\n- Occupation: "What got you interested in your field?"\n- Recreation: "What do you like to do for fun?"\n- Dreams: "Any exciting plans for the future?"',
   'Beginner', 10, 'social', NULL, NULL, NULL),

  ('2-Minute Rule', 'two-minute-rule', 'If it takes less than 2 minutes, do it now', 'content',
   E'# The 2-Minute Rule\n\n## The Principle\n\nAny task that takes less than 2 minutes should be done immediately rather than added to your to-do list.\n\n## Why It Works\n\n- Prevents small tasks from piling up\n- Reduces mental clutter\n- Creates momentum\n- Eliminates procrastination on simple tasks\n\n## Implementation\n\n1. When a task comes up, estimate the time\n2. If under 2 minutes, do it immediately\n3. If over 2 minutes, schedule it\n4. Batch similar 2-minute tasks together\n5. Use a timer to stay honest\n\n## Examples\n\n- Reply to a simple email\n- File a document\n- Make your bed\n- Wash a dish\n- Send a quick message',
   'Beginner', 2, 'productivity', NULL, NULL, NULL),

  ('Gratitude Journal', 'gratitude-journal', 'Write 3 things you are grateful for each day', 'content',
   E'# Daily Gratitude Practice\n\n## The Practice\n\nSpend 5 minutes each day writing down 3 things you are grateful for.\n\n## How to Do It Right\n\n1. Be specific - not just "family" but "my sister''s encouraging text"\n2. Include why you are grateful\n3. Feel the emotion for 20 seconds\n4. Include different categories each day\n5. Write by hand if possible\n\n## Categories to Consider\n\n- People in your life\n- Personal strengths\n- Opportunities you have\n- Simple pleasures\n- Lessons learned\n- Progress made\n\n## Benefits\n\n- 23% increase in happiness (research-backed)\n- Better sleep quality\n- Improved relationships\n- Reduced anxiety and depression',
   'Beginner', 5, 'strength', NULL, NULL, NULL),

  ('Eye Contact Practice', 'eye-contact', 'Build confidence through better eye contact', 'content',
   E'# Eye Contact Training\n\n## Why It Matters\n\nGood eye contact signals confidence, trustworthiness, and engagement.\n\n## Progressive Training\n\n### Week 1: Mirror Practice\n- Look yourself in the eyes for 30 seconds\n- Practice different expressions\n- Notice what feels comfortable\n\n### Week 2: Video Practice\n- Watch videos and maintain eye contact with speakers\n- Practice during video calls\n\n### Week 3: Real World\n- Hold eye contact for 3-5 seconds when greeting\n- Use the triangle technique (eyes and mouth)\n- Look away briefly every 5-7 seconds\n\n## Tips\n\n- Look at one eye at a time\n- Soften your gaze\n- Blink normally\n- Look away to the side, not down',
   'Intermediate', 5, 'social', NULL, NULL, NULL),

  ('Deep Work Blocks', 'deep-work', '90-minute focused work sessions for maximum productivity', 'content',
   E'# Deep Work Protocol\n\n## What is Deep Work?\n\nDistraction-free concentration on cognitively demanding tasks.\n\n## The 90-Minute Protocol\n\n1. **Preparation (5 min)**\n   - Clear workspace\n   - Close all unnecessary tabs\n   - Phone in another room\n   - Set 90-minute timer\n\n2. **Deep Work (90 min)**\n   - Single task focus\n   - No email/messages\n   - No context switching\n\n3. **Recovery (15 min)**\n   - Walk or stretch\n   - Hydrate\n   - Light snack\n   - No screens\n\n## Rules\n\n- Maximum 2 sessions per day\n- Never skip recovery\n- Track what you accomplish\n- Gradually increase difficulty',
   'Advanced', 90, 'productivity', NULL, NULL, NULL),

  -- Video-based hacks for testing video player
  ('Wim Hof Breathing', 'wim-hof-breathing', 'Powerful breathing technique for energy and immunity', 'link',
   E'# Wim Hof Breathing Method\n\n## Overview\n\nA powerful breathing technique that can boost energy, reduce stress, and strengthen your immune system.\n\n## Watch the Video\n\nFollow along with this guided breathing session.',
   'Advanced', 11, 'energy', 'https://www.youtube.com/watch?v=tybOi4hjZFQ', 'https://www.youtube.com/watch?v=tybOi4hjZFQ', 'youtube'),

  ('Morning Yoga Flow', 'morning-yoga-flow', '10-minute energizing yoga sequence to start your day', 'link',
   E'# Morning Yoga Flow\n\n## Benefits\n\n- Increases energy and alertness\n- Improves flexibility\n- Reduces morning stiffness\n- Sets a positive tone for the day\n\n## Follow Along\n\nThis 10-minute flow is perfect for beginners.',
   'Beginner', 10, 'energy', 'https://www.youtube.com/watch?v=VaoV1PrYft4', 'https://www.youtube.com/watch?v=VaoV1PrYft4', 'youtube'),

  ('HIIT Workout', 'hiit-workout', '15-minute high-intensity interval training session', 'link',
   E'# HIIT Workout Session\n\n## What is HIIT?\n\nHigh-Intensity Interval Training alternates short bursts of intense exercise with recovery periods.\n\n## Benefits\n\n- Burns calories efficiently\n- Improves cardiovascular health\n- Can be done anywhere\n- Time-efficient\n\n## Let''s Get Started\n\nFollow along with this 15-minute session.',
   'Intermediate', 15, 'strength', 'https://www.youtube.com/watch?v=ml6cT4AZdqI', 'https://www.youtube.com/watch?v=ml6cT4AZdqI', 'youtube'),

  ('Meditation for Beginners', 'meditation-basics', '10-minute guided meditation for stress relief', 'link',
   E'# Guided Meditation\n\n## Perfect for Beginners\n\nThis simple guided meditation will help you:\n\n- Reduce stress and anxiety\n- Improve focus\n- Develop mindfulness\n- Feel more calm and centered\n\n## Instructions\n\nFind a quiet space, get comfortable, and press play.',
   'Beginner', 10, 'confidence', 'https://www.youtube.com/watch?v=inpok4MKVLM', 'https://www.youtube.com/watch?v=inpok4MKVLM', 'youtube'),

  ('Desk Stretches', 'desk-stretches', '5-minute stretching routine for office workers', 'link',
   E'# Desk Stretching Routine\n\n## Why Stretch?\n\n- Reduces muscle tension\n- Prevents pain and injury\n- Improves posture\n- Boosts energy\n\n## Quick Break\n\nTake 5 minutes to stretch without leaving your desk.',
   'Beginner', 5, 'energy', 'https://www.youtube.com/watch?v=EcvRX8d-8Fw', 'https://www.youtube.com/watch?v=EcvRX8d-8Fw', 'youtube'),

  -- Additional video-based hacks
  ('Evening Wind Down Yoga', 'evening-wind-down-yoga', 'Gentle 15-minute yoga to prepare for sleep', 'link',
   E'# Evening Wind Down Yoga\n\n## Benefits\n\n- Releases tension from the day\n- Calms the nervous system\n- Prepares body for restful sleep\n- Improves sleep quality\n\n## Perfect Before Bed\n\nThis gentle flow is designed to help you relax and unwind.',
   'Beginner', 15, 'energy', 'https://www.youtube.com/watch?v=BiWDsfZ3zbo', 'https://www.youtube.com/watch?v=BiWDsfZ3zbo', 'youtube'),

  ('Posture Fix Routine', 'posture-fix-routine', '10-minute routine to improve posture and reduce back pain', 'link',
   E'# Posture Correction Routine\n\n## Why It Matters\n\n- Reduces back and neck pain\n- Improves breathing\n- Boosts confidence\n- Prevents long-term damage\n\n## Daily Practice\n\nFollow along to strengthen and stretch key postural muscles.',
   'Beginner', 10, 'strength', 'https://www.youtube.com/watch?v=RqcOCBb4arc', 'https://www.youtube.com/watch?v=RqcOCBb4arc', 'youtube'),

  ('Sleep Meditation', 'sleep-meditation', '20-minute guided meditation for deep sleep', 'link',
   E'# Sleep Meditation\n\n## For Better Sleep\n\nThis guided meditation helps you:\n\n- Fall asleep faster\n- Sleep more deeply\n- Reduce nighttime anxiety\n- Wake feeling refreshed\n\n## Instructions\n\nListen in bed with eyes closed. Let the voice guide you to sleep.',
   'Beginner', 20, 'confidence', 'https://www.youtube.com/watch?v=aEqlQvczMJQ', 'https://www.youtube.com/watch?v=aEqlQvczMJQ', 'youtube'),

  ('Focus Music Session', 'focus-music-session', '2-hour deep focus music for studying or working', 'link',
   E'# Deep Focus Music\n\n## Perfect For\n\n- Studying\n- Coding\n- Writing\n- Any deep work\n\n## How to Use\n\nPlay in the background during your focus sessions. No lyrics to distract you.',
   'Beginner', 120, 'productivity', 'https://www.youtube.com/watch?v=5qap5aO4i9A', 'https://www.youtube.com/watch?v=5qap5aO4i9A', 'youtube'),

  ('Mobility Flow', 'mobility-flow', '15-minute full-body mobility routine', 'link',
   E'# Full Body Mobility\n\n## Benefits\n\n- Increases range of motion\n- Reduces injury risk\n- Improves athletic performance\n- Feels amazing\n\n## Daily Movement\n\nPerfect warm-up or standalone mobility session.',
   'Intermediate', 15, 'strength', 'https://www.youtube.com/watch?v=2jAp966bMnE', 'https://www.youtube.com/watch?v=2jAp966bMnE', 'youtube'),

  ('Confidence Building', 'confidence-building', 'TED talk on building confidence and self-esteem', 'link',
   E'# The Skill of Self Confidence\n\n## Learn How To\n\n- Build genuine confidence\n- Overcome self-doubt\n- Take action despite fear\n- Develop a growth mindset\n\n## Powerful Insights\n\nDr. Ivan Joseph shares practical strategies for building self-confidence.',
   'Beginner', 15, 'confidence', 'https://www.youtube.com/watch?v=w-HYZv6HzAs', 'https://www.youtube.com/watch?v=w-HYZv6HzAs', 'youtube'),

  ('Communication Skills', 'communication-skills', 'Learn the secrets of charismatic communication', 'link',
   E'# Charisma on Command\n\n## Master Communication\n\nLearn how to:\n\n- Make better first impressions\n- Tell engaging stories\n- Handle difficult conversations\n- Build rapport quickly\n\n## Practical Techniques\n\nApply these communication strategies immediately.',
   'Beginner', 12, 'social', 'https://www.youtube.com/watch?v=DluFA_GFuSQ', 'https://www.youtube.com/watch?v=DluFA_GFuSQ', 'youtube'),

  ('Morning Stretch Routine', 'morning-stretch-routine', '7-minute full body stretch to wake up your body', 'link',
   E'# Morning Stretching Routine\n\n## Start Your Day Right\n\n- Wake up stiff muscles\n- Increase blood flow\n- Improve flexibility\n- Energize your body\n\n## Quick & Effective\n\nPerfect for those who wake up feeling tight and sluggish.',
   'Beginner', 7, 'energy', 'https://www.youtube.com/watch?v=g_tea8ZNk5A', 'https://www.youtube.com/watch?v=g_tea8ZNk5A', 'youtube')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample routines
DO $$
DECLARE
  admin_user_id UUID;
  morning_routine_id UUID;
  workout_routine_id UUID;
  mindfulness_routine_id UUID;
  evening_routine_id UUID;
  posture_routine_id UUID;
  social_routine_id UUID;
BEGIN
  -- Get or create an admin user (using the admin email)
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@example.com';

  IF admin_user_id IS NULL THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
    VALUES (
      gen_random_uuid(),
      'admin@example.com',
      crypt('admin123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO admin_user_id;
  END IF;

  -- Create profile for admin user
  INSERT INTO public.profiles (id, email, name, is_admin, created_at, updated_at)
  VALUES (admin_user_id, 'admin@example.com', 'Admin User', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET is_admin = true;

  -- Create Morning Energy Routine with video content
  INSERT INTO public.routines (id, name, slug, description, created_by, is_public, position)
  VALUES (
    gen_random_uuid(),
    'Morning Energy Routine',
    'morning-energy-routine',
    'Start your day with energy and focus through breathing, movement, and mindfulness',
    admin_user_id,
    true,
    1
  )
  RETURNING id INTO morning_routine_id;

  -- Add hacks to Morning Energy Routine
  INSERT INTO public.routine_hacks (routine_id, hack_id, position)
  SELECT morning_routine_id, h.id, ROW_NUMBER() OVER (ORDER BY
    CASE h.slug
      WHEN 'morning-stretch-routine' THEN 1
      WHEN 'wim-hof-breathing' THEN 2
      WHEN 'morning-yoga-flow' THEN 3
      WHEN 'morning-sunlight' THEN 4
      WHEN 'gratitude-journal' THEN 5
    END)
  FROM public.hacks h
  WHERE h.slug IN ('morning-stretch-routine', 'wim-hof-breathing', 'morning-yoga-flow', 'morning-sunlight', 'gratitude-journal');

  -- Create Workout & Fitness Routine
  INSERT INTO public.routines (id, name, slug, description, created_by, is_public, position)
  VALUES (
    gen_random_uuid(),
    'Complete Workout Session',
    'complete-workout-session',
    'Full workout with mobility warmup, HIIT training, stretching, and recovery',
    admin_user_id,
    true,
    2
  )
  RETURNING id INTO workout_routine_id;

  -- Add hacks to Workout Routine
  INSERT INTO public.routine_hacks (routine_id, hack_id, position)
  SELECT workout_routine_id, h.id, ROW_NUMBER() OVER (ORDER BY
    CASE h.slug
      WHEN 'mobility-flow' THEN 1
      WHEN 'hiit-workout' THEN 2
      WHEN 'desk-stretches' THEN 3
      WHEN 'cold-shower' THEN 4
    END)
  FROM public.hacks h
  WHERE h.slug IN ('mobility-flow', 'hiit-workout', 'desk-stretches', 'cold-shower');

  -- Create Mindfulness & Stress Relief Routine
  INSERT INTO public.routines (id, name, slug, description, created_by, is_public, position)
  VALUES (
    gen_random_uuid(),
    'Stress Relief & Mindfulness',
    'stress-relief-mindfulness',
    'Calm your mind and reduce stress with breathing and meditation techniques',
    admin_user_id,
    true,
    3
  )
  RETURNING id INTO mindfulness_routine_id;

  -- Add hacks to Mindfulness Routine
  INSERT INTO public.routine_hacks (routine_id, hack_id, position)
  SELECT mindfulness_routine_id, h.id, ROW_NUMBER() OVER (ORDER BY
    CASE h.slug
      WHEN 'box-breathing' THEN 1
      WHEN 'meditation-basics' THEN 2
      WHEN 'gratitude-journal' THEN 3
      WHEN 'power-pose' THEN 4
    END)
  FROM public.hacks h
  WHERE h.slug IN ('box-breathing', 'meditation-basics', 'gratitude-journal', 'power-pose');

  -- Create Evening Wind Down Routine
  INSERT INTO public.routines (id, name, slug, description, created_by, is_public, position)
  VALUES (
    gen_random_uuid(),
    'Evening Wind Down',
    'evening-wind-down',
    'Relax and prepare for deep, restful sleep with gentle movement and meditation',
    admin_user_id,
    true,
    4
  )
  RETURNING id INTO evening_routine_id;

  -- Add hacks to Evening Routine
  INSERT INTO public.routine_hacks (routine_id, hack_id, position)
  SELECT evening_routine_id, h.id, ROW_NUMBER() OVER (ORDER BY
    CASE h.slug
      WHEN 'evening-wind-down-yoga' THEN 1
      WHEN 'gratitude-journal' THEN 2
      WHEN 'sleep-meditation' THEN 3
    END)
  FROM public.hacks h
  WHERE h.slug IN ('evening-wind-down-yoga', 'gratitude-journal', 'sleep-meditation');

  -- Create Posture & Mobility Routine
  INSERT INTO public.routines (id, name, slug, description, created_by, is_public, position)
  VALUES (
    gen_random_uuid(),
    'Posture & Mobility Fix',
    'posture-mobility-fix',
    'Improve your posture, reduce pain, and increase mobility with targeted exercises',
    admin_user_id,
    true,
    5
  )
  RETURNING id INTO posture_routine_id;

  -- Add hacks to Posture Routine
  INSERT INTO public.routine_hacks (routine_id, hack_id, position)
  SELECT posture_routine_id, h.id, ROW_NUMBER() OVER (ORDER BY
    CASE h.slug
      WHEN 'mobility-flow' THEN 1
      WHEN 'posture-fix-routine' THEN 2
      WHEN 'desk-stretches' THEN 3
    END)
  FROM public.hacks h
  WHERE h.slug IN ('mobility-flow', 'posture-fix-routine', 'desk-stretches');

  -- Create Social Skills & Confidence Routine
  INSERT INTO public.routines (id, name, slug, description, created_by, is_public, position)
  VALUES (
    gen_random_uuid(),
    'Social Confidence Builder',
    'social-confidence-builder',
    'Build confidence and improve your social skills with proven techniques',
    admin_user_id,
    true,
    6
  )
  RETURNING id INTO social_routine_id;

  -- Add hacks to Social Skills Routine
  INSERT INTO public.routine_hacks (routine_id, hack_id, position)
  SELECT social_routine_id, h.id, ROW_NUMBER() OVER (ORDER BY
    CASE h.slug
      WHEN 'power-pose' THEN 1
      WHEN 'confidence-building' THEN 2
      WHEN 'communication-skills' THEN 3
      WHEN 'ford-method' THEN 4
      WHEN 'eye-contact' THEN 5
    END)
  FROM public.hacks h
  WHERE h.slug IN ('power-pose', 'confidence-building', 'communication-skills', 'ford-method', 'eye-contact');

  -- Add tags to routines
  INSERT INTO public.routine_tags (routine_id, tag_id)
  SELECT morning_routine_id, t.id FROM public.tags t WHERE t.slug IN ('morning', 'productivity', 'beginner');

  INSERT INTO public.routine_tags (routine_id, tag_id)
  SELECT workout_routine_id, t.id FROM public.tags t WHERE t.slug IN ('exercise', 'advanced');

  INSERT INTO public.routine_tags (routine_id, tag_id)
  SELECT mindfulness_routine_id, t.id FROM public.tags t WHERE t.slug IN ('stress', 'focus', 'beginner');

  INSERT INTO public.routine_tags (routine_id, tag_id)
  SELECT evening_routine_id, t.id FROM public.tags t WHERE t.slug IN ('evening', 'sleep', 'beginner');

  INSERT INTO public.routine_tags (routine_id, tag_id)
  SELECT posture_routine_id, t.id FROM public.tags t WHERE t.slug IN ('exercise', 'beginner');

  INSERT INTO public.routine_tags (routine_id, tag_id)
  SELECT social_routine_id, t.id FROM public.tags t WHERE t.slug IN ('beginner');

END $$;

-- Note: User-specific data will be created when users sign up and interact with the app