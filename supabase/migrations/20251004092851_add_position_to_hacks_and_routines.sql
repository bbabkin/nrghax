-- Add position field to hacks table
ALTER TABLE public.hacks
ADD COLUMN position INTEGER DEFAULT 0;

-- Add position field to routines table
ALTER TABLE public.routines
ADD COLUMN position INTEGER DEFAULT 0;

-- Set initial position values for existing hacks based on created_at (oldest first gets position 0)
WITH numbered_hacks AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 as new_position
  FROM public.hacks
)
UPDATE public.hacks h
SET position = nh.new_position
FROM numbered_hacks nh
WHERE h.id = nh.id;

-- Set initial position values for existing routines based on created_at (oldest first gets position 0)
WITH numbered_routines AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 as new_position
  FROM public.routines
)
UPDATE public.routines r
SET position = nr.new_position
FROM numbered_routines nr
WHERE r.id = nr.id;

-- Create indexes for better performance when ordering by position
CREATE INDEX idx_hacks_position ON public.hacks(position);
CREATE INDEX idx_routines_position ON public.routines(position);

-- Add comment for documentation
COMMENT ON COLUMN public.hacks.position IS 'Display order position for drag-and-drop sorting';
COMMENT ON COLUMN public.routines.position IS 'Display order position for drag-and-drop sorting';