# Claude Development Guidelines

## Database Management

This project uses **Prisma ORM**. Custom SQL is LAST RESORT.

### Key Commands

**Development:**
```bash
npx prisma migrate dev --name describe_changes  # Create & apply migration
npx prisma migrate reset                         # Reset DB (dev only)
```

**Production:**
```bash
npx prisma migrate deploy                        # Deploy migrations
npx prisma migrate status                        # Check status
```

**Never use `prisma db push` in production** - it's for prototyping only.

### Workflow

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your_change`
3. Test locally
4. Deploy with `npx prisma migrate deploy`

### Environment Variables

**IMPORTANT: Use Vercel/Supabase standard variable names**

```bash
# Development (.env.local)
POSTGRES_URL="postgresql://postgres:postgres@localhost:54322/postgres"
POSTGRES_URL_NON_POOLING="postgresql://postgres:postgres@localhost:54322/postgres"

# Production (Vercel/Supabase)
POSTGRES_URL="postgresql://postgres.[project]:[password]@[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
```

**Never use `DATABASE_URL` or `DIRECT_URL`** - These are not Vercel/Supabase standards. Always use:
- `POSTGRES_URL` - For connection pooling (app queries)
- `POSTGRES_URL_NON_POOLING` - For direct connections (migrations)

## Project Structure

- `/prisma/schema.prisma` - Database schema (source of truth)
  - Must use `url = env("POSTGRES_URL")` for pooled connections
  - Must use `directUrl = env("POSTGRES_URL_NON_POOLING")` for migrations
- `/prisma/migrations/` - Migration history (DO NOT EDIT)
- No Drizzle - we migrated to Prisma due to connection issues

## File Organization

**Root folder must contain ONLY:**
- Config files (next.config.js, tsconfig.json, etc.)
- Package files (package.json, package-lock.json)
- Dot files (.env, .gitignore, .eslintrc.json)
- README.md, LICENSE, CLAUDE.md

**Never put in root:**
- Test scripts → Use `__tests__/` or `tests/`
- Documentation → Use `docs/`
- Screenshots → Delete after use
- SQL files → Use Prisma migrations
- Temporary files → Delete immediately

## Security

**NEVER commit:**
- API keys, passwords, tokens
- .env files (except .env.example)
- Database URLs with passwords
- Service account credentials

Always use environment variables for secrets.

## Testing

Always run before commits:
```bash
npm run lint
npm run typecheck  # if available
npm test           # if available
```