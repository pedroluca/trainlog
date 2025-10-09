# Google Analytics 4 Integration - TrainLog

## ✅ What's Included

### Analytics Events Tracked:
- **Authentication**: Login, Sign up, Logout
- **Workouts**: Created, Deleted, Edited, Completed, Shared
- **Exercises**: Added, Completed, Deleted
- **Exercise Library**: Opened, Search, Filters
- **Templates**: Cloned, Viewed
- **Progress**: Page views, Chart interactions
- **Profile**: Views, Photo updates, Metrics updates
- **Premium**: Calendar views, Streak tracking
- **Settings**: Dark mode, Scheduled days
- **PWA**: Installation, Updates
- **Navigation**: Page views
- **Errors**: Error tracking

---

## 🚀 Setup Instructions

### Step 1: Enable Analytics in Firebase Console (REQUIRED!)

⚠️ **IMPORTANT**: Analytics must be enabled in Firebase Console first, or you'll see errors!

**Visual Guide:**

```
Firebase Console → Select Project → Analytics (Left Sidebar)
                                         ↓
                              [Enable Google Analytics]
                                         ↓
                              Choose/Create GA4 Account
                                         ↓
                                Accept Terms
                                         ↓
                            [Enable Analytics] Button
                                         ↓
                          ⏳ Wait 2-5 minutes
                                         ↓
                          ✅ Analytics Active!
```

**Step-by-Step:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your **TrainLog** project
3. Click **Analytics** in the left sidebar
4. If you see "Get Started", click it
5. Click **Enable Google Analytics**
6. Follow the setup wizard:
   - Choose existing Google Analytics account or create new
   - Accept terms and conditions
   - Click **Enable Analytics**
7. **Wait 2-5 minutes** for Analytics to activate

**Without this step**, you'll see this error:
```
Analytics: Dynamic config fetch failed: [400] Request contains an invalid argument
```

But don't worry - the app still works! Analytics will just log to console only.

### Step 2: Verify Configuration

After enabling, Firebase automatically adds:
- GA4 measurement ID to your project
- Analytics configured in Firebase SDK
- No additional config needed in code! ✅

### Step 3: Test Analytics

1. Run your app locally:
   ```bash
   pnpm dev
   ```

2. Open browser console and check for:
   ```
   📊 Google Analytics initialized
   ```

3. Navigate around the app and check for events:
   ```
   📊 Analytics event: page_view { page_name: 'login' }
   📊 Analytics event: login { method: 'email' }
   📊 Analytics event: workout_completed { day: 'Segunda-feira', exercise_count: 5 }
   ```

4. View events in Firebase Console:
   - Go to Analytics → Events
   - Should see events appear within 24 hours
   - Real-time events visible in DebugView

---

## 🔍 Viewing Analytics Data

### Firebase Console

#### Real-time Data (DebugView)
1. Go to Firebase Console → Analytics → DebugView
2. Enable debug mode in your browser:
   ```javascript
   // In browser console
   localStorage.setItem('debug_mode', 'true')
   ```
3. Navigate around your app
4. See events appear in real-time!

#### Historical Data
1. Go to Firebase Console → Analytics → Dashboard
2. View:
   - Active users (daily/weekly/monthly)
   - Events breakdown
   - User retention
   - Conversion funnels

### Google Analytics 4 Property

1. Go to [analytics.google.com](https://analytics.google.com/)
2. Select your TrainLog property
3. Advanced reports:
   - User demographics
   - Device breakdown
   - Traffic sources
   - Event parameters
   - Custom reports

---

## 📊 Key Metrics to Monitor

### User Engagement
- **Active Users**: Daily/Weekly/Monthly active users
- **Sessions**: Number of app sessions
- **Session Duration**: Average time spent in app
- **Events per Session**: User engagement level

### Feature Usage
- **Most Used Features**: Which pages/features are popular
- **Workout Completion Rate**: % of started workouts that are completed
- **Exercise Library Usage**: How often users browse exercises
- **Template Adoption**: Which templates are most cloned

### Retention
- **Day 1 Retention**: % of users who return next day
- **Week 1 Retention**: % of users who return after 7 days
- **Churn Rate**: % of users who stop using app

### Conversion (if using monetization)
- **Free to Premium**: Conversion rate
- **Premium Feature Usage**: How premium users use exclusive features
- **Revenue metrics**: If implementing payments

---

## 🎯 Custom Events Reference

### Authentication Events
```typescript
// User logs in
trackLogin('email' | 'google')

// User signs up
trackSignUp('email' | 'google')

// User logs out
trackLogout()
```

### Workout Events
```typescript
// User creates new workout
trackWorkoutCreated('Segunda-feira')

// User deletes workout
trackWorkoutDeleted()

// User edits workout
trackWorkoutEdited()

// User completes all exercises
trackWorkoutCompleted('Segunda-feira', 5) // day, exercise count

// User shares workout
trackWorkoutShared()
```

### Exercise Events
```typescript
// User adds exercise to workout
trackExerciseAdded('Supino Reto')

// User completes an exercise
trackExerciseCompleted('Supino Reto')

// User deletes exercise
trackExerciseDeleted()
```

### Library Events
```typescript
// User opens exercise library
trackExerciseLibraryOpened()

// User searches in library
trackExerciseLibrarySearch('peito')

// User filters library
trackExerciseLibraryFilter('muscle_group', 'Peito')
```

### Navigation Events
```typescript
// Track page views
trackPageView('training')
trackPageView('progress')
trackPageView('profile')
```

---

## 🛠️ Adding Analytics to New Features

When adding new features, follow this pattern:

### 1. Import the analytics helper
```typescript
import { logEvent } from '../firebaseConfig'
// or use specific helper
import { trackFeatureUsed } from '../utils/analytics'
```

### 2. Add event to user action
```typescript
const handleButtonClick = () => {
  // Your feature logic
  doSomething()
  
  // Track the event
  logEvent('button_clicked', { 
    button_name: 'save_workout',
    screen: 'training'
  })
}
```

### 3. Add page view tracking
```typescript
useEffect(() => {
  trackPageView('my_new_page')
}, [])
```

### 4. Create helper function (optional)
```typescript
// In src/utils/analytics.ts
export const trackNewFeature = (param: string) => {
  logEvent('new_feature_used', { feature_param: param })
}
```

---

## 🔒 Privacy & GDPR Compliance

### Automatic Anonymization
Firebase Analytics automatically:
- ✅ Anonymizes IP addresses
- ✅ Doesn't track personally identifiable information (PII)
- ✅ Complies with GDPR by default

### User Consent (if required)
If you need explicit consent:

```typescript
// Add to your consent flow
const handleConsentAccepted = () => {
  localStorage.setItem('analytics_consent', 'granted')
  // Initialize analytics here
}

const handleConsentDenied = () => {
  localStorage.setItem('analytics_consent', 'denied')
  // Don't initialize analytics
}
```

### What NOT to Track
❌ Don't track:
- User email addresses
- User names
- Phone numbers
- Credit card info
- Any PII (Personally Identifiable Information)

✅ OK to track:
- User IDs (Firebase UID)
- Anonymous usage patterns
- Feature interactions
- Performance metrics

---

## 📈 Advanced Analytics

### Custom Dimensions (Future)
Track additional user properties:
```typescript
import { setUserProperties } from 'firebase/analytics'

setUserProperties(analytics, {
  user_type: 'premium',
  workout_frequency: 'daily',
  preferred_muscle_group: 'chest'
})
```

### Conversion Tracking (for Premium)
```typescript
// Track when user converts to premium
logEvent('purchase', {
  currency: 'BRL',
  value: 49.90,
  items: [{
    item_name: 'Premium Lifetime'
  }]
})
```

### Screen Time Tracking
```typescript
// Measure how long users spend on each screen
const startTime = Date.now()

useEffect(() => {
  return () => {
    const duration = Date.now() - startTime
    logEvent('screen_time', {
      screen_name: 'training',
      duration_seconds: Math.round(duration / 1000)
    })
  }
}, [])
```

---

## 🐛 Troubleshooting

### "Dynamic config fetch failed: [400]"
**Error Message**: 
```
Analytics: Dynamic config fetch failed: [400] Request contains an invalid argument
```

**Problem**: Analytics is not enabled in Firebase Console

**Solution**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Analytics** in left sidebar
4. Click **Enable Google Analytics**
5. Complete the setup wizard
6. Wait 2-5 minutes for activation
7. Refresh your app

**Temporary Workaround**: 
The app will still work! Analytics events will be logged to console only until you enable it.

### "Analytics not initialized"
**Problem**: Console shows no analytics initialization message

**Solutions**:
1. Check Firebase Console → Analytics is enabled
2. Verify `appId` in firebaseConfig includes measurement ID
3. Check browser console for errors
4. Try incognito mode (extensions can block analytics)

### "No events showing in Firebase"
**Problem**: Events not appearing in Firebase Console

**Solutions**:
1. Wait 24 hours (non-debug events take time to process)
2. Use DebugView for real-time testing
3. Enable debug mode: `localStorage.setItem('debug_mode', 'true')`
4. Check browser network tab for blocked requests
5. Verify ad blockers aren't blocking Firebase

### "Events showing in console but not GA4"
**Problem**: Console logs events but GA4 doesn't show them

**Solutions**:
1. Verify GA4 property is linked in Firebase
2. Check data retention settings (default: 2 months)
3. Wait longer (data processing delay)
4. Check GA4 property ID matches Firebase

---

## 📊 Recommended Dashboard

Create a custom dashboard in GA4 with:

### Key Metrics Cards
- Total Users (last 7 days)
- Active Users (last 24 hours)
- Workouts Completed (last 7 days)
- Average Session Duration

### Charts
1. **User Growth Over Time** (line chart)
2. **Top Pages** (bar chart)
3. **Feature Usage** (pie chart)
4. **Workout Completion Rate** (line chart)
5. **Device Breakdown** (pie chart)

### Funnels
1. **Onboarding Funnel**:
   - Sign up → First workout → First completion
2. **Premium Funnel** (if applicable):
   - Free user → Premium view → Premium purchase

---

## 🎓 Learning Resources

- [Firebase Analytics Docs](https://firebase.google.com/docs/analytics)
- [GA4 Beginner's Guide](https://support.google.com/analytics/answer/9304153)
- [Event Parameters Reference](https://support.google.com/analytics/answer/9267735)
- [Firebase Analytics Best Practices](https://firebase.google.com/docs/analytics/best-practices)

---

## ✅ Current Implementation Status

**Implemented:**
- ✅ Firebase Analytics SDK integrated
- ✅ Helper functions created (`src/utils/analytics.ts`)
- ✅ Login/logout tracking
- ✅ Page view tracking (login, training)
- ✅ Workout completion tracking
- ✅ Console logging for debugging

**To Implement:**
- ⏳ Exercise library tracking
- ⏳ Template cloning tracking
- ⏳ Profile events tracking
- ⏳ Settings changes tracking
- ⏳ Error tracking
- ⏳ PWA events tracking

---

## 🚀 Next Steps

1. **Enable Analytics in Firebase Console** (5 minutes)
2. **Test locally** - Check console logs (5 minutes)
3. **Enable DebugView** - See real-time events (5 minutes)
4. **Deploy to production** - Start collecting real data
5. **Monitor for 1 week** - Gather baseline metrics
6. **Create custom dashboard** - Visualize key metrics (30 minutes)
7. **Add remaining event tracking** - Gradually add more events

---

## 💡 Pro Tips

1. **Start Simple**: Don't track everything at once. Start with key events.
2. **Use DebugView**: Essential for testing before production.
3. **Console Logs**: Keep them for debugging (we already have them!).
4. **Event Naming**: Use consistent naming convention (lowercase, underscores).
5. **Parameter Names**: Also consistent (we follow GA4 recommended events).
6. **Check Regularly**: Review analytics weekly to spot trends.
7. **A/B Testing**: Use events to measure feature impact.

---

**Analytics is now ready to use! Just enable it in Firebase Console and you're good to go! 📊🎉**
