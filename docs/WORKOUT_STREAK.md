# Workout Streak Feature

## Overview
The streak counts **consecutive weeks** (Sunday–Saturday, local time) with at least one completed workout. The number of completed workouts is tracked separately as a statistic.

## Data Structure (in `usuarios` collection)
```typescript
{
  currentStreak: number,          // Current streak, in weeks
  longestStreak: number,          // Best streak ever, in weeks
  lastStreakWeek: string,         // "2026-09-27": Sunday (YYYY-MM-DD) of the last week that counted (trained or covered by a freeze)
  totalWorkouts: number,          // Days with a completed workout (statistic only)
  lastWorkoutDate: string,        // "2026-10-03": prevents counting the same day twice
  freezeCount: number,            // Available freezes
  freezeLastGrantedMonth: string, // "2026-10": last month the monthly freezes were granted
  streakMilestoneRewardedUpTo: number, // Highest milestone (in weeks) already rewarded
  streakVersion: 2,               // 2 = weekly model (users without it are migrated on first sync)
  scheduledDays: number[],        // [1, 3, 5]: only used by the calendar, does not affect the streak
}
```

## Streak Logic (`src/data/streak-utils.ts`)

`syncStreakState()` runs inside a Firestore transaction in two modes:
- `maintenance`: on app start (`checkAndResetStreakIfMissed`, called from `app.tsx`)
- `workout`: when all exercises of the day are completed (`updateStreak`, called from `training.tsx`)

Steps:
1. **Monthly freezes**: on the first sync of a new month, add 1 (free) / 2 (premium), capped at 1 (free) / 2 (premium). Balances above the cap are reduced to it.
2. **Missed weeks**: count the full weeks between `lastStreakWeek` and the current week (the current week never counts as missed). If the streak is active and weeks were missed:
   - Enough freezes: spend 1 per missed week and keep the streak (it does not grow).
   - Not enough: streak goes to 0 and freezes to 0.
3. **Workout** (`workout` mode, once per day):
   - `totalWorkouts += 1`.
   - If it is the first workout of the week: `currentStreak += 1` (or starts at 1) and `lastStreakWeek` = current week.
4. **Milestones**: every 4 weeks of `longestStreak` (4, 8, 12, …). The 1st milestone gives +1 freeze to everyone; the next ones only to premium users, always within the cap.

A `freezeWarning` (modal + OneSignal push) is emitted when the last freeze is used or when the streak is reset.

### Examples
- Trains Mon and Thu of week 1, Sat of week 2 → streak 2, `totalWorkouts` 3.
- Streak 5, skips a whole week, has 1 freeze → freeze spent, streak stays 5; trains the following week → 6.
- Free user, streak 5, skips two whole weeks → needs 2 freezes, has at most 1 → streak 0.

## Migration
`ensureStreakMigrated()` runs before every sync for users without `streakVersion: 2`. It reads the user's `logs` and recalculates:
- `totalWorkouts` = distinct days with logs
- `longestStreak` = longest run of consecutive weeks with logs
- `currentStreak` / `lastStreakWeek` = run ending at the most recent week with logs (the regular freeze rules then apply to any gap until today)
- `streakMilestoneRewardedUpTo` = milestone of the recalculated record (no retroactive rewards)

Badges only show the streak milestone for users with `streakVersion: 2`, so profiles still in days don't show wrong values.

## UI
- **Header**: 🔥 + weeks; flame lit when the user has trained in the current week.
- **Profile**: Sequência, Recorde, Treinos, Freezes, Amigos.
- **Workout complete modal**: animates +1 only on the first workout of the week ("Semana garantida!" otherwise) and shows the workout number.
- **Streak calendar (premium)**: a scheduled day is marked as missed only if its whole week had no workout.
