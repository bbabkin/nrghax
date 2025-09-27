-- Add category and missing fields to hacks table

-- Add category column if it doesn't exist
ALTER TABLE hacks
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add energy_impact column if it doesn't exist (for seed data)
ALTER TABLE hacks
ADD COLUMN IF NOT EXISTS energy_impact INTEGER CHECK (energy_impact >= 1 AND energy_impact <= 10);

-- Add time_to_complete column if it doesn't exist (renamed from time_minutes)
ALTER TABLE hacks
ADD COLUMN IF NOT EXISTS time_to_complete INTEGER;

-- Add difficulty column with proper type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'hacks'
                   AND column_name = 'difficulty'
                   AND data_type = 'text') THEN
        ALTER TABLE hacks DROP COLUMN IF EXISTS difficulty;
        ALTER TABLE hacks ADD COLUMN difficulty TEXT
            CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert'));
    END IF;
END $$;

-- Add index on category for performance
CREATE INDEX IF NOT EXISTS idx_hacks_category ON hacks(category);

-- Add index on difficulty for performance
CREATE INDEX IF NOT EXISTS idx_hacks_difficulty ON hacks(difficulty);

-- Update any existing records with default values if needed
UPDATE hacks
SET category = 'general'
WHERE category IS NULL;

-- Add some common categories as a comment for reference
COMMENT ON COLUMN hacks.category IS 'Hack categories: mindfulness, sleep, recovery, nutrition, exercise, productivity, focus, breathing, cold_therapy, supplements';