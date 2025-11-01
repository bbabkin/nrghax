-- Simplify Foundation level to have only 4 hacks with clear dependency structure
-- This makes it easier to demonstrate the waterfall flowchart

DO $$
DECLARE
  foundation_level_id UUID;
  hack_a_id UUID;
  hack_b_id UUID;
  hack_c_id UUID;
  hack_d_id UUID;
BEGIN
  -- Get foundation level
  SELECT id INTO foundation_level_id FROM levels WHERE slug = 'foundation';

  IF foundation_level_id IS NULL THEN
    RAISE EXCEPTION 'Foundation level not found';
  END IF;

  -- Clear all existing hack prerequisites for Foundation level
  DELETE FROM hack_prerequisites hp
  WHERE hp.hack_id IN (SELECT id FROM hacks WHERE level_id = foundation_level_id);

  -- Clear all hacks from Foundation level
  DELETE FROM hacks WHERE level_id = foundation_level_id;

  -- Create 4 simple hacks with clear dependency structure

  -- Layer 0: Two entry-point hacks (no prerequisites)
  INSERT INTO hacks (name, slug, description, icon, difficulty, is_required, level_id, position)
  VALUES ('Morning Sunlight', 'morning-sunlight', 'Get 10-30 minutes of sunlight in the first hour of waking', '☀️', 'Easy', true, foundation_level_id, 1)
  RETURNING id INTO hack_a_id;

  INSERT INTO hacks (name, slug, description, icon, difficulty, is_required, level_id, position)
  VALUES ('Box Breathing', 'box-breathing', 'Practice 4-4-4-4 breathing technique for stress reduction', '🌬️', 'Easy', true, foundation_level_id, 2)
  RETURNING id INTO hack_b_id;

  -- Layer 1: One hack that requires completing one prerequisite
  INSERT INTO hacks (name, slug, description, icon, difficulty, is_required, level_id, position)
  VALUES ('Energy Boost', 'energy-boost', 'Combine movement and breathwork to energize your day', '⚡', 'Medium', true, foundation_level_id, 3)
  RETURNING id INTO hack_c_id;

  -- Layer 2: One hack that requires completing TWO prerequisites
  INSERT INTO hacks (name, slug, description, icon, difficulty, is_required, level_id, position)
  VALUES ('Power Hour', 'power-hour', 'Master your morning with the complete routine', '💪', 'Hard', true, foundation_level_id, 4)
  RETURNING id INTO hack_d_id;

  -- Set up prerequisites
  -- Energy Boost requires Morning Sunlight
  INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
  VALUES (hack_c_id, hack_a_id);

  -- Power Hour requires BOTH Box Breathing AND Energy Boost
  INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
  VALUES
    (hack_d_id, hack_b_id),
    (hack_d_id, hack_c_id);

END $$;
