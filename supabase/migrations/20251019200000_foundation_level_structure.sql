-- Foundation Level Structure with Prerequisites
-- This migration sets up a clean Foundation level with 5 hacks and proper prerequisites

-- Keep only 5 specific hacks, delete the rest
DELETE FROM hacks WHERE name NOT IN (
  'Morning Sunlight Exposure',
  'Box Breathing',
  'Pomodoro Technique',
  'Cold Shower Finish',
  'Power Pose'
);

-- Assign all remaining hacks to Foundation level with proper positions
DO $$
DECLARE
  v_foundation_id UUID;
BEGIN
  SELECT id INTO v_foundation_id FROM levels WHERE slug = 'foundation';
  
  UPDATE hacks SET level_id = v_foundation_id, position = 0 WHERE name = 'Morning Sunlight Exposure';
  UPDATE hacks SET level_id = v_foundation_id, position = 1 WHERE name = 'Box Breathing';
  UPDATE hacks SET level_id = v_foundation_id, position = 2 WHERE name = 'Pomodoro Technique';
  UPDATE hacks SET level_id = v_foundation_id, position = 3 WHERE name = 'Cold Shower Finish';
  UPDATE hacks SET level_id = v_foundation_id, position = 4 WHERE name = 'Power Pose';
END $$;

-- Clear any existing prerequisites
DELETE FROM hack_prerequisites;

-- Set up prerequisite chain
-- Morning Sunlight (position 0) - no prerequisites (unlocked by default)
-- Box Breathing (position 1) - requires Morning Sunlight
-- Pomodoro (position 2) - requires Box Breathing
-- Cold Shower (position 3) - requires Box Breathing
-- Power Pose (position 4) - requires both Pomodoro AND Cold Shower

INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
SELECT 
  h1.id,
  h2.id
FROM hacks h1, hacks h2
WHERE h1.name = 'Box Breathing' AND h2.name = 'Morning Sunlight Exposure';

INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
SELECT 
  h1.id,
  h2.id
FROM hacks h1, hacks h2
WHERE h1.name = 'Pomodoro Technique' AND h2.name = 'Box Breathing';

INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
SELECT 
  h1.id,
  h2.id
FROM hacks h1, hacks h2
WHERE h1.name = 'Cold Shower Finish' AND h2.name = 'Box Breathing';

INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
SELECT 
  h1.id,
  h2.id
FROM hacks h1, hacks h2
WHERE h1.name = 'Power Pose' AND h2.name = 'Pomodoro Technique';

INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
SELECT 
  h1.id,
  h2.id
FROM hacks h1, hacks h2
WHERE h1.name = 'Power Pose' AND h2.name = 'Cold Shower Finish';

-- Ensure all 5 hacks have complete checklists (4 items each)
-- Morning Sunlight Exposure already has checks from previous migration

-- Add checks to Box Breathing (if not exists)
INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT h.id, 'Find a quiet space', '<p>Choose a calm environment where you won''t be disturbed.</p>', 0, true
FROM hacks h WHERE h.name = 'Box Breathing'
ON CONFLICT DO NOTHING;

INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT h.id, 'Practice the technique', '<p>Complete at least one full round of <strong>4-4-4-4</strong> breathing.</p>', 1, true
FROM hacks h WHERE h.name = 'Box Breathing'
ON CONFLICT DO NOTHING;

INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT h.id, 'Note how you feel', '<p>Pay attention to changes in your energy and mental state.</p>', 2, true
FROM hacks h WHERE h.name = 'Box Breathing'
ON CONFLICT DO NOTHING;

INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT h.id, 'Set a daily reminder', '<p><em>Optional:</em> Schedule regular practice sessions.</p>', 3, false
FROM hacks h WHERE h.name = 'Box Breathing'
ON CONFLICT DO NOTHING;

-- Add checks to Pomodoro Technique
INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT h.id, 'Choose your task', '<p>Select a specific task you want to work on.</p>', 0, true
FROM hacks h WHERE h.name = 'Pomodoro Technique'
ON CONFLICT DO NOTHING;

INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT h.id, 'Set a 25-minute timer', '<p>Use a timer app or physical timer.</p>', 1, true
FROM hacks h WHERE h.name = 'Pomodoro Technique'
ON CONFLICT DO NOTHING;

INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT h.id, 'Work with full focus', '<p>No distractions - turn off notifications!</p>', 2, true
FROM hacks h WHERE h.name = 'Pomodoro Technique'
ON CONFLICT DO NOTHING;

INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT h.id, 'Take your break', '<p><em>Optional:</em> Stand up, stretch, or grab water during your 5-minute break.</p>', 3, false
FROM hacks h WHERE h.name = 'Pomodoro Technique'
ON CONFLICT DO NOTHING;

-- Add checks to Cold Shower Finish
INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT h.id, 'Read safety guidelines', '<p>Review the <strong>safety precautions</strong> before attempting cold exposure.</p>', 0, true
FROM hacks h WHERE h.name = 'Cold Shower Finish'
ON CONFLICT DO NOTHING;

INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT h.id, 'Start with lukewarm', '<p>Begin with your normal warm shower, then gradually decrease temperature.</p>', 1, true
FROM hacks h WHERE h.name = 'Cold Shower Finish'
ON CONFLICT DO NOTHING;

INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT h.id, 'End with 30 seconds cold', '<p>Finish with 30-60 seconds of cold water.</p>', 2, true
FROM hacks h WHERE h.name = 'Cold Shower Finish'
ON CONFLICT DO NOTHING;

INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT h.id, 'Track your tolerance', '<p><em>Optional:</em> Keep a log of your cold exposure sessions and how you feel.</p>', 3, false
FROM hacks h WHERE h.name = 'Cold Shower Finish'
ON CONFLICT DO NOTHING;

-- Add checks to Power Pose
INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT h.id, 'Understand the science', '<p>Learn why <strong>body posture</strong> affects your mental state.</p>', 0, true
FROM hacks h WHERE h.name = 'Power Pose'
ON CONFLICT DO NOTHING;

INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT h.id, 'Try the Superman pose', '<p>Stand with feet shoulder-width apart, hands on hips, chest out for 2 minutes.</p>', 1, true
FROM hacks h WHERE h.name = 'Power Pose'
ON CONFLICT DO NOTHING;

INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT h.id, 'Use before a challenge', '<p>Power pose before an important meeting or event.</p>', 2, true
FROM hacks h WHERE h.name = 'Power Pose'
ON CONFLICT DO NOTHING;

INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT h.id, 'Notice the difference', '<p><em>Optional:</em> Journal about how you feel before and after power posing.</p>', 3, false
FROM hacks h WHERE h.name = 'Power Pose'
ON CONFLICT DO NOTHING;
