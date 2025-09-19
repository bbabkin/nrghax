-- Add slug column to hacks table with temporary default
ALTER TABLE "hacks" ADD COLUMN "slug" TEXT;

-- Create a function to generate slugs from names
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

-- Update existing rows with slugs generated from their names
UPDATE "hacks"
SET "slug" = generate_slug("name") || '-' || SUBSTRING("id"::TEXT, 1, 8)
WHERE "slug" IS NULL;

-- Make slug NOT NULL after populating
ALTER TABLE "hacks" ALTER COLUMN "slug" SET NOT NULL;

-- Add unique constraint
CREATE UNIQUE INDEX "hacks_slug_key" ON "hacks"("slug");

-- Drop the temporary function
DROP FUNCTION generate_slug(TEXT);

-- Note: The status column in user_hacks is TEXT, not an enum, so 'viewed' can be used directly