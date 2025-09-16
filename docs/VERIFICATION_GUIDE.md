# Onboarding Flow Verification Guide

The onboarding system has been successfully implemented with all requested features. Here's how to manually verify the functionality:

## Features Implemented

✅ **Auto-advance on single choice questions**
- Questions 1, 4, and 5 will automatically advance after selection
- 300ms delay before advancing

✅ **Skip link redesign**
- Skip button replaced with centered text link
- Text reads "Skip onboarding questions"

✅ **Admin onboarding management**
- New "Onboarding" nav item for admins
- Full question/answer editing interface
- Drag to reorder questions
- Add/remove options
- Edit question text, descriptions, and icons

## Manual Testing Steps

### Admin Flow

1. **Navigate to** http://localhost:3000
2. **Click** "Login" in navbar
3. **Sign in as admin:**
   - Email: `admin@example.com`
   - Password: `admin123`
4. **Verify admin navigation:**
   - You should see additional nav items: Users, Manage Hacks, Tags, **Onboarding**
5. **Click "Onboarding"** in navbar
6. **On the admin onboarding page, verify you can:**
   - See all 5 questions listed
   - Click edit icon to modify questions
   - Change question titles and descriptions
   - Add/remove answer options
   - Modify option labels and icons
   - Reorder questions with up/down arrows
   - Save changes

### New User Flow

1. **Sign out** if logged in
2. **Navigate to** http://localhost:3000/auth
3. **Create new account:**
   - Email: `testuser@example.com`
   - Password: `password123`
4. **After signup, you'll be redirected to onboarding**
5. **Verify Question 1 (Experience Level):**
   - Single choice question
   - Click "Beginner" - should auto-advance after 300ms
6. **Verify Question 2 (Interest Areas):**
   - Multiple choice question
   - Select 2-3 options
   - Click "Next" button (no auto-advance for multiple choice)
7. **Verify Question 3 (Learning Goals):**
   - Multiple choice question
   - Select options and click "Next"
8. **Verify Question 4 (Time Commitment):**
   - Single choice question
   - Click any option - should auto-advance
9. **Verify Question 5 (Difficulty Preference):**
   - Single choice question
   - Click any option - should auto-advance and complete onboarding
10. **Verify dashboard shows personalized content** based on your selections

### Skip Flow Testing

1. **Create another new account**
2. **On the first onboarding question:**
   - Look for centered text link at bottom saying "Skip onboarding questions"
   - Click the skip link
3. **Verify redirect to dashboard** with default "beginner" tag assigned

## Expected Behavior

### Single Choice Questions (1, 4, 5)
- Clicking an option highlights it
- After 300ms, automatically advances to next question
- On last question, automatically submits and redirects to dashboard

### Multiple Choice Questions (2, 3)
- Can select multiple options
- Shows checkmarks on selected items
- Requires clicking "Next" button to advance
- Cannot proceed without at least one selection

### Skip Functionality
- Appears as centered text link (not a button)
- Text: "Skip onboarding questions"
- Assigns default "beginner" tag
- Redirects directly to dashboard

### Admin Onboarding Page
- Accessible via "Onboarding" nav item (admin only)
- Shows all questions in order
- Edit mode for each question
- Can modify all aspects of questions and options
- Changes persist after saving

## Database Verification

To verify tags are being assigned correctly:

```sql
-- Check user tags after onboarding
SELECT
  p.email,
  t.name as tag_name,
  t.tag_type,
  ut.created_at
FROM user_tags ut
JOIN profiles p ON p.id = ut.user_id
JOIN tags t ON t.id = ut.tag_id
WHERE p.email LIKE '%@example.com'
ORDER BY p.email, t.tag_type;

-- Check onboarding responses
SELECT
  p.email,
  or.question_id,
  or.answer_value,
  or.created_at
FROM onboarding_responses or
JOIN profiles p ON p.id = or.user_id
WHERE p.email LIKE '%@example.com'
ORDER BY p.email, or.created_at;
```

## Success Criteria

- ✅ Single choice questions auto-advance
- ✅ Skip appears as text link, not button
- ✅ Admin can access and edit onboarding questions
- ✅ Tags are properly assigned based on responses
- ✅ Dashboard shows personalized content
- ✅ Build completes without errors