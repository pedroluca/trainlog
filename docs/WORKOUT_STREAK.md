# Workout Streak Feature

## Overview
Tracks user's workout completion streaks based on their scheduled training days.

## Implementation

### 1. Data Structure (in `usuarios` collection)
```typescript
{
  scheduledDays: number[],      // [1, 3, 5] = Monday, Wednesday, Friday
  currentStreak: number,         // Current streak count
  longestStreak: number,         // Best streak ever achieved
  lastCompletedDate: string,     // "2025-10-08" (ISO date string)
}
```

### 2. Files Created/Modified

#### New Files:
- `src/data/streak-utils.ts` - Core streak logic functions

#### Modified Files:
- `src/components/header.tsx` - Added streak display (🔥 icon + number)
- `src/pages/training.tsx` - Call `updateStreak()` when all exercises completed
- `src/pages/profile.tsx` - Call `updateScheduledDays()` on load, display streak stats

### 3. Streak Logic

#### Auto-detect Scheduled Days:
- On profile load, extract unique `dia` values from user's workouts
- Map Portuguese day names to numbers (0=Sunday, 6=Saturday)
- Store in `scheduledDays` array
- Updates automatically when user adds/removes workouts

#### Streak Calculation:
1. User completes all exercises of the day
2. Check if today is a scheduled workout day
3. Check if previous scheduled day was completed
4. **If previous day was completed** → Increment streak
5. **If previous day was missed** → Reset to 1 (today becomes new first day)
6. Update `currentStreak` and `longestStreak`
7. Store `lastCompletedDate` to prevent double counting

#### Example Scenarios:

**Scenario 1: Maintaining Streak**
- User trains Mon/Wed/Fri
- Completed Monday → Streak = 1
- Completed Wednesday → Streak = 2 (previous day completed)
- Completed Friday → Streak = 3 (previous day completed)

**Scenario 2: Missing a Day**
- User trains Mon/Wed/Fri
- Completed Monday → Streak = 1
- **Missed Wednesday**
- Completed Friday → Streak = 1 (reset because Wednesday was missed)

**Scenario 3: Rest Days Don't Break Streak**
- User trains Mon/Wed/Fri
- Completed Monday → Streak = 1
- Tuesday is rest day (not scheduled) → Streak stays 1
- Completed Wednesday → Streak = 2 (previous **scheduled** day was completed)

### 4. UI/UX

#### Header:
- **Left**: TrainLog title (clickable logo)
- **Right**: 🔥 Streak counter (links to profile)
- Visible on all main pages

#### Profile Page:
- **Workout Streak Section**:
  - Current streak (🔥 + number in orange)
  - Longest streak (personal record)
  - Motivational message

#### Training Page:
- Streak updates automatically when all exercises completed
- Console logs show streak changes

### 5. Functions

#### `updateScheduledDays(usuarioID: string)`
- Fetches all user's workouts
- Extracts unique day names
- Converts to numbers (0-6)
- Updates user document with `scheduledDays` array
- Called on profile load and after workout add/delete

#### `updateStreak(usuarioID: string)`
- Called when all exercises are completed
- Checks if today is scheduled day
- Checks if previous scheduled day was completed
- Updates `currentStreak`, `longestStreak`, `lastCompletedDate`
- Returns new streak value
- Prevents double counting (same day)

#### `getStreakData(usuarioID: string)`
- Fetches user's current streak data
- Returns: `{ currentStreak, longestStreak, scheduledDays }`
- Used by header component

#### `getPreviousScheduledDay(currentDate: Date, scheduledDays: number[])`
- Helper function to find previous scheduled workout day
- Goes back up to 7 days
- Returns Date object or null

#### `wasWorkoutCompletedOnDate(usuarioID: string, date: Date)`
- Checks if user has logs for a specific date
- Returns boolean
- Used to verify if previous day was completed

### 6. Future Enhancements (Premium Feature Ideas)

1. **Calendar Heatmap** (GitHub-style)
   - Create `workoutCompletions` collection
   - Store every completion with date/workout
   - Display visual calendar with colored squares
   - Show completion rates, best month, etc.

2. **Streak Notifications**
   - "You're on fire! 🔥 7 day streak"
   - "Don't break your streak! Train today"
   - Push notifications for scheduled days

3. **Achievements/Badges**
   - "🔥 First Streak" (reach 3 days)
   - "💪 Week Warrior" (7 day streak)
   - "🏆 Month Master" (30 day streak)
   - "👑 Legend" (100 day streak)

4. **Social Features**
   - Compare streaks with friends
   - Leaderboards
   - Share streak milestones

5. **Streak Recovery**
   - "Freeze" option (1 per month for premium)
   - Allows missing 1 day without breaking streak

### 7. Testing Checklist

- [ ] Streak increases when completing scheduled day after completing previous day
- [ ] Streak resets to 1 when missing a scheduled day
- [ ] Rest days don't affect streak
- [ ] Can't double count same day completion
- [ ] Scheduled days auto-update when adding/removing workouts
- [ ] Streak displays correctly in header
- [ ] Streak displays correctly in profile
- [ ] Longest streak updates when current exceeds it
- [ ] Works with different training schedules (2x, 3x, 5x per week)

### 8. Database Migration

No migration needed! New fields will be created automatically:
- `scheduledDays` defaults to empty array []
- `currentStreak` defaults to 0
- `longestStreak` defaults to 0
- `lastCompletedDate` defaults to undefined

When user loads profile → `updateScheduledDays()` will populate `scheduledDays`
When user completes workout → `updateStreak()` will initialize streak fields

### 9. Firestore Security

No changes needed to `firestore.rules`:
- New fields are in `usuarios` collection
- Existing rules already allow user to read/write their own document
- Admin can read/write all user documents

## Implementation Status

✅ Core streak logic implemented
✅ Auto-detect scheduled days
✅ Streak calculation with previous day check
✅ Header streak display
✅ Profile streak stats display
✅ Integration with workout completion
✅ Proper reset logic (missed day = reset to 1)

## Next Steps

1. Deploy to production
2. Test with real user workflows
3. Gather feedback
4. Consider implementing premium calendar feature
5. Add streak celebrations/animations
