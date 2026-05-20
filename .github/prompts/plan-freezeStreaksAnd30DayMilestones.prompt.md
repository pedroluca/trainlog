## Plan: Freeze Streaks and 30-Day Milestones

Implement a serverless/client-side freeze system on top of the current streak engine so users can miss a scheduled workout day without losing the streak immediately. Free users will receive 1 freeze per calendar month, premium users 2, with accumulation caps of 2 and 4 respectively. In parallel, add a dynamic 30-day milestone badge that updates to 30/60/90/etc and awards extra freezes according to the agreed premium rule.

**Steps**
1. Extend the streak data model in `src/data/streak-utils.ts` with freeze state and milestone state, then add helper functions that can be reused from both app startup and workout completion.
2. Add a monthly entitlement helper that credits freezes on the first time the user crosses into a new calendar month, without exceeding the tier cap, and persist the month already credited so the same month is never granted twice.
3. Change streak validation so a missed scheduled day consumes 1 freeze automatically if one is available; only when no freeze remains should the streak reset to zero. Ensure this runs from the same places that currently call `checkAndResetStreakIfMissed()` and `updateStreak()`.
4. Add milestone tracking for streak multiples of 30. Store the highest 30-day milestone achieved by the user and award a dynamic badge state that renders as 30/60/90/etc instead of a fixed static badge entry.
5. Update the badge catalog and badge rendering path so the streak milestone appears in profile and friend views with the current numeric milestone, while preserving existing founder/premium/trainer badges.
6. Wire freeze rewards into the milestone flow: all users receive 1 extra freeze at the first 30-day milestone, and premium users receive the extra freeze on the second milestone and every subsequent multiple of 30, subject to the same cap logic.
7. Add any user-document fields needed for migration-safe behavior and make the helpers tolerate older profiles with missing streak-freeze fields.
8. Validate the change at the current integration points: app startup streak checks, training completion path, profile badge display, and any pages that surface streak state or freeze counts.

**Relevant files**
- `c:/Users/pedro/www/personal-projects/trainlog/src/data/streak-utils.ts` — central streak engine; add freeze crediting, consumption, and milestone helpers here.
- `c:/Users/pedro/www/personal-projects/trainlog/src/app.tsx` — current startup path that already calls streak maintenance.
- `c:/Users/pedro/www/personal-projects/trainlog/src/pages/training.tsx` — workout completion path where streak increments happen.
- `c:/Users/pedro/www/personal-projects/trainlog/src/data/badges.ts` — badge definitions; add or adapt the streak milestone entry.
- `c:/Users/pedro/www/personal-projects/trainlog/src/components/badge-chip.tsx` — badge UI, especially if the milestone badge needs a dynamic numeric label.
- `c:/Users/pedro/www/personal-projects/trainlog/src/pages/profile.tsx` — main badge display surface.
- `c:/Users/pedro/www/personal-projects/trainlog/src/pages/friend-profile.tsx` — friend profile badge display surface.
- `c:/Users/pedro/www/personal-projects/trainlog/src/pages/streak-calendar.tsx` — likely place to expose freeze balance and milestone status to users.
- `c:/Users/pedro/www/personal-projects/trainlog/src/utils/badge-utils.ts` — reuse existing badge add/remove helpers if the milestone is stored in the badge array.

**Verification**
1. Run the focused type/error check on the touched files after implementing the helpers and UI changes.
2. Verify that app startup still runs the streak maintenance path without resetting premium/free profiles incorrectly at month boundaries.
3. Test at least three cases conceptually or with seeded data: free user with 0, 1, and 2 freezes; premium user with 3 and 4 freezes; milestone awards at 30 and 60 days.
4. Confirm the milestone badge renders as the latest multiple of 30 in profile and friend profile, and that older milestone values are not duplicated unless intended.

**Decisions**
- Freeze crediting is calendar-month based and is granted automatically on the first relevant app/streak operation after the month changes.
- Consumption is automatic on missed scheduled day detection; users do not manually activate freezes.
- The milestone badge is dynamic and should show the latest multiple of 30 reached, not a separate static badge per milestone.
- Premium extra freeze behavior follows the agreed rule: everyone gets the first 30-day reward, and only premium gets the extra freeze from the second milestone onward.

**Further Considerations**
1. Should the UI show the current freeze balance on the streak calendar/profile, or do you want this hidden until the first release of the feature? R: YES
2. If a user misses multiple scheduled days in the same month, should the system burn multiple freezes in one check as long as the balance exists, or only one per failed day detection cycle? R: Multiple, as long as the balance exists, to prevent users from losing streaks due to multiple missed days in a row without opening the app. Show a warning if the balance is about to run out. (notification OneSignal) and in-app popup modal to tell the user they have used their last freeze and the next miss will reset the streak.