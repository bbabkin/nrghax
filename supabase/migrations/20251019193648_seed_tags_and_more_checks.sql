-- Seed more comprehensive tags and checklist data for testing

-- Insert tags if they don't exist
INSERT INTO tags (name, slug, description)
VALUES
  ('Sleep', 'sleep', 'Hacks related to improving sleep quality and sleep hygiene'),
  ('Nutrition', 'nutrition', 'Hacks focused on diet, eating habits, and nutritional optimization'),
  ('Exercise', 'exercise', 'Physical activity and movement-based hacks'),
  ('Mental Health', 'mental-health', 'Hacks for improving mental wellbeing and reducing stress'),
  ('Productivity', 'productivity', 'Hacks to boost focus, efficiency, and time management'),
  ('Recovery', 'recovery', 'Techniques for faster recovery and reducing inflammation'),
  ('Hydration', 'hydration', 'Water intake and hydration optimization'),
  ('Sunlight', 'sunlight', 'Light exposure and circadian rhythm hacks'),
  ('Cold Therapy', 'cold-therapy', 'Cold exposure techniques for health benefits'),
  ('Breathwork', 'breathwork', 'Breathing exercises and techniques'),
  ('Mindfulness', 'mindfulness', 'Meditation and awareness practices'),
  ('Supplements', 'supplements', 'Supplement-based optimization strategies')
ON CONFLICT (slug) DO NOTHING;

-- Add more comprehensive checklists to various hacks
-- First, let's add checks to multiple hacks

-- Get IDs for various hacks and add checks
DO $$
DECLARE
  v_hack_id UUID;
  v_admin_user_id UUID;
BEGIN
  -- Get an admin user ID for created_by field
  SELECT id INTO v_admin_user_id FROM profiles WHERE is_admin = true LIMIT 1;

  -- If no admin, just skip (shouldn't happen but safe)
  IF v_admin_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Add checks to any hack with "cold" in the name
  FOR v_hack_id IN (SELECT id FROM hacks WHERE LOWER(name) LIKE '%cold%' LIMIT 1)
  LOOP
    INSERT INTO hack_checks (hack_id, title, description, position, is_required)
    VALUES
      (v_hack_id, 'Read safety guidelines', '<p>Review the <strong>safety precautions</strong> before attempting cold exposure.</p>', 0, true),
      (v_hack_id, 'Start with face immersion', '<p>Begin with just your face in cold water for 15-30 seconds.</p>', 1, true),
      (v_hack_id, 'Progress gradually', '<p>Slowly increase duration over multiple sessions.</p>', 2, true),
      (v_hack_id, 'Track your tolerance', '<p><em>Optional:</em> Keep a log of your cold exposure sessions and how you feel.</p>', 3, false)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Add checks to any hack with "breathing" or "breath" in the name
  FOR v_hack_id IN (SELECT id FROM hacks WHERE LOWER(name) LIKE '%breath%' LIMIT 1)
  LOOP
    INSERT INTO hack_checks (hack_id, title, description, position, is_required)
    VALUES
      (v_hack_id, 'Find a quiet space', '<p>Choose a calm environment where you won''t be disturbed.</p>', 0, true),
      (v_hack_id, 'Practice the technique', '<p>Complete at least one full round of the breathing exercise.</p>', 1, true),
      (v_hack_id, 'Note how you feel', '<p>Pay attention to changes in your energy and mental state.</p>', 2, true),
      (v_hack_id, 'Set a daily reminder', '<p><em>Optional:</em> Schedule regular practice sessions.</p>', 3, false),
      (v_hack_id, 'Share your experience', '<p><em>Optional:</em> Comment below with your results.</p>', 4, false)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Add checks to any hack with "sleep" in the name
  FOR v_hack_id IN (SELECT id FROM hacks WHERE LOWER(name) LIKE '%sleep%' LIMIT 1)
  LOOP
    INSERT INTO hack_checks (hack_id, title, description, position, is_required)
    VALUES
      (v_hack_id, 'Learn the optimal timing', '<p>Understand <strong>when</strong> to implement this hack for maximum effect.</p>', 0, true),
      (v_hack_id, 'Prepare your environment', '<p>Set up your sleep space to support this hack.</p>', 1, true),
      (v_hack_id, 'Test for 3 nights', '<p>Give it at least 3 consecutive nights to see results.</p>', 2, true),
      (v_hack_id, 'Track sleep quality', '<p><em>Optional:</em> Use a sleep tracker or journal to measure improvements.</p>', 3, false)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Add checks to any hack with "exercise" or "workout" in the name
  FOR v_hack_id IN (SELECT id FROM hacks WHERE LOWER(name) LIKE '%exercise%' OR LOWER(name) LIKE '%workout%' LIMIT 1)
  LOOP
    INSERT INTO hack_checks (hack_id, title, description, position, is_required)
    VALUES
      (v_hack_id, 'Review the movement', '<p>Watch the demonstration and understand proper form.</p>', 0, true),
      (v_hack_id, 'Start with low intensity', '<p>Begin at an easy level to master the technique.</p>', 1, true),
      (v_hack_id, 'Complete first session', '<p>Do your first workout following the guidelines.</p>', 2, true),
      (v_hack_id, 'Schedule next sessions', '<p><em>Optional:</em> Plan your weekly workout schedule.</p>', 3, false)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Add checks to nutrition-related hacks
  FOR v_hack_id IN (SELECT id FROM hacks WHERE LOWER(name) LIKE '%nutrition%' OR LOWER(name) LIKE '%food%' OR LOWER(name) LIKE '%eat%' LIMIT 1)
  LOOP
    INSERT INTO hack_checks (hack_id, title, description, position, is_required)
    VALUES
      (v_hack_id, 'Understand the principle', '<p>Learn <strong>why</strong> this nutritional approach works.</p>', 0, true),
      (v_hack_id, 'Plan your meals', '<p>Identify which foods fit this strategy.</p>', 1, true),
      (v_hack_id, 'Try for one week', '<p>Implement the hack for 7 days to evaluate results.</p>', 2, true),
      (v_hack_id, 'Monitor your energy', '<p><em>Optional:</em> Track how your energy levels change.</p>', 3, false),
      (v_hack_id, 'Share your recipe ideas', '<p><em>Optional:</em> Post your favorite meals in the comments.</p>', 4, false)
    ON CONFLICT DO NOTHING;
  END LOOP;

END $$;

-- Associate tags with hacks based on content
DO $$
DECLARE
  v_tag_id UUID;
  v_hack_id UUID;
BEGIN
  -- Associate sunlight tag with morning sunlight hack
  SELECT id INTO v_tag_id FROM tags WHERE slug = 'sunlight';
  FOR v_hack_id IN (SELECT id FROM hacks WHERE LOWER(name) LIKE '%sunlight%')
  LOOP
    INSERT INTO hack_tags (hack_id, tag_id)
    VALUES (v_hack_id, v_tag_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Associate sleep tag with sleep hacks
  SELECT id INTO v_tag_id FROM tags WHERE slug = 'sleep';
  FOR v_hack_id IN (SELECT id FROM hacks WHERE LOWER(name) LIKE '%sleep%')
  LOOP
    INSERT INTO hack_tags (hack_id, tag_id)
    VALUES (v_hack_id, v_tag_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Associate cold therapy tag
  SELECT id INTO v_tag_id FROM tags WHERE slug = 'cold-therapy';
  FOR v_hack_id IN (SELECT id FROM hacks WHERE LOWER(name) LIKE '%cold%')
  LOOP
    INSERT INTO hack_tags (hack_id, tag_id)
    VALUES (v_hack_id, v_tag_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Associate breathwork tag
  SELECT id INTO v_tag_id FROM tags WHERE slug = 'breathwork';
  FOR v_hack_id IN (SELECT id FROM hacks WHERE LOWER(name) LIKE '%breath%')
  LOOP
    INSERT INTO hack_tags (hack_id, tag_id)
    VALUES (v_hack_id, v_tag_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Associate exercise tag
  SELECT id INTO v_tag_id FROM tags WHERE slug = 'exercise';
  FOR v_hack_id IN (SELECT id FROM hacks WHERE LOWER(name) LIKE '%exercise%' OR LOWER(name) LIKE '%workout%')
  LOOP
    INSERT INTO hack_tags (hack_id, tag_id)
    VALUES (v_hack_id, v_tag_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Associate nutrition tag
  SELECT id INTO v_tag_id FROM tags WHERE slug = 'nutrition';
  FOR v_hack_id IN (SELECT id FROM hacks WHERE LOWER(name) LIKE '%nutrition%' OR LOWER(name) LIKE '%food%' OR LOWER(name) LIKE '%eat%')
  LOOP
    INSERT INTO hack_tags (hack_id, tag_id)
    VALUES (v_hack_id, v_tag_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

END $$;

-- Add some additional general tags to random hacks for variety
DO $$
DECLARE
  v_mental_health_tag_id UUID;
  v_productivity_tag_id UUID;
  v_recovery_tag_id UUID;
BEGIN
  SELECT id INTO v_mental_health_tag_id FROM tags WHERE slug = 'mental-health';
  SELECT id INTO v_productivity_tag_id FROM tags WHERE slug = 'productivity';
  SELECT id INTO v_recovery_tag_id FROM tags WHERE slug = 'recovery';

  -- Add mental health tag to first hack
  INSERT INTO hack_tags (hack_id, tag_id)
  SELECT h.id, v_mental_health_tag_id
  FROM hacks h
  LIMIT 1
  ON CONFLICT DO NOTHING;

  -- Add productivity tag to second hack
  INSERT INTO hack_tags (hack_id, tag_id)
  SELECT h.id, v_productivity_tag_id
  FROM hacks h
  OFFSET 1 LIMIT 1
  ON CONFLICT DO NOTHING;

  -- Add recovery tag to third hack
  INSERT INTO hack_tags (hack_id, tag_id)
  SELECT h.id, v_recovery_tag_id
  FROM hacks h
  OFFSET 2 LIMIT 1
  ON CONFLICT DO NOTHING;

END $$;