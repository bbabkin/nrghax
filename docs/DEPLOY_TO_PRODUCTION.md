# Deploy Database to Production with Supabase CLI

## Prerequisites
You need your Supabase project reference ID. You can find this:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → General
4. Copy the "Reference ID" (looks like: abcdefghijklmnop)

## Step 1: Link to Production

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

When prompted, enter your database password (the one you set when creating the project).

## Step 2: Push Migrations to Production

This will apply all migrations in order:

```bash
npx supabase db push
```

This command will:
- Apply all migrations in `supabase/migrations/` folder
- Create all tables, triggers, and functions
- Set up RLS policies

## Step 3: Seed Initial Data (Optional)

If you want to add initial data (questions, tags, etc.):

```bash
npx supabase db seed
```

## Step 4: Create Admin Profile for Existing User

Since you already have a user (bbabkin@gmail.com), run this to create their profile:

```bash
npx supabase db execute --sql "
INSERT INTO public.profiles (id, email, is_admin, created_at, updated_at)
SELECT
    id,
    email,
    true,
    created_at,
    updated_at
FROM auth.users
WHERE email = 'bbabkin@gmail.com'
ON CONFLICT (id)
DO UPDATE SET is_admin = true;
"
```

## Step 5: Verify

Check that everything worked:

```bash
# List all tables
npx supabase db execute --sql "
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
"

# Check admin user
npx supabase db execute --sql "
SELECT email, is_admin FROM public.profiles;
"
```

## Alternative: Reset Everything

If you need to completely reset:

```bash
# Reset to a clean state (WARNING: DELETES ALL DATA)
npx supabase db reset --linked

# Then push migrations
npx supabase db push

# Then create admin profile
npx supabase db execute --sql "
INSERT INTO public.profiles (id, email, is_admin, created_at, updated_at)
SELECT id, email, true, created_at, updated_at
FROM auth.users WHERE email = 'bbabkin@gmail.com'
ON CONFLICT (id) DO UPDATE SET is_admin = true;
"
```

## Troubleshooting

### "Permission denied" errors
Make sure you're using the database password, not the anon key.

### "Relation does not exist" errors
Run migrations first with `npx supabase db push`

### Profile not created
The trigger might not have fired. Run the manual INSERT command in Step 4.

## Future Migrations

To create new migrations:

```bash
# Create a new migration file
npx supabase migration new migration_name

# Edit the file in supabase/migrations/
# Then push to production
npx supabase db push
```