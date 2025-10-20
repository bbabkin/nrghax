-- Complex prerequisite test scenarios for Foundation level
-- This migration adds new hacks to test various prerequisite configurations

-- First, let's add more hacks to the Foundation level
INSERT INTO hacks (name, slug, description, icon, difficulty, is_required, level_id, position)
VALUES
  -- These two hacks will BOTH require 'Box Breathing' as prerequisite (branching)
  ('Meditation Practice', 'meditation-practice', 'Daily meditation for mental clarity', '🧘', 'easy', false,
   (SELECT id FROM levels WHERE slug = 'foundation'), 6),
  ('Deep Work Session', 'deep-work-session', 'Focus deeply without distractions', '🎯', 'medium', false,
   (SELECT id FROM levels WHERE slug = 'foundation'), 7),

  -- This hack will require BOTH 'Cold Shower Finish' AND 'Power Pose' (convergence)
  ('Ultimate Energy Boost', 'ultimate-energy-boost', 'Combine multiple techniques for maximum energy', '⚡', 'hard', false,
   (SELECT id FROM levels WHERE slug = 'foundation'), 8),

  -- Additional hacks that branch from 'Morning Sunlight Exposure'
  ('Vitamin D Optimization', 'vitamin-d-optimization', 'Optimize your vitamin D levels', '☀️', 'easy', false,
   (SELECT id FROM levels WHERE slug = 'foundation'), 9),
  ('Circadian Rhythm Reset', 'circadian-rhythm-reset', 'Reset your internal clock', '🕐', 'medium', false,
   (SELECT id FROM levels WHERE slug = 'foundation'), 10)
ON CONFLICT (slug) DO NOTHING;

-- Now set up the complex prerequisite relationships
-- Multiple hacks with same prerequisite (Box Breathing branches to two hacks)
INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
VALUES
  -- Meditation Practice requires Box Breathing
  ((SELECT id FROM hacks WHERE slug = 'meditation-practice'),
   (SELECT id FROM hacks WHERE slug = 'box-breathing')),

  -- Deep Work Session also requires Box Breathing
  ((SELECT id FROM hacks WHERE slug = 'deep-work-session'),
   (SELECT id FROM hacks WHERE slug = 'box-breathing')),

  -- Ultimate Energy Boost requires BOTH Cold Shower AND Power Pose
  ((SELECT id FROM hacks WHERE slug = 'ultimate-energy-boost'),
   (SELECT id FROM hacks WHERE slug = 'cold-shower-finish')),
  ((SELECT id FROM hacks WHERE slug = 'ultimate-energy-boost'),
   (SELECT id FROM hacks WHERE slug = 'power-pose')),

  -- Vitamin D Optimization requires Morning Sunlight
  ((SELECT id FROM hacks WHERE slug = 'vitamin-d-optimization'),
   (SELECT id FROM hacks WHERE slug = 'morning-sunlight-exposure')),

  -- Circadian Rhythm Reset also requires Morning Sunlight
  ((SELECT id FROM hacks WHERE slug = 'circadian-rhythm-reset'),
   (SELECT id FROM hacks WHERE slug = 'morning-sunlight-exposure'))
ON CONFLICT (hack_id, prerequisite_hack_id) DO NOTHING;

-- Update positions to create a logical flow
UPDATE hacks SET position = 1 WHERE slug = 'morning-sunlight-exposure';
UPDATE hacks SET position = 2 WHERE slug = 'box-breathing';
UPDATE hacks SET position = 3 WHERE slug = 'pomodoro-technique';
UPDATE hacks SET position = 4 WHERE slug = 'cold-shower-finish';
UPDATE hacks SET position = 5 WHERE slug = 'power-pose';
UPDATE hacks SET position = 6 WHERE slug = 'meditation-practice';
UPDATE hacks SET position = 7 WHERE slug = 'deep-work-session';
UPDATE hacks SET position = 8 WHERE slug = 'ultimate-energy-boost';
UPDATE hacks SET position = 9 WHERE slug = 'vitamin-d-optimization';
UPDATE hacks SET position = 10 WHERE slug = 'circadian-rhythm-reset';

/*
Prerequisite Structure:
                    Morning Sunlight Exposure
                    /                      \
                   /                        \
        Vitamin D Optimization    Circadian Rhythm Reset
                  |
           Box Breathing
          /             \
         /               \
Meditation Practice   Deep Work Session
        |
   Pomodoro Technique
        |
   Cold Shower Finish
        |
    Power Pose
         \
          \_______________
                          \
                    Ultimate Energy Boost
                    (requires both Cold Shower AND Power Pose)
*/