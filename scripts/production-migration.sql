-- Production Migration Script for Slug Support
-- Run this in Supabase SQL Editor

-- Step 1: Add slug column to hacks table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'hacks' AND column_name = 'slug') THEN
        ALTER TABLE "hacks" ADD COLUMN "slug" TEXT;
    END IF;
END $$;

-- Step 2: Create function to generate slugs
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            input_text,
            '[^\w\s-]', '', 'g'  -- Remove special characters
          ),
          '[\s_]+', '-', 'g'     -- Replace spaces and underscores with hyphens
        ),
        '^-+', '', 'g'           -- Remove leading hyphens
      ),
      '-+$', '', 'g'             -- Remove trailing hyphens
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Step 3: Update existing rows with slugs if they don't have them
UPDATE "hacks"
SET "slug" = generate_slug("name") || '-' || SUBSTRING("id"::TEXT, 1, 8)
WHERE "slug" IS NULL;

-- Step 4: Make slug NOT NULL after populating
ALTER TABLE "hacks" ALTER COLUMN "slug" SET NOT NULL;

-- Step 5: Add unique constraint (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes
                   WHERE indexname = 'hacks_slug_key') THEN
        CREATE UNIQUE INDEX "hacks_slug_key" ON "hacks"("slug");
    END IF;
END $$;

-- Step 6: Drop the temporary function
DROP FUNCTION IF EXISTS generate_slug(TEXT);

-- Step 7: Update the Prisma migration history (if using Prisma)
INSERT INTO "_prisma_migrations" (
    id,
    checksum,
    finished_at,
    migration_name,
    logs,
    rolled_back_at,
    started_at,
    applied_steps_count
) VALUES (
    '20250919144000',
    '8e9f0c24ec49a68b86e9ac92e1e9b8db5e3a94c7a3b2f1e0d9c8b7a6f5e4d3c2',
    NOW(),
    '20250919144000_add_slug_to_hacks',
    NULL,
    NULL,
    NOW(),
    1
) ON CONFLICT (id) DO NOTHING;

-- Verify the migration
SELECT
    'Migration completed successfully!' as status,
    COUNT(*) as hacks_with_slugs
FROM hacks
WHERE slug IS NOT NULL;