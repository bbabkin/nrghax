# Manual Testing Guide: Levels System

This guide walks through testing the complete levels functionality with admin credentials.

## Prerequisites

1. Dev server running on port 3000: `npm run dev`
2. Test users created: `node scripts/create-test-users.js`

## Admin Credentials

- **Email**: admin@test.com
- **Password**: test123

## Test Steps

### Step 1: Login and Complete Onboarding

1. Navigate to http://localhost:3000/auth
2. Sign in with admin credentials
3. If redirected to `/onboarding`, complete the onboarding flow
4. Take screenshot: `01-onboarding-complete.png`

### Step 2: Create First Hack

1. Navigate to http://localhost:3000/admin/hacks/new
2. Fill in the form:
   - **Name**: "Morning Meditation"
   - **Slug**: "morning-meditation"
   - **Description**: "Start your day with 10 minutes of mindfulness meditation"
   - **Icon**: 🧘
   - **Difficulty**: Easy
   - **Content Type**: Content
   - **Level**: (select any existing level or leave blank)
3. Click "Create Hack"
4. Take screenshot: `02-first-hack-created.png`
5. Note the hack ID from the URL

### Step 3: Create a New Level

1. Navigate to http://localhost:3000/admin/levels/new
2. Fill in the form:
   - **Name**: "Mindfulness Mastery"
   - **Slug**: "mindfulness-mastery"
   - **Description**: "Master the art of mindfulness and presence"
   - **Icon**: 🎯
3. Click "Create Level"
4. Take screenshot: `03-level-created.png`
5. Note the level ID from the URL

### Step 4: Add First Hack to Level

1. From the level edit page, look for the hack management section
2. OR navigate to http://localhost:3000/admin/levels/[level-id]/hacks
3. Find "Morning Meditation" hack and add it to the level
4. Mark it as "Required"
5. Take screenshot: `04-hack-added-to-level.png`

### Step 5: Create Second Hack with Prerequisites

1. Navigate to http://localhost:3000/admin/hacks/new
2. Fill in the form:
   - **Name**: "Advanced Breathing Techniques"
   - **Slug**: "advanced-breathing"
   - **Description**: "Learn advanced breathwork for deep meditation"
   - **Icon**: 🌬️
   - **Difficulty**: Medium
   - **Content Type**: Content
   - **Level**: Select "Mindfulness Mastery"
   - **Prerequisites**: Select "Morning Meditation"
3. Click "Create Hack"
4. Take screenshot: `05-second-hack-with-prereq.png`

### Step 6: Add Checklist Items to First Hack

1. Navigate to the first hack's edit page
2. Look for "Checklist" or "Checks" section
3. Add checklist items:
   - "Find a quiet space"
   - "Set a 10-minute timer"
   - "Focus on your breath"
   - "Notice wandering thoughts without judgment"
   - "Return focus to breath"
4. Save the hack
5. Take screenshot: `06-hack-with-checklist.png`

### Step 7: View Levels Page (Public View)

1. Navigate to http://localhost:3000/levels
2. Verify you can see "Mindfulness Mastery" level
3. Take screenshot: `07-public-levels-page.png`

### Step 8: View Level Detail Page

1. Click on "Mindfulness Mastery" level
2. OR navigate to http://localhost:3000/levels/mindfulness-mastery
3. Verify the waterfall diagram shows:
   - "Morning Meditation" in the first layer (unlocked)
   - Arrow pointing down
   - "Advanced Breathing Techniques" in the second layer (locked with lock icon)
4. Take screenshot: `08-level-detail-waterfall.png`

### Step 9: View Hack Detail with Checklist

1. Click on "Morning Meditation" hack
2. OR navigate to http://localhost:3000/levels/mindfulness-mastery/hacks/morning-meditation
3. Verify the checklist items are displayed
4. Try checking off items
5. Take screenshot: `09-hack-detail-with-checklist.png`

### Step 10: Complete First Hack and Verify Unlock

1. On the hack detail page, mark all checklist items as complete
2. Click "Mark as Complete" button
3. Go back to the level detail page
4. Verify:
   - "Morning Meditation" shows green background and checkmark
   - "Advanced Breathing Techniques" is now unlocked (no lock icon)
5. Take screenshot: `10-first-hack-completed-second-unlocked.png`

### Step 11: Verify Visit Count

1. Click on "Morning Meditation" hack again
2. Go back to level page
3. Verify the hack now shows "2 visits" badge
4. Verify the "Required" badge is hidden (because visits > 1)
5. Take screenshot: `11-visit-count-displayed.png`

## Expected Results

✅ Admin can create hacks with all fields populated
✅ Admin can create levels
✅ Admin can add hacks to levels
✅ Admin can set prerequisites between hacks
✅ Admin can add checklist items to hacks
✅ Public levels page displays all levels correctly
✅ Level detail page shows waterfall diagram with proper layering
✅ Prerequisites lock/unlock hacks correctly
✅ Completed hacks show green styling
✅ Visit counts are tracked and displayed
✅ Required badge hides after multiple visits
✅ Checklist items are saved and displayed on hack detail page

## Troubleshooting

**Issue**: Can't access admin pages
- **Solution**: Make sure user has `is_admin: true` in profiles table

**Issue**: Hacks not showing in waterfall
- **Solution**: Ensure hacks are added to the level with correct level_id

**Issue**: Prerequisites not working
- **Solution**: Check hack_prerequisites table has correct entries

**Issue**: Checklist not showing
- **Solution**: Verify hack_checks table has records for the hack_id

## Screenshot Checklist

By the end of testing, you should have these screenshots in the `screenshots/` directory:

- [ ] 01-onboarding-complete.png
- [ ] 02-first-hack-created.png
- [ ] 03-level-created.png
- [ ] 04-hack-added-to-level.png
- [ ] 05-second-hack-with-prereq.png
- [ ] 06-hack-with-checklist.png
- [ ] 07-public-levels-page.png
- [ ] 08-level-detail-waterfall.png
- [ ] 09-hack-detail-with-checklist.png
- [ ] 10-first-hack-completed-second-unlocked.png
- [ ] 11-visit-count-displayed.png

These screenshots serve as validation that all features are working correctly.
