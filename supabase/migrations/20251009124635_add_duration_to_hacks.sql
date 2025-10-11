-- Add duration_minutes column to hacks table
ALTER TABLE hacks
ADD COLUMN duration_minutes INTEGER;

-- Add comment to explain the column
COMMENT ON COLUMN hacks.duration_minutes IS 'Duration of the hack content in minutes. Auto-populated from YouTube videos or manually entered.';

-- Create index for querying by duration
CREATE INDEX idx_hacks_duration ON hacks(duration_minutes) WHERE duration_minutes IS NOT NULL;
