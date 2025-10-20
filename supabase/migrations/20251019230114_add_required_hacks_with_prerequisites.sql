-- Add required hacks with prerequisites to Foundation level
-- This creates a progression where some hacks MUST be completed to unlock required next steps

DO $$
DECLARE
  foundation_level_id UUID;
BEGIN
  SELECT id INTO foundation_level_id FROM levels WHERE slug = 'foundation';

  -- Update some existing hacks to be required
  -- Morning Sunlight and Box Breathing remain as required entry points
  UPDATE hacks
  SET is_required = true
  WHERE slug IN ('morning-sunlight-exposure', 'box-breathing')
    AND level_id = foundation_level_id;

  -- Add new required hacks that have prerequisites
  INSERT INTO hacks (name, slug, description, icon, difficulty, is_required, level_id, position)
  VALUES
    -- These are REQUIRED and have prerequisites
    ('Morning Routine Mastery', 'morning-routine-mastery',
     'Complete your personalized morning routine consistently',
     '🌄', 'Medium', true, foundation_level_id, 11),

    ('Breathwork Foundation', 'breathwork-foundation',
     'Master the fundamental breathing techniques for optimal health',
     '🌬', 'Medium', true, foundation_level_id, 12),

    ('Energy Optimization Protocol', 'energy-optimization-protocol',
     'Implement the complete energy optimization system',
     '⚡', 'Hard', true, foundation_level_id, 13)
  ON CONFLICT (slug) DO UPDATE SET
    is_required = EXCLUDED.is_required,
    level_id = foundation_level_id,
    position = EXCLUDED.position;

  -- Update Meditation Practice and Vitamin D to be REQUIRED
  UPDATE hacks
  SET is_required = true
  WHERE slug IN ('meditation-practice', 'vitamin-d-optimization')
    AND level_id = foundation_level_id;

  -- Set up prerequisite chains for the new required hacks

  -- Morning Routine Mastery requires Morning Sunlight to be completed first
  INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
  VALUES
    ((SELECT id FROM hacks WHERE slug = 'morning-routine-mastery'),
     (SELECT id FROM hacks WHERE slug = 'morning-sunlight-exposure'))
  ON CONFLICT DO NOTHING;

  -- Breathwork Foundation requires Box Breathing to be completed first
  INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
  VALUES
    ((SELECT id FROM hacks WHERE slug = 'breathwork-foundation'),
     (SELECT id FROM hacks WHERE slug = 'box-breathing'))
  ON CONFLICT DO NOTHING;

  -- Energy Optimization Protocol requires BOTH Morning Routine Mastery AND Breathwork Foundation
  INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
  VALUES
    ((SELECT id FROM hacks WHERE slug = 'energy-optimization-protocol'),
     (SELECT id FROM hacks WHERE slug = 'morning-routine-mastery')),
    ((SELECT id FROM hacks WHERE slug = 'energy-optimization-protocol'),
     (SELECT id FROM hacks WHERE slug = 'breathwork-foundation'))
  ON CONFLICT DO NOTHING;

END $$;

-- Summary of the new structure:
--
-- REQUIRED Entry Points (no prerequisites):
--   1. Morning Sunlight Exposure (required)
--   2. Box Breathing (required)
--
-- REQUIRED with Prerequisites:
--   3. Meditation Practice (required) - requires: Box Breathing
--   4. Vitamin D Optimization (required) - requires: Morning Sunlight
--   5. Morning Routine Mastery (required) - requires: Morning Sunlight
--   6. Breathwork Foundation (required) - requires: Box Breathing
--   7. Energy Optimization Protocol (required) - requires: Morning Routine Mastery AND Breathwork Foundation
--
-- OPTIONAL (no prerequisites):
--   - Pomodoro Technique
--   - Cold Shower Finish
--   - Power Pose
--
-- OPTIONAL with Prerequisites:
--   - Deep Work Session - requires: Box Breathing
--   - Ultimate Energy Boost - requires: Cold Shower + Power Pose
--   - Circadian Rhythm Reset - requires: Morning Sunlight