-- Seed file for NRGHax development
-- This file will be run after migrations during `supabase db reset`

-- Add admin email
INSERT INTO public.admin_emails (email) VALUES ('admin@example.com')
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
INSERT INTO public.hacks (name, slug, description, content_type, content_body, difficulty, time_minutes, category) VALUES
  ('Morning Sunlight Exposure', 'morning-sunlight', 'Get 10-30 minutes of sunlight within 30 minutes of waking', 'content',
   E'# Morning Sunlight Exposure\n\n## Why It Works\n\nExposure to bright light early in the day helps regulate your circadian rhythm, improving both sleep quality and daytime alertness.\n\n## How to Do It\n\n1. Go outside within 30 minutes of waking\n2. Spend 10-30 minutes in direct sunlight\n3. Don''t wear sunglasses during this time\n4. If it''s cloudy, spend more time (20-40 minutes)\n\n## Benefits\n\n- Better sleep at night\n- Increased daytime energy\n- Improved mood\n- Better vitamin D production',
   'Beginner', 20, 'energy'),

  ('Box Breathing', 'box-breathing', '4-4-4-4 breathing technique for instant calm', 'content',
   E'# Box Breathing Technique\n\n## What Is It?\n\nA powerful stress-reduction technique used by Navy SEALs and first responders.\n\n## Steps\n\n1. Exhale completely\n2. Inhale through nose for 4 counts\n3. Hold breath for 4 counts\n4. Exhale through mouth for 4 counts\n5. Hold empty for 4 counts\n6. Repeat 4-8 times\n\n## When to Use\n\n- Before stressful situations\n- When feeling anxious\n- To improve focus\n- Before sleep',
   'Beginner', 5, 'strength'),

  ('Pomodoro Technique', 'pomodoro', '25-minute focused work sessions', 'content',
   E'# The Pomodoro Technique\n\n## How It Works\n\n1. Choose a task\n2. Set timer for 25 minutes\n3. Work with full focus\n4. Take a 5-minute break\n5. After 4 pomodoros, take a 15-30 minute break\n\n## Tips for Success\n\n- Turn off all notifications\n- Have a notepad for random thoughts\n- Don''t skip breaks\n- Track your pomodoros',
   'Beginner', 30, 'productivity'),

  ('Cold Shower Finish', 'cold-shower', 'End showers with 30-60 seconds of cold water', 'content',
   E'# Cold Shower Protocol\n\n## Benefits\n\n- Increased alertness\n- Improved circulation\n- Enhanced mood\n- Better stress resilience\n\n## How to Start\n\n1. Take your normal warm shower\n2. Gradually decrease temperature\n3. End with 30-60 seconds of cold\n4. Focus on controlled breathing\n5. Increase duration over time',
   'Intermediate', 10, 'confidence'),

  ('Power Pose', 'power-pose', 'Stand in a confident posture for 2 minutes to boost confidence', 'content',
   E'# Power Pose Challenge\n\n## The Science\n\nResearch shows that standing in powerful positions for just 2 minutes can increase testosterone and decrease cortisol levels.\n\n## How to Power Pose\n\n1. Stand with feet shoulder-width apart\n2. Place hands on hips or raise arms in victory\n3. Lift chin slightly and expand chest\n4. Hold for 2 full minutes\n5. Breathe deeply and visualize success\n\n## Best Times to Use\n\n- Before important meetings\n- Before presentations\n- Start of your day\n- Before social events',
   'Beginner', 2, 'confidence'),

  ('FORD Method', 'ford-method', 'Never run out of conversation topics with this simple framework', 'content',
   E'# FORD Conversation Method\n\n## What Does FORD Stand For?\n\n- **F**amily: Ask about family, relationships, pets\n- **O**ccupation: Work, studies, career goals\n- **R**ecreation: Hobbies, interests, fun activities\n- **D**reams: Goals, aspirations, bucket list\n\n## How to Use It\n\n1. Start with one topic that feels natural\n2. Ask open-ended questions\n3. Listen actively and ask follow-ups\n4. Share related experiences\n5. Transition smoothly between topics\n\n## Example Questions\n\n- Family: "Do you have any siblings?"\n- Occupation: "What got you interested in your field?"\n- Recreation: "What do you like to do for fun?"\n- Dreams: "Any exciting plans for the future?"',
   'Beginner', 10, 'social'),

  ('2-Minute Rule', 'two-minute-rule', 'If it takes less than 2 minutes, do it now', 'content',
   E'# The 2-Minute Rule\n\n## The Principle\n\nAny task that takes less than 2 minutes should be done immediately rather than added to your to-do list.\n\n## Why It Works\n\n- Prevents small tasks from piling up\n- Reduces mental clutter\n- Creates momentum\n- Eliminates procrastination on simple tasks\n\n## Implementation\n\n1. When a task comes up, estimate the time\n2. If under 2 minutes, do it immediately\n3. If over 2 minutes, schedule it\n4. Batch similar 2-minute tasks together\n5. Use a timer to stay honest\n\n## Examples\n\n- Reply to a simple email\n- File a document\n- Make your bed\n- Wash a dish\n- Send a quick message',
   'Beginner', 2, 'productivity'),

  ('Gratitude Journal', 'gratitude-journal', 'Write 3 things you are grateful for each day', 'content',
   E'# Daily Gratitude Practice\n\n## The Practice\n\nSpend 5 minutes each day writing down 3 things you are grateful for.\n\n## How to Do It Right\n\n1. Be specific - not just "family" but "my sister''s encouraging text"\n2. Include why you are grateful\n3. Feel the emotion for 20 seconds\n4. Include different categories each day\n5. Write by hand if possible\n\n## Categories to Consider\n\n- People in your life\n- Personal strengths\n- Opportunities you have\n- Simple pleasures\n- Lessons learned\n- Progress made\n\n## Benefits\n\n- 23% increase in happiness (research-backed)\n- Better sleep quality\n- Improved relationships\n- Reduced anxiety and depression',
   'Beginner', 5, 'strength'),

  ('Eye Contact Practice', 'eye-contact', 'Build confidence through better eye contact', 'content',
   E'# Eye Contact Training\n\n## Why It Matters\n\nGood eye contact signals confidence, trustworthiness, and engagement.\n\n## Progressive Training\n\n### Week 1: Mirror Practice\n- Look yourself in the eyes for 30 seconds\n- Practice different expressions\n- Notice what feels comfortable\n\n### Week 2: Video Practice\n- Watch videos and maintain eye contact with speakers\n- Practice during video calls\n\n### Week 3: Real World\n- Hold eye contact for 3-5 seconds when greeting\n- Use the triangle technique (eyes and mouth)\n- Look away briefly every 5-7 seconds\n\n## Tips\n\n- Look at one eye at a time\n- Soften your gaze\n- Blink normally\n- Look away to the side, not down',
   'Intermediate', 5, 'social'),

  ('Deep Work Blocks', 'deep-work', '90-minute focused work sessions for maximum productivity', 'content',
   E'# Deep Work Protocol\n\n## What is Deep Work?\n\nDistraction-free concentration on cognitively demanding tasks.\n\n## The 90-Minute Protocol\n\n1. **Preparation (5 min)**\n   - Clear workspace\n   - Close all unnecessary tabs\n   - Phone in another room\n   - Set 90-minute timer\n\n2. **Deep Work (90 min)**\n   - Single task focus\n   - No email/messages\n   - No context switching\n\n3. **Recovery (15 min)**\n   - Walk or stretch\n   - Hydrate\n   - Light snack\n   - No screens\n\n## Rules\n\n- Maximum 2 sessions per day\n- Never skip recovery\n- Track what you accomplish\n- Gradually increase difficulty',
   'Advanced', 90, 'productivity')
ON CONFLICT (slug) DO NOTHING;

-- Note: User-specific data will be created when users sign up and interact with the app