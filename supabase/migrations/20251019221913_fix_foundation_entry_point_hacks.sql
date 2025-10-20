-- Fix Foundation level to include entry-point hacks with no prerequisites
-- This ensures users have hacks they can start with immediately

DO $$
DECLARE
  foundation_level_id UUID;
BEGIN
  SELECT id INTO foundation_level_id FROM levels WHERE slug = 'foundation';

  -- Insert the entry-point hacks (no prerequisites)
  INSERT INTO hacks (name, slug, description, icon, difficulty, is_required, level_id, position)
  VALUES
    ('Morning Sunlight Exposure', 'morning-sunlight-exposure',
     'Get 10-30 minutes of direct sunlight exposure within the first hour of waking',
     '☀', 'Easy', true, foundation_level_id, 1),
    ('Box Breathing', 'box-breathing',
     'Practice the 4-4-4-4 breathing technique for stress reduction and mental clarity',
     '🌬', 'Easy', true, foundation_level_id, 2),
    ('Pomodoro Technique', 'pomodoro-technique',
     '25 minutes of focused work followed by a 5-minute break',
     '🍅', 'Easy', false, foundation_level_id, 3),
    ('Cold Shower Finish', 'cold-shower-finish',
     'End your shower with 30-60 seconds of cold water',
     '🚿', 'Medium', false, foundation_level_id, 4),
    ('Power Pose', 'power-pose',
     'Hold a confident posture for 2 minutes to boost confidence and reduce stress',
     '💪', 'Easy', false, foundation_level_id, 5)
  ON CONFLICT (slug) DO UPDATE SET
    level_id = foundation_level_id,
    position = EXCLUDED.position;

  -- Fix the broken prerequisites that point to non-existent hack IDs
  -- Delete all prerequisites for Ultimate Energy Boost and re-add them properly
  DELETE FROM hack_prerequisites
  WHERE hack_id = (SELECT id FROM hacks WHERE slug = 'ultimate-energy-boost');

  INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
  SELECT
    (SELECT id FROM hacks WHERE slug = 'ultimate-energy-boost'),
    id
  FROM hacks
  WHERE slug IN ('cold-shower-finish', 'power-pose')
  ON CONFLICT DO NOTHING;

  -- Fix Meditation Practice prerequisite
  UPDATE hack_prerequisites
  SET prerequisite_hack_id = (SELECT id FROM hacks WHERE slug = 'box-breathing')
  WHERE hack_id = (SELECT id FROM hacks WHERE slug = 'meditation-practice');

  -- Fix Deep Work Session prerequisite
  UPDATE hack_prerequisites
  SET prerequisite_hack_id = (SELECT id FROM hacks WHERE slug = 'box-breathing')
  WHERE hack_id = (SELECT id FROM hacks WHERE slug = 'deep-work-session');

  -- Fix Vitamin D Optimization prerequisite
  UPDATE hack_prerequisites
  SET prerequisite_hack_id = (SELECT id FROM hacks WHERE slug = 'morning-sunlight-exposure')
  WHERE hack_id = (SELECT id FROM hacks WHERE slug = 'vitamin-d-optimization');

  -- Fix Circadian Rhythm Reset prerequisite
  UPDATE hack_prerequisites
  SET prerequisite_hack_id = (SELECT id FROM hacks WHERE slug = 'morning-sunlight-exposure')
  WHERE hack_id = (SELECT id FROM hacks WHERE slug = 'circadian-rhythm-reset');

END $$;

-- Clean up any invalid prerequisites
DELETE FROM hack_prerequisites
WHERE prerequisite_hack_id NOT IN (SELECT id FROM hacks)
   OR hack_id NOT IN (SELECT id FROM hacks);