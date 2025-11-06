-- Simplify to 5 hacks with linear progression and 2 routines
-- This migration keeps only the essential hacks and creates a clear learning path

-- First, clean up all existing data
DELETE FROM routine_hacks;
DELETE FROM routine_tags;
DELETE FROM hack_prerequisites;
DELETE FROM hack_tags;
DELETE FROM user_hacks;
DELETE FROM routines;

-- Keep only 5 specific hacks, delete the rest
DELETE FROM hacks WHERE slug NOT IN (
  'box-breathing',
  'morning-sunlight',
  'gratitude-journal',
  'power-pose',
  'ford-method'
);

-- Update the 5 kept hacks with proper positioning and content
DO $$
DECLARE
  foundation_level_id UUID;
  box_breathing_id UUID;
  morning_sunlight_id UUID;
  gratitude_id UUID;
  power_pose_id UUID;
  ford_method_id UUID;
  admin_user_id UUID;
  morning_routine_id UUID;
  confidence_routine_id UUID;
BEGIN
  -- Get foundation level
  SELECT id INTO foundation_level_id FROM levels WHERE slug = 'foundation';

  -- Get or create admin user for routine ownership
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1;

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

    -- Create profile for admin
    INSERT INTO public.profiles (id, email, name, is_admin, created_at, updated_at)
    VALUES (admin_user_id, 'admin@example.com', 'Admin User', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET is_admin = true;
  END IF;

  -- Insert/Update Box Breathing (Hack 1 - Entry point, no prerequisites)
  INSERT INTO hacks (slug, name, description, position, difficulty, time_minutes, level_id, is_required, content_type, content_body, category)
  VALUES ('box-breathing', 'Box Breathing', 'Master the 4-4-4-4 breathing technique for instant calm', 1, 'Beginner', 5, foundation_level_id, false, 'content',
    E'# Box Breathing Technique\n\n## What Is It?\n\nA powerful stress-reduction technique used by Navy SEALs and first responders.\n\n## Steps\n\n1. Exhale completely\n2. Inhale through nose for 4 counts\n3. Hold breath for 4 counts\n4. Exhale through mouth for 4 counts\n5. Hold empty for 4 counts\n6. Repeat 4-8 times\n\n## When to Use\n\n- Before stressful situations\n- When feeling anxious\n- To improve focus\n- Before sleep\n\n## Your Goal\n\nComplete 3 sessions to master this technique and unlock the next hack!', 'strength')
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    position = EXCLUDED.position,
    difficulty = EXCLUDED.difficulty,
    time_minutes = EXCLUDED.time_minutes,
    level_id = EXCLUDED.level_id,
    is_required = EXCLUDED.is_required,
    content_body = EXCLUDED.content_body
  RETURNING id INTO box_breathing_id;

  -- Update Morning Sunlight (Hack 2 - Requires Box Breathing)
  UPDATE hacks
  SET
    name = 'Morning Sunlight',
    description = 'Get 10-30 minutes of sunlight within 30 minutes of waking',
    position = 2,
    difficulty = 'Beginner',
    time_minutes = 20,
    level_id = foundation_level_id,
    is_required = false,
    content_body = E'# Morning Sunlight Exposure\n\n## Why It Works\n\nExposure to bright light early in the day helps regulate your circadian rhythm, improving both sleep quality and daytime alertness.\n\n## How to Do It\n\n1. Go outside within 30 minutes of waking\n2. Spend 10-30 minutes in direct sunlight\n3. Don''t wear sunglasses during this time\n4. If it''s cloudy, spend more time (20-40 minutes)\n\n## Benefits\n\n- Better sleep at night\n- Increased daytime energy\n- Improved mood\n- Better vitamin D production\n\n## Your Goal\n\nComplete this hack 7 times to build the habit and unlock the next level!'
  WHERE slug = 'morning-sunlight'
  RETURNING id INTO morning_sunlight_id;

  -- Update Gratitude Journal (Hack 3 - Requires Morning Sunlight)
  UPDATE hacks
  SET
    name = 'Gratitude Journal',
    description = 'Write 3 things you are grateful for each day',
    position = 3,
    difficulty = 'Beginner',
    time_minutes = 5,
    level_id = foundation_level_id,
    is_required = false,
    content_body = E'# Daily Gratitude Practice\n\n## The Practice\n\nSpend 5 minutes each day writing down 3 things you are grateful for.\n\n## How to Do It Right\n\n1. Be specific - not just "family" but "my sister''s encouraging text"\n2. Include why you are grateful\n3. Feel the emotion for 20 seconds\n4. Include different categories each day\n5. Write by hand if possible\n\n## Categories to Consider\n\n- People in your life\n- Personal strengths\n- Opportunities you have\n- Simple pleasures\n- Lessons learned\n- Progress made\n\n## Benefits\n\n- 23% increase in happiness (research-backed)\n- Better sleep quality\n- Improved relationships\n- Reduced anxiety and depression\n\n## Your Goal\n\nPractice gratitude for 14 days straight to unlock your social confidence skills!'
  WHERE slug = 'gratitude-journal'
  RETURNING id INTO gratitude_id;

  -- Update Power Pose (Hack 4 - Requires Gratitude Journal)
  UPDATE hacks
  SET
    name = 'Power Pose',
    description = 'Stand in a confident posture for 2 minutes to boost confidence',
    position = 4,
    difficulty = 'Beginner',
    time_minutes = 2,
    level_id = foundation_level_id,
    is_required = false,
    content_body = E'# Power Pose Challenge\n\n## The Science\n\nResearch shows that standing in powerful positions for just 2 minutes can increase testosterone and decrease cortisol levels.\n\n## How to Power Pose\n\n1. Stand with feet shoulder-width apart\n2. Place hands on hips or raise arms in victory\n3. Lift chin slightly and expand chest\n4. Hold for 2 full minutes\n5. Breathe deeply and visualize success\n\n## Best Times to Use\n\n- Before important meetings\n- Before presentations\n- Start of your day\n- Before social events\n\n## The Challenge\n\nDo this 5 times before social situations to build lasting confidence!'
  WHERE slug = 'power-pose'
  RETURNING id INTO power_pose_id;

  -- Update FORD Method (Hack 5 - Requires Power Pose)
  UPDATE hacks
  SET
    name = 'FORD Method',
    description = 'Never run out of conversation topics with this simple framework',
    position = 5,
    difficulty = 'Beginner',
    time_minutes = 10,
    level_id = foundation_level_id,
    is_required = false,
    content_body = E'# FORD Conversation Method\n\n## What Does FORD Stand For?\n\n- **F**amily: Ask about family, relationships, pets\n- **O**ccupation: Work, studies, career goals\n- **R**ecreation: Hobbies, interests, fun activities\n- **D**reams: Goals, aspirations, bucket list\n\n## How to Use It\n\n1. Start with one topic that feels natural\n2. Ask open-ended questions\n3. Listen actively and ask follow-ups\n4. Share related experiences\n5. Transition smoothly between topics\n\n## Example Questions\n\n- Family: "Do you have any siblings?"\n- Occupation: "What got you interested in your field?"\n- Recreation: "What do you like to do for fun?"\n- Dreams: "Any exciting plans for the future?"\n\n## Practice Makes Perfect\n\nUse this method in 10 conversations to master the art of engaging dialogue!\n\n**Congratulations!** Completing this hack means you''ve finished the Foundation journey!'
  WHERE slug = 'ford-method'
  RETURNING id INTO ford_method_id;

  -- Set up linear progression with prerequisites
  -- Hack 2 requires Hack 1
  INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
  VALUES (morning_sunlight_id, box_breathing_id);

  -- Hack 3 requires Hack 2
  INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
  VALUES (gratitude_id, morning_sunlight_id);

  -- Hack 4 requires Hack 3
  INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
  VALUES (power_pose_id, gratitude_id);

  -- Hack 5 requires Hack 4
  INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
  VALUES (ford_method_id, power_pose_id);

  -- Create Routine 1: Morning Foundation (3 hacks)
  INSERT INTO routines (id, name, slug, description, created_by, is_public, position)
  VALUES (
    gen_random_uuid(),
    'Morning Foundation',
    'morning-foundation',
    'Build a powerful morning routine with breathing, sunlight, and gratitude',
    admin_user_id,
    true,
    1
  )
  RETURNING id INTO morning_routine_id;

  -- Add hacks to Morning Foundation routine
  INSERT INTO routine_hacks (routine_id, hack_id, position)
  VALUES
    (morning_routine_id, box_breathing_id, 1),
    (morning_routine_id, morning_sunlight_id, 2),
    (morning_routine_id, gratitude_id, 3);

  -- Create Routine 2: Social Confidence (2 hacks)
  INSERT INTO routines (id, name, slug, description, created_by, is_public, position)
  VALUES (
    gen_random_uuid(),
    'Social Confidence',
    'social-confidence',
    'Build confidence and master conversation skills',
    admin_user_id,
    true,
    2
  )
  RETURNING id INTO confidence_routine_id;

  -- Add hacks to Social Confidence routine
  INSERT INTO routine_hacks (routine_id, hack_id, position)
  VALUES
    (confidence_routine_id, power_pose_id, 1),
    (confidence_routine_id, ford_method_id, 2);

  -- Add tags to routines
  INSERT INTO routine_tags (routine_id, tag_id)
  SELECT morning_routine_id, t.id
  FROM tags t
  WHERE t.slug IN ('morning', 'beginner', 'productivity');

  INSERT INTO routine_tags (routine_id, tag_id)
  SELECT confidence_routine_id, t.id
  FROM tags t
  WHERE t.slug IN ('beginner');

END $$;

-- Summary:
-- 5 Hacks in linear progression:
--   1. Box Breathing (unlocked by default)
--   2. Morning Sunlight (requires Box Breathing)
--   3. Gratitude Journal (requires Morning Sunlight)
--   4. Power Pose (requires Gratitude Journal)
--   5. FORD Method (requires Power Pose)
--
-- 2 Routines:
--   1. Morning Foundation: Box Breathing -> Morning Sunlight -> Gratitude Journal
--   2. Social Confidence: Power Pose -> FORD Method
