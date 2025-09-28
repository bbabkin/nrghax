# Manual Admin Test Instructions

## Test Account Created
- **Email:** admin@test.com
- **Password:** Admin123!
- **Status:** Admin user (is_admin = true)

## Steps to Test Manually

1. Open browser to http://localhost:3000/auth
2. Sign in with the above credentials
3. After login, navigate to http://localhost:3000/hacks
4. Check for:
   - Admin badge in navbar (purple-pink gradient with shield icon)
   - Floating action buttons (bottom right)
   - Edit/Delete buttons on hack cards

## Current Issue
The authentication is working (login redirects to dashboard) but the session isn't persisting when navigating to other pages. This appears to be a cookie/session handling issue between client and server components.

## Debug Information
- Server debug shows: "Server User: Not logged in"
- Client debug component removed (was showing same)
- Database has the admin user with is_admin = true