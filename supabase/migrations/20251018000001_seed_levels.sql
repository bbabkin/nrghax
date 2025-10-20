-- Seed data for levels system
-- This creates sample levels and assigns existing hacks to them

DO $$
DECLARE
  level_foundation_id UUID;
  level_direction_id UUID;
  level_movement_id UUID;
  level_confidence_id UUID;
  level_mastery_id UUID;
BEGIN
  -- Create Level 1: Foundation (Basics - No prerequisites)
  INSERT INTO public.levels (name, slug, description, icon, position)
  VALUES (
    'Foundation',
    'foundation',
    'Master the fundamental habits that form the basis of all self-improvement',
    '🏛️',
    0
  )
  RETURNING id INTO level_foundation_id;

  -- Assign basic hacks to Foundation level
  UPDATE public.hacks
  SET
    level_id = level_foundation_id,
    is_required = true,
    icon = CASE slug
      WHEN 'morning-sunlight' THEN '☀️'
      WHEN 'box-breathing' THEN '🫁'
      WHEN 'two-minute-rule' THEN '⏱️'
      WHEN 'gratitude-journal' THEN '📝'
      WHEN 'morning-stretch-routine' THEN '🤸'
    END,
    position = CASE slug
      WHEN 'morning-sunlight' THEN 1
      WHEN 'box-breathing' THEN 2
      WHEN 'two-minute-rule' THEN 3
      WHEN 'gratitude-journal' THEN 4
      WHEN 'morning-stretch-routine' THEN 5
    END
  WHERE slug IN ('morning-sunlight', 'box-breathing', 'two-minute-rule', 'gratitude-journal', 'morning-stretch-routine');

  -- Add an optional hack to Foundation
  UPDATE public.hacks
  SET
    level_id = level_foundation_id,
    is_required = false,
    icon = '☕',
    position = 6
  WHERE slug = 'desk-stretches';

  -- Create Level 2: Direction (Focus & Productivity - Requires Foundation)
  INSERT INTO public.levels (name, slug, description, icon, position)
  VALUES (
    'Direction',
    'direction',
    'Learn to focus your energy and manage your time effectively',
    '🎯',
    1
  )
  RETURNING id INTO level_direction_id;

  -- Assign productivity hacks to Direction level
  UPDATE public.hacks
  SET
    level_id = level_direction_id,
    is_required = true,
    icon = CASE slug
      WHEN 'pomodoro' THEN '🍅'
      WHEN 'deep-work' THEN '🧠'
      WHEN 'focus-music-session' THEN '🎵'
    END,
    position = CASE slug
      WHEN 'pomodoro' THEN 1
      WHEN 'deep-work' THEN 2
      WHEN 'focus-music-session' THEN 3
    END
  WHERE slug IN ('pomodoro', 'deep-work', 'focus-music-session');

  -- Add prerequisite: Direction requires Foundation
  INSERT INTO public.level_prerequisites (level_id, prerequisite_level_id)
  VALUES (level_direction_id, level_foundation_id);

  -- Create Level 3: Movement (Physical Health - Requires Foundation)
  INSERT INTO public.levels (name, slug, description, icon, position)
  VALUES (
    'Movement',
    'movement',
    'Build strength, flexibility, and energy through physical practices',
    '💪',
    2
  )
  RETURNING id INTO level_movement_id;

  -- Assign fitness hacks to Movement level
  UPDATE public.hacks
  SET
    level_id = level_movement_id,
    is_required = true,
    icon = CASE slug
      WHEN 'morning-yoga-flow' THEN '🧘'
      WHEN 'hiit-workout' THEN '🏃'
      WHEN 'mobility-flow' THEN '🤸'
      WHEN 'posture-fix-routine' THEN '🪑'
    END,
    position = CASE slug
      WHEN 'morning-yoga-flow' THEN 1
      WHEN 'hiit-workout' THEN 2
      WHEN 'mobility-flow' THEN 3
      WHEN 'posture-fix-routine' THEN 4
    END
  WHERE slug IN ('morning-yoga-flow', 'hiit-workout', 'mobility-flow', 'posture-fix-routine');

  -- Add optional hacks to Movement
  UPDATE public.hacks
  SET
    level_id = level_movement_id,
    is_required = false,
    icon = CASE slug
      WHEN 'cold-shower' THEN '🚿'
      WHEN 'evening-wind-down-yoga' THEN '🌙'
    END,
    position = CASE slug
      WHEN 'cold-shower' THEN 5
      WHEN 'evening-wind-down-yoga' THEN 6
    END
  WHERE slug IN ('cold-shower', 'evening-wind-down-yoga');

  -- Add prerequisite: Movement requires Foundation
  INSERT INTO public.level_prerequisites (level_id, prerequisite_level_id)
  VALUES (level_movement_id, level_foundation_id);

  -- Create Level 4: Confidence (Social Skills - Requires Foundation)
  INSERT INTO public.levels (name, slug, description, icon, position)
  VALUES (
    'Confidence',
    'confidence',
    'Develop social confidence and communication mastery',
    '🎭',
    3
  )
  RETURNING id INTO level_confidence_id;

  -- Assign social hacks to Confidence level
  UPDATE public.hacks
  SET
    level_id = level_confidence_id,
    is_required = true,
    icon = CASE slug
      WHEN 'power-pose' THEN '🦸'
      WHEN 'eye-contact' THEN '👁️'
      WHEN 'ford-method' THEN '💬'
      WHEN 'communication-skills' THEN '🗣️'
    END,
    position = CASE slug
      WHEN 'power-pose' THEN 1
      WHEN 'eye-contact' THEN 2
      WHEN 'ford-method' THEN 3
      WHEN 'communication-skills' THEN 4
    END
  WHERE slug IN ('power-pose', 'eye-contact', 'ford-method', 'communication-skills');

  -- Add optional hack to Confidence
  UPDATE public.hacks
  SET
    level_id = level_confidence_id,
    is_required = false,
    icon = '🌟',
    position = 5
  WHERE slug = 'confidence-building';

  -- Add prerequisite: Confidence requires Foundation
  INSERT INTO public.level_prerequisites (level_id, prerequisite_level_id)
  VALUES (level_confidence_id, level_foundation_id);

  -- Create Level 5: Mastery (Advanced Techniques - Requires Direction, Movement, and Confidence)
  INSERT INTO public.levels (name, slug, description, icon, position)
  VALUES (
    'Mastery',
    'mastery',
    'Master advanced techniques for peak performance and deep relaxation',
    '🏆',
    4
  )
  RETURNING id INTO level_mastery_id;

  -- Assign advanced hacks to Mastery level
  UPDATE public.hacks
  SET
    level_id = level_mastery_id,
    is_required = true,
    icon = CASE slug
      WHEN 'wim-hof-breathing' THEN '❄️'
      WHEN 'meditation-basics' THEN '🧘‍♂️'
      WHEN 'sleep-meditation' THEN '😴'
    END,
    position = CASE slug
      WHEN 'wim-hof-breathing' THEN 1
      WHEN 'meditation-basics' THEN 2
      WHEN 'sleep-meditation' THEN 3
    END
  WHERE slug IN ('wim-hof-breathing', 'meditation-basics', 'sleep-meditation');

  -- Add prerequisites: Mastery requires Direction, Movement, and Confidence
  INSERT INTO public.level_prerequisites (level_id, prerequisite_level_id)
  VALUES
    (level_mastery_id, level_direction_id),
    (level_mastery_id, level_movement_id),
    (level_mastery_id, level_confidence_id);

END $$;

-- Add comments for documentation
COMMENT ON TABLE public.levels IS 'Sample levels created in seed data: Foundation, Direction, Movement, Confidence, Mastery';
