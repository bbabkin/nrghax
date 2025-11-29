-- Add Relaxation Exercise as the first foundation hack
-- This exercise prepares users for energy work by teaching body awareness and relaxation

DO $$
DECLARE
  foundation_level_id UUID;
  relaxation_id UUID;
BEGIN
  -- Get foundation level
  SELECT id INTO foundation_level_id FROM levels WHERE slug = 'foundation';

  -- Insert Relaxation Exercise (Position 1 - Entry point, no prerequisites)
  INSERT INTO hacks (
    slug,
    name,
    description,
    position,
    difficulty,
    time_minutes,
    level_id,
    is_required,
    content_type,
    content_body,
    icon
  )
  VALUES (
    'relaxation-exercise',
    'Relaxation Exercise',
    'One of the most popular relaxation exercises out there!',
    1,
    'Beginner',
    5,
    foundation_level_id,
    false,
    'content',
    E'<p>Met across a multitude of different schools and practices:</p><p><br>The energy exercises in this hub a great deal on our ability to sense our body, to concentrate on different signals. </p><p></p><p>Therefore we should start with a relaxation exercise that will prepare us for the journey ahead. For this and all other exercises ensure that you do not picture yourself ''from the side'' or from ''third person'', but picture everything ''from within'' or from ''first person''.</p><p></p><p>We begin by removing our thoughts. Easier said than done. First, where are those thoughts located?</p><p>Read this, then close your eyes and picture the front door to your home. You know that the door is in your home, but right now you are seeing it somewhere in your head. Try to remember a memory that is related to that door. Where does that memory come from? Open your eyes.</p><p></p><p>The exercise above helps identifying our inner space. Now let''s clear it from all the thoughts. The easiest way to do it is to acknowledge that they are there, and right now there is nothing you can do to stop the flow of thoughts. Just accept them but erase them from the inner space. You can try picturing yourself submerged in water, where your thoughts are air bubbles that go to the surface before you get a chance to think of them. Another exercise could be to picture them as sailboats that float by while you sit on a river bank. Alternatively, simply picture a giant eraser that wipes them off your ''screen''.</p><p></p><p>Now similarly, remove any emotions that you may have. Then remove any images that could have remained from those thoughts and emotions. In this moment of total clarity proceed to the second part.</p><p>While your mind is absolutely clear, focus all your attention on the tips of your toes. Let that focus consume your whole inner space as if there is nothing in the world but those toe tips. Hold your concentration longer and longer while noticing that you sense your toes better and better. You might notice a warm sensation in your toes. Pretend that it is a warm pleasant liquid. While maintaining complete focus, picture this warmth traveling up towards the heels of the feet. Then slowly it moves over to the calves, then knees, pelvis. The warmth slowly moves to the stomach and chest area, traveling to the arms, all the way to the fingertips, then the neck to the top of the head. Pause. Stay in this state as long as necessary. Notice how your whole body is completely relaxed.</p><p></p><p>Compare how your body felt before and after the exercise. Repeat the exercise if necessary. Repeat it whenever you need to relieve stress. With every repetition it will become easier to reach the relaxation state.</p>',
    '<,'
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    position = EXCLUDED.position,
    difficulty = EXCLUDED.difficulty,
    time_minutes = EXCLUDED.time_minutes,
    level_id = EXCLUDED.level_id,
    is_required = EXCLUDED.is_required,
    content_body = EXCLUDED.content_body,
    icon = EXCLUDED.icon
  RETURNING id INTO relaxation_id;

  -- Update Morning Sunlight to position 2 and add prerequisite
  UPDATE hacks
  SET position = 2
  WHERE slug = 'morning-sunlight';

  -- Add prerequisite: Morning Sunlight requires Relaxation Exercise
  INSERT INTO hack_prerequisites (hack_id, prerequisite_hack_id)
  SELECT h.id, relaxation_id
  FROM hacks h
  WHERE h.slug = 'morning-sunlight'
  ON CONFLICT DO NOTHING;

END $$;

-- Summary:
-- Relaxation Exercise is now the first hack in the Foundation level
-- Morning Sunlight requires Relaxation Exercise to be completed first
