-- Make a specific user admin by email
-- Replace 'admin@example.com' with the actual email
UPDATE profiles
SET is_admin = true
WHERE email = 'admin@example.com';

-- Or make the first user admin (if not already set)
UPDATE profiles
SET is_admin = true
WHERE id = (
    SELECT id
    FROM profiles
    ORDER BY created_at ASC
    LIMIT 1
)
AND NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE is_admin = true
);

-- Verify the change
SELECT id, email, full_name, is_admin
FROM profiles
WHERE is_admin = true;