-- Remove unnecessary fields that were added without requirement

-- Drop energy_impact column
ALTER TABLE hacks
DROP COLUMN IF EXISTS energy_impact;

-- Drop time_to_complete column (keep time_minutes if it exists)
ALTER TABLE hacks
DROP COLUMN IF EXISTS time_to_complete;

-- Remove the related indexes
DROP INDEX IF EXISTS idx_hacks_difficulty;