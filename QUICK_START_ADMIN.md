# Quick Start: Admin Testing

## 🚀 Start Everything

```bash
# Terminal 1: Start Supabase
npx supabase start

# Terminal 2: Start Next.js
npm run dev
```

## 🔑 Admin Credentials

**Email:** `bbabkin@gmail.com`
**Password:** `test1234`

## 📍 URLs

- **App:** http://localhost:3000
- **Auth:** http://localhost:3000/auth
- **Admin:** http://localhost:3000/admin
- **Supabase Studio:** http://127.0.0.1:54323
- **Email Testing:** http://127.0.0.1:54324

## ✅ Quick Test

```bash
# Run database test
set -a && . .env.local && set +a && node scripts/test-admin-flow.mjs
```

## 📝 Manual Test Checklist

1. ☐ Sign up at /auth with `bbabkin@gmail.com`
2. ☐ Navigate to /admin
3. ☐ Create a hack at /admin/hacks/new
4. ☐ Edit an existing hack
5. ☐ Create a routine at /admin/routines/new
6. ☐ Edit an existing routine
7. ☐ Manage tags at /admin/tags
8. ☐ View levels at /admin/levels
9. ☐ View users at /admin/users

## 📊 Database Quick Checks

```bash
# Check admin emails
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT * FROM admin_emails;"

# Check users
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT email, is_admin FROM profiles;"

# Check hacks
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT id, name FROM hacks LIMIT 5;"
```

## 📄 Full Documentation

- **Complete Test Report:** `ADMIN_TEST_SUMMARY.md`
- **Manual Testing Guide:** `MANUAL_TEST_ADMIN.md`
- **Admin Credentials:** `ADMIN_CREDENTIALS.md`
