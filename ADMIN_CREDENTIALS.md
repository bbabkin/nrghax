# Admin Credentials for NRGHax

## Development Admin Accounts

Two admin accounts have been set up for development and testing:

### Primary Admin
- **Email:** `admin@nrghax.com`
- **Password:** `AdminPass123!`
- **Description:** Primary admin account with full admin privileges

### Test Admin
- **Email:** `admin@test.com`
- **Password:** `Test123!`
- **Description:** Secondary admin account for testing purposes

## How to Use

1. **Web Interface**
   - Navigate to http://localhost:3000/auth
   - Use either set of credentials to log in
   - Admin users will have access to admin-only features and routes

2. **Creating Admin Users** (First Time Setup)
   ```bash
   # After running `supabase db reset`, create admin users via signup:
   node scripts/signup-admin.js
   ```

3. **Testing Admin Login**
   ```bash
   # Run the test script to verify admin authentication
   node scripts/test-admin-login.js
   ```

## Important Notes

⚠️ **Admin User Creation:** Admin users MUST be created via the Supabase signup API (using `scripts/signup-admin.js`), not via direct SQL inserts. This ensures proper password hashing and identity setup.

The migration `20251114175557_create_admin_test_user.sql` has been disabled because:
- Direct SQL inserts into `auth.users` cause authentication issues
- Supabase Auth (GoTrue) expects users to be created via its API
- Password hashing must be done by the auth service, not via SQL `crypt()`

## Security Notes

⚠️ **IMPORTANT:** These credentials are for development only!
- Never use these passwords in production
- Always use strong, unique passwords for production admin accounts
- Store production credentials securely (use environment variables or secret management systems)
- The admin emails are automatically granted admin privileges through the `admin_emails` table

## Admin Features

Admin users have access to:
- Admin dashboard at `/admin`
- User management capabilities
- Content moderation features
- System configuration options
- All protected routes and features

## Troubleshooting

If login fails with "Invalid credentials":
1. Restart Supabase: `npx supabase stop && npx supabase start`
2. Recreate admin users: `PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -f scripts/create-admin.sql`
3. Test login: `node scripts/test-admin-login.js`

If you need to add a new admin email:
```sql
INSERT INTO public.admin_emails (email) VALUES ('new-admin@example.com');
```

## Files Related to Admin Setup

- `/scripts/create-admin.sql` - SQL script to create admin users
- `/scripts/test-admin-login.js` - Script to test admin authentication
- `/scripts/seed-admin.js` - Node.js script for seeding admin users (alternative method)
- `/supabase/migrations/20251114175557_create_admin_test_user.sql` - Migration that sets up admin users during db reset