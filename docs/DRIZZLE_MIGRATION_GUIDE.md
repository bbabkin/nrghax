# Drizzle ORM Migration Guide

## Overview
We're now using Drizzle ORM for type-safe database operations and automated migrations. This replaces the manual SQL migration process.

## Benefits of Using Drizzle

✅ **Type Safety** - Full TypeScript types for all database operations
✅ **Auto Migrations** - Automatically generates SQL migrations from schema changes
✅ **IDE Support** - Autocomplete for table names, columns, and queries
✅ **Version Control** - Schema changes are tracked in TypeScript files
✅ **Less Manual Work** - No more writing raw SQL migrations

## Workflow

### 1. Making Schema Changes

Edit the schema file at `src/lib/db/schema.ts`:

```typescript
// Example: Adding a new column to profiles table
export const profiles = pgTable("profiles", {
  // ... existing columns
  timezone: text("timezone").default("UTC"), // NEW COLUMN
});
```

### 2. Generate Migration

After changing the schema, generate a migration:

```bash
npm run db:generate
```

This creates a new migration file in `drizzle/` folder with SQL commands.

### 3. Apply to Local Database

```bash
npm run db:migrate
```

### 4. Push to Production

For production, you have several options:

#### Option A: Direct Push (Simple)
```bash
npm run db:push
```
This applies schema changes directly without creating migration files.

#### Option B: Using Migrations (Recommended)
```bash
# Generate migration
npm run db:generate

# Apply to production
DATABASE_URL="your-production-url" npm run db:migrate
```

## Available Commands

```bash
# Development
npm run db:pull      # Pull schema from database (introspect)
npm run db:generate  # Generate migration from schema changes
npm run db:migrate   # Apply migrations to database
npm run db:push      # Push schema directly to database
npm run db:studio    # Open Drizzle Studio (visual database browser)
npm run db:check     # Check if migrations are in sync

# Production deployment
DATABASE_URL="production-url" npm run db:push
```

## Example: Adding a New Feature

Let's say we want to add a "badges" system:

### Step 1: Update Schema

```typescript
// src/lib/db/schema.ts

// Add new table
export const badges = pgTable("badges", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  requirement: jsonb("requirement"), // JSON for flexible criteria
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Add junction table for user badges
export const userBadges = pgTable("user_badges", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  badgeId: uuid("badge_id").references(() => badges.id, { onDelete: "cascade" }).notNull(),
  earnedAt: timestamp("earned_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Add unique constraint
  unq: unique().on(table.userId, table.badgeId),
}));
```

### Step 2: Generate and Review Migration

```bash
npm run db:generate
```

This creates: `drizzle/0001_add_badges.sql`

### Step 3: Apply Locally

```bash
npm run db:migrate
```

### Step 4: Use in Code

```typescript
// src/app/api/badges/route.ts
import { db } from '@/lib/db';
import { badges, userBadges } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Get all badges
const allBadges = await db.select().from(badges);

// Award a badge to user
await db.insert(userBadges).values({
  userId: 'user-uuid',
  badgeId: 'badge-uuid',
});

// Get user's badges with details
const userBadgeList = await db
  .select({
    badge: badges,
    earnedAt: userBadges.earnedAt,
  })
  .from(userBadges)
  .innerJoin(badges, eq(userBadges.badgeId, badges.id))
  .where(eq(userBadges.userId, userId));
```

## Production Deployment

### With Environment Variables

```bash
# Set production database URL
export DATABASE_URL="postgresql://user:pass@host:5432/db"

# Push schema changes
npm run db:push
```

### With CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy Database

on:
  push:
    branches: [main]
    paths:
      - 'src/lib/db/schema.ts'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - run: npm install

      - name: Push schema to production
        run: npm run db:push
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Drizzle Studio

Visual database browser:

```bash
npm run db:studio
```

Opens at http://localhost:4983 - you can:
- View all tables and data
- Run queries
- Edit data directly
- Export data

## Type Safety Examples

```typescript
// Type-safe queries
const user = await db
  .select()
  .from(profiles)
  .where(eq(profiles.email, 'user@example.com'))
  .limit(1);

// TypeScript knows the exact shape
user[0].email     // ✅ Type: string
user[0].isAdmin   // ✅ Type: boolean | null
user[0].notExist  // ❌ TypeScript error

// Type-safe inserts
await db.insert(profiles).values({
  id: 'uuid',
  email: 'test@example.com',
  fullName: 'Test User',
  // TypeScript will error if you miss required fields
  // or provide wrong types
});

// Type-safe updates
await db
  .update(profiles)
  .set({
    fullName: 'New Name',
    updatedAt: new Date(),
  })
  .where(eq(profiles.id, userId));
```

## Migration Best Practices

### DO ✅
- Always generate migrations for schema changes
- Review generated SQL before applying
- Test migrations locally first
- Keep migrations small and focused
- Use transactions for complex changes

### DON'T ❌
- Edit generated migration files directly
- Skip migrations and edit database manually
- Delete applied migrations
- Make breaking changes without app updates

## Rollback Strategy

If something goes wrong:

1. **Keep rollback migrations**
```sql
-- Save the inverse of your migration
-- drizzle/rollback/0001_remove_badges.sql
DROP TABLE user_badges;
DROP TABLE badges;
```

2. **Apply rollback**
```bash
psql $DATABASE_URL < drizzle/rollback/0001_remove_badges.sql
```

3. **Revert schema changes**
```bash
git revert <commit-with-schema-changes>
```

## Comparison: Old vs New

### Old Way (Manual SQL)
```bash
# 1. Write SQL manually
nano supabase/migrations/add_column.sql

# 2. Test locally
npx supabase db reset

# 3. Push to production
npx supabase db push
```

### New Way (Drizzle ORM)
```bash
# 1. Change TypeScript schema
# (edit src/lib/db/schema.ts)

# 2. Generate & apply
npm run db:generate
npm run db:migrate

# 3. Push to production
npm run db:push
```

## Common Patterns

### Adding a Column
```typescript
// schema.ts
export const profiles = pgTable("profiles", {
  // ... existing
  newField: text("new_field").default("default_value"),
});
```

### Creating an Index
```typescript
export const profiles = pgTable("profiles", {
  // columns...
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
}));
```

### Adding Foreign Key
```typescript
export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: uuid("author_id")
    .references(() => profiles.id, { onDelete: "cascade" })
    .notNull(),
});
```

### Enum Types
```typescript
export const roleEnum = pgEnum('role', ['user', 'admin', 'moderator']);

export const profiles = pgTable("profiles", {
  role: roleEnum("role").default('user'),
});
```

## Troubleshooting

### Schema out of sync
```bash
# Pull latest schema from database
npm run db:pull

# Generate fresh migration
npm run db:generate
```

### Migration fails
```bash
# Check migration status
npm run db:check

# Force push (careful!)
npm run db:push
```

### Type errors after schema change
```bash
# Restart TypeScript server in VS Code
Cmd+Shift+P > "TypeScript: Restart TS Server"
```

## Summary

✅ **Faster Development** - Change schema in TypeScript, auto-generate migrations
✅ **Type Safety** - No more runtime SQL errors
✅ **Better DX** - IDE autocomplete, type checking
✅ **Automated** - Less manual work, fewer errors

The Drizzle ORM approach eliminates most of the manual migration work while providing full type safety throughout your application!