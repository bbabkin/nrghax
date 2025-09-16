# Quick Fix for Production Database

## The Problem
The production database has wrong table structure. PostgREST can't find the relationships.

## The Solution (2 Steps)

### Step 1: Wipe Everything
Go to: https://supabase.com/dashboard/project/iwvfegsrtgpqkctxvzqk/sql

Copy and paste the entire contents of `/scripts/wipe-all-tables.sql` and run it.

This will delete ALL custom tables and start fresh.

### Step 2: Create New Schema

#### Option A: If DATABASE_URL is set in .env.production
```bash
./scripts/push-prisma-schema.sh
```

#### Option B: Manual
```bash
# Get password from Supabase Dashboard → Settings → Database
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.iwvfegsrtgpqkctxvzqk.supabase.co:5432/postgres"
npx prisma db push
```

## That's it!

After these 2 steps:
- All tables will be created properly
- Foreign keys will be set up
- PostgREST will recognize relationships
- The app will work

## Verify It Worked

1. Check tables exist in Supabase Dashboard
2. Run `npm run dev` and visit http://localhost:3000/hacks
3. No more errors!

## What Changed?

- We use `user_hacks` table with a `status` field (not separate tables for likes/completions)
- Status can be: 'liked', 'completed', or 'interested'
- All relationships are properly defined in Prisma schema