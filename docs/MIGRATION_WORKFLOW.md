# Database Migration Workflow

## Overview

This project uses Prisma Migrate for database schema management. Migrations are version-controlled, reversible, and automatically tracked.

## Key Principles

1. **Never modify production database manually** - All changes go through migrations
2. **Migrations are immutable** - Once created, never edit migration files
3. **Test locally first** - Always test migrations in development before production
4. **Keep migrations atomic** - Each migration should do one thing

## Development Workflow

### Creating a New Migration

1. **Modify the Prisma schema** (`prisma/schema.prisma`)
2. **Create migration**:
   ```bash
   npm run db:migrate
   # or with a specific name
   npx prisma migrate dev --name describe_your_change
   ```
3. **Test the migration** locally
4. **Commit both** schema changes and migration files

### Common Commands

```bash
# Check migration status
npm run db:migrate status

# Create migration without applying (for review)
npx prisma migrate dev --create-only --name your_migration_name

# Reset database (DEVELOPMENT ONLY - data loss!)
npx prisma migrate reset

# View database in browser
npm run db:studio
```

## Production Deployment

### Automatic Deployment (Recommended)

Add to your deployment pipeline (Vercel, Railway, etc.):

```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build",
  "installCommand": "npm install"
}
```

### Manual Deployment

1. **Set environment variables**:
   ```bash
   export POSTGRES_URL_NON_POOLING="your-direct-connection-url"
   ```

2. **Run deployment script**:
   ```bash
   ./scripts/deploy-migrations.sh
   ```

   Or directly:
   ```bash
   npm run db:deploy
   ```

### Vercel Deployment

For Vercel, add to `vercel.json`:

```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build"
}
```

## Rollback Strategy

### Method 1: Create a Compensating Migration (Recommended)

```bash
# Create a new migration that undoes the changes
npx prisma migrate dev --name rollback_previous_change

# Example: If you added a column, create migration to remove it
# Example: If you added a table, create migration to drop it
```

### Method 2: Reset to Specific Migration (Development Only)

```bash
# List all migrations
ls prisma/migrations/

# Reset to specific point (DESTRUCTIVE - loses data after that point)
npx prisma migrate resolve --rolled-back 20250920213400_migration_name
npx prisma migrate deploy
```

### Method 3: Emergency Database Restore (Last Resort)

1. Restore database backup from before migration
2. Mark migration as rolled back:
   ```bash
   npx prisma migrate resolve --rolled-back migration_name
   ```
3. Delete the migration files from `prisma/migrations/`
4. Commit and push changes

## Migration Best Practices

### DO:
- ✅ Test migrations locally first
- ✅ Create backup before major migrations
- ✅ Use descriptive migration names
- ✅ Keep migrations small and focused
- ✅ Include both up and down logic mentally
- ✅ Version control all migration files

### DON'T:
- ❌ Edit existing migrations
- ❌ Delete migration files manually
- ❌ Use `prisma db push` in production
- ❌ Skip migrations in deployment
- ❌ Mix schema changes with data migrations

## Troubleshooting

### "Migration failed to apply"

1. Check migration status:
   ```bash
   npx prisma migrate status
   ```

2. If migration is partially applied:
   ```bash
   npx prisma migrate resolve --applied migration_name
   ```

3. If migration needs rollback:
   ```bash
   npx prisma migrate resolve --rolled-back migration_name
   ```

### "Database schema drift detected"

This means database doesn't match migrations. Solutions:

1. **Development**: Reset database
   ```bash
   npx prisma migrate reset
   ```

2. **Production**: Create baseline
   ```bash
   npx prisma migrate diff \
     --from-schema-datasource prisma/schema.prisma \
     --to-schema-datamodel prisma/schema.prisma \
     --script > fix-drift.sql
   ```

### "Shadow database error"

For Supabase/managed databases:

1. Create a separate shadow database
2. Set in `.env`:
   ```bash
   DATABASE_URL="your-main-db"
   SHADOW_DATABASE_URL="your-shadow-db"
   ```

## Environment Variables

```bash
# Development (.env.local)
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"

# Production (.env.production)
POSTGRES_URL="pooled-connection-url"           # For app queries
POSTGRES_URL_NON_POOLING="direct-connection"   # For migrations
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npx prisma generate
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      - run: npm run build
```

## Emergency Procedures

### Complete Migration Reset (Nuclear Option)

**⚠️ WARNING: This destroys all data!**

```bash
# 1. Export critical data first
# 2. Drop all tables
# 3. Re-run all migrations
npx prisma migrate reset --skip-seed
npx prisma migrate deploy
```

### Production Hotfix

For urgent production fixes when migrations are broken:

1. **Apply SQL directly** (document everything!)
2. **Create matching migration** locally:
   ```bash
   npx prisma db pull  # Pull current schema
   npx prisma migrate dev --create-only --name hotfix_description
   ```
3. **Mark as applied** in production:
   ```bash
   npx prisma migrate resolve --applied hotfix_migration_name
   ```
4. **Test thoroughly** in staging

## Current Migration Status

To check what migrations exist and their status:

```bash
# Local
npm run db:migrate status

# Production (with proper env vars)
DATABASE_URL=$POSTGRES_URL_NON_POOLING npx prisma migrate status
```

## References

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Migration Troubleshooting](https://www.prisma.io/docs/guides/database/troubleshooting)
- [Production Deployment](https://www.prisma.io/docs/guides/deployment/deploy-database)