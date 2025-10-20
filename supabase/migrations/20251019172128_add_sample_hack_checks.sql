-- Add sample checklist items to existing hacks for testing
-- This will add checks to the "Morning Sunlight Exposure" hack if it exists

-- Add checks to the first hack (usually Morning Sunlight Exposure)
INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT
  h.id,
  'Watch the full video',
  '<p>Complete the entire video to understand the science behind morning sunlight exposure.</p>',
  0,
  true
FROM hacks h
WHERE h.slug LIKE '%morning-sunlight%' OR h.name LIKE '%Morning Sunlight%'
LIMIT 1;

INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT
  h.id,
  'Set a morning alarm',
  '<p>Set an alarm for sunrise time (or 30 minutes after) to remind yourself to get outside.</p>',
  1,
  true
FROM hacks h
WHERE h.slug LIKE '%morning-sunlight%' OR h.name LIKE '%Morning Sunlight%'
LIMIT 1;

INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT
  h.id,
  'Go outside within 30-60 minutes of waking',
  '<p>Get at least 10-15 minutes of sunlight exposure, preferably without sunglasses.</p>',
  2,
  true
FROM hacks h
WHERE h.slug LIKE '%morning-sunlight%' OR h.name LIKE '%Morning Sunlight%'
LIMIT 1;

INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT
  h.id,
  'Track your results for 3 days',
  '<p><strong>Optional:</strong> Keep a simple log of when you get sunlight and how you feel throughout the day.</p>',
  3,
  false
FROM hacks h
WHERE h.slug LIKE '%morning-sunlight%' OR h.name LIKE '%Morning Sunlight%'
LIMIT 1;

INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT
  h.id,
  'Share your experience',
  '<p><strong>Optional:</strong> Leave a comment below about your experience with morning sunlight exposure.</p>',
  4,
  false
FROM hacks h
WHERE h.slug LIKE '%morning-sunlight%' OR h.name LIKE '%Morning Sunlight%'
LIMIT 1;

-- Add some checks to another common hack for variety
INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT
  h.id,
  'Read the complete instructions',
  '<p>Make sure you understand all the steps before starting this hack.</p>',
  0,
  true
FROM hacks h
WHERE h.id != (SELECT id FROM hacks WHERE h.slug LIKE '%morning-sunlight%' OR h.name LIKE '%Morning Sunlight%' LIMIT 1)
LIMIT 1;

INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT
  h.id,
  'Prepare necessary materials',
  '<p>Gather everything you need before you begin.</p>',
  1,
  true
FROM hacks h
WHERE h.id != (SELECT id FROM hacks WHERE h.slug LIKE '%morning-sunlight%' OR h.name LIKE '%Morning Sunlight%' LIMIT 1)
LIMIT 1;

INSERT INTO hack_checks (hack_id, title, description, position, is_required)
SELECT
  h.id,
  'Try the hack for yourself',
  '<p><strong>Optional:</strong> Apply what you learned and see how it works for you.</p>',
  2,
  false
FROM hacks h
WHERE h.id != (SELECT id FROM hacks WHERE h.slug LIKE '%morning-sunlight%' OR h.name LIKE '%Morning Sunlight%' LIMIT 1)
LIMIT 1;