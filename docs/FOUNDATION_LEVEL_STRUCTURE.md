# Foundation Level Structure

## Overview

The Foundation level now has **5 hacks** with a clear progression system using prerequisites. This provides a better onboarding experience and demonstrates the prerequisite feature.

## Hack Progression

```
1. Morning Sunlight Exposure (Position 0)
   ├── No prerequisites ✅ UNLOCKED
   ├── 4 checklist items (3 required, 1 optional)
   └── Must complete to unlock: Box Breathing

2. Box Breathing (Position 1)
   ├── Requires: Morning Sunlight Exposure 🔒
   ├── 4 checklist items (3 required, 1 optional)
   └── Must complete to unlock: Pomodoro + Cold Shower

3. Pomodoro Technique (Position 2)
   ├── Requires: Box Breathing 🔒
   ├── 4 checklist items (3 required, 1 optional)
   └── Part of requirements for: Power Pose

4. Cold Shower Finish (Position 3)
   ├── Requires: Box Breathing 🔒
   ├── 4 checklist items (3 required, 1 optional)
   └── Part of requirements for: Power Pose

5. Power Pose (Position 4)
   ├── Requires: Pomodoro Technique AND Cold Shower Finish 🔒
   └── 4 checklist items (3 required, 1 optional)
```

## Prerequisite Logic

### Single Prerequisites
- **Box Breathing** → Requires completion of Morning Sunlight Exposure
- **Pomodoro Technique** → Requires completion of Box Breathing
- **Cold Shower Finish** → Requires completion of Box Breathing

### Multiple Prerequisites (AND logic)
- **Power Pose** → Requires completion of BOTH:
  - Pomodoro Technique
  - Cold Shower Finish

## User Experience Flow

### New User (Anonymous or Registered)
1. **Start**: Only "Morning Sunlight Exposure" is unlocked
2. All other hacks show as locked with lock icons
3. Must complete checklist items before marking hack as complete
4. Cannot mark hack complete until all required checks are done

### After Completing Morning Sunlight
1. "Box Breathing" unlocks automatically
2. User can now work on this hack
3. Other hacks remain locked

### After Completing Box Breathing
1. **Both** "Pomodoro Technique" and "Cold Shower Finish" unlock
2. User can choose which one to do first
3. "Power Pose" remains locked (needs both)

### After Completing Both Pomodoro and Cold Shower
1. "Power Pose" unlocks (final hack)
2. User can complete the Foundation level

## Checklist Details

### Morning Sunlight Exposure (4 items)
- ✅ Watch the full video (Required)
- ✅ Set a morning alarm (Required)
- ✅ Go outside within 30-60 minutes of waking (Required)
- ⭕ Track your results for 3 days (Optional)

### Box Breathing (4 items)
- ✅ Find a quiet space (Required)
- ✅ Practice the technique (Required)
- ✅ Note how you feel (Required)
- ⭕ Set a daily reminder (Optional)

### Pomodoro Technique (4 items)
- ✅ Choose your task (Required)
- ✅ Set a 25-minute timer (Required)
- ✅ Work with full focus (Required)
- ⭕ Take your break (Optional)

### Cold Shower Finish (4 items)
- ✅ Read safety guidelines (Required)
- ✅ Start with lukewarm (Required)
- ✅ End with 30 seconds cold (Required)
- ⭕ Track your tolerance (Optional)

### Power Pose (4 items)
- ✅ Understand the science (Required)
- ✅ Try the Superman pose (Required)
- ✅ Use before a challenge (Required)
- ⭕ Notice the difference (Optional)

## Testing Scenarios

### Test 1: Anonymous User Progression
1. Open `/levels/foundation` without signing in
2. See only "Morning Sunlight Exposure" unlocked
3. Click on it, check some checklist items (saved to localStorage)
4. Try other hacks - they should be locked
5. Complete all required checks in Morning Sunlight
6. Mark it as complete
7. "Box Breathing" should unlock
8. Your checklist progress should persist in localStorage

### Test 2: Progress Migration
1. As anonymous user, complete "Morning Sunlight Exposure"
2. Start working on "Box Breathing" (now unlocked)
3. Check a few items in Box Breathing checklist
4. Sign in with `user@test.com` / `test123`
5. Migration happens automatically
6. Verify:
   - Morning Sunlight still shows as completed
   - Box Breathing is still unlocked
   - Your checklist progress is preserved
   - localStorage is cleared

### Test 3: Multiple Prerequisites
1. Complete "Morning Sunlight Exposure"
2. Complete "Box Breathing"
3. Both "Pomodoro" and "Cold Shower" should unlock
4. Complete only "Pomodoro"
5. "Power Pose" should still be locked
6. Complete "Cold Shower"
7. "Power Pose" should now unlock

### Test 4: Cannot Skip Prerequisites
1. Try to access a locked hack directly via URL
2. It should still show as locked
3. Cannot mark it as complete even if you complete checklist items

## Database Structure

### Tables Used
- `hacks` - The 5 hack records
- `hack_checks` - 20 checklist items (4 per hack)
- `hack_prerequisites` - 5 prerequisite relationships
- `user_hacks` - Tracks completion status
- `user_hack_checks` - Tracks checklist progress
- `user_levels` - Tracks level progress

### Key Queries

**Check if hack is unlocked:**
```sql
SELECT is_hack_unlocked(hack_id, user_id);
```

**Get user's progress:**
```sql
SELECT * FROM get_user_level_tree(user_id);
```

**Check if all required checks are complete:**
```sql
SELECT can_complete_hack(hack_id, user_id);
```

## Migration File

The structure is defined in:
- `supabase/migrations/20251019200000_foundation_level_structure.sql`

This migration:
1. Deletes all hacks except the 5 Foundation hacks
2. Sets proper positions (0-4)
3. Assigns all to Foundation level
4. Creates prerequisite relationships
5. Ensures all hacks have complete checklists

## Benefits of This Structure

1. **Progressive Learning**: Users start simple and build up
2. **Clear Path**: Obvious progression through the level
3. **Choice**: After Box Breathing, users can choose between Pomodoro or Cold Shower
4. **Gating**: Power Pose requires mastery of multiple skills
5. **Demonstrates Prerequisites**: Good for testing the prerequisite system
6. **Manageable Scope**: 5 hacks is enough to learn without being overwhelming
7. **Complete Checklists**: Every hack has 4 items for consistent UX

## Future Enhancements

- Add more levels (Direction, Movement, etc.)
- Create different prerequisite patterns
- Add difficulty progression
- Implement time-based unlocks
- Add achievements for completion streaks
