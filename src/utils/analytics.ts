import { logEvent } from '../firebaseConfig'

/**
 * Analytics Events for TrainLog
 * Track user behavior and feature usage
 */

// Authentication Events
export const trackLogin = (method: 'email' | 'google') => {
  logEvent('login', { method })
}

export const trackSignUp = (method: 'email' | 'google') => {
  logEvent('sign_up', { method })
}

export const trackLogout = () => {
  logEvent('logout')
}

// Workout Events
export const trackWorkoutCreated = (workoutDay: string) => {
  logEvent('workout_created', { day: workoutDay })
}

export const trackWorkoutDeleted = () => {
  logEvent('workout_deleted')
}

export const trackWorkoutEdited = () => {
  logEvent('workout_edited')
}

export const trackWorkoutCompleted = (workoutDay: string, exerciseCount: number) => {
  logEvent('workout_completed', { 
    day: workoutDay,
    exercise_count: exerciseCount 
  })
}

export const trackWorkoutShared = () => {
  logEvent('workout_shared')
}

// Exercise Events
export const trackExerciseAdded = (exerciseTitle: string) => {
  logEvent('exercise_added', { exercise: exerciseTitle })
}

export const trackExerciseCompleted = (exerciseTitle: string) => {
  logEvent('exercise_completed', { exercise: exerciseTitle })
}

export const trackExerciseDeleted = () => {
  logEvent('exercise_deleted')
}

// Library Events
export const trackExerciseLibraryOpened = () => {
  logEvent('exercise_library_opened')
}

export const trackExerciseLibrarySearch = (searchTerm: string) => {
  logEvent('search', { search_term: searchTerm })
}

export const trackExerciseLibraryFilter = (filterType: string, filterValue: string) => {
  logEvent('exercise_library_filter', { 
    filter_type: filterType,
    filter_value: filterValue 
  })
}

// Template Events
export const trackTemplateCloned = (templateName: string) => {
  logEvent('template_cloned', { template_name: templateName })
}

export const trackTemplateViewed = (templateName: string) => {
  logEvent('template_viewed', { template_name: templateName })
}

// Progress Events
export const trackProgressViewed = () => {
  logEvent('page_view', { page_name: 'progress' })
}

export const trackChartInteraction = (chartType: string) => {
  logEvent('chart_interaction', { chart_type: chartType })
}

// Profile Events
export const trackProfileViewed = () => {
  logEvent('page_view', { page_name: 'profile' })
}

export const trackProfilePhotoUpdated = () => {
  logEvent('profile_photo_updated')
}

export const trackMetricsUpdated = (weight: number, height: number) => {
  logEvent('metrics_updated', { 
    weight_kg: weight,
    height_cm: height 
  })
}

// Premium Events
export const trackPremiumCalendarViewed = () => {
  logEvent('page_view', { page_name: 'premium_calendar' })
}

export const trackStreakCalendarViewed = () => {
  logEvent('streak_calendar_viewed')
}

export const trackPremiumUpgradeModalOpened = () => {
  logEvent('premium_upgrade_modal_opened')
}

export const trackPremiumUpgradeRequested = () => {
  logEvent('premium_upgrade_requested')
}

export const trackPremiumUpgradeApproved = (userId: string) => {
  logEvent('premium_upgrade_approved', { user_id: userId })
}

export const trackPremiumUpgradeRejected = (userId: string) => {
  logEvent('premium_upgrade_rejected', { user_id: userId })
}

// Settings Events
export const trackDarkModeToggled = (enabled: boolean) => {
  logEvent('dark_mode_toggled', { enabled: enabled ? 1 : 0 })
}

export const trackScheduledDaysChanged = (daysCount: number) => {
  logEvent('scheduled_days_changed', { days_count: daysCount })
}

// PWA Events
export const trackPWAInstalled = () => {
  logEvent('pwa_installed')
}

export const trackPWAUpdateAccepted = (updateType: string) => {
  logEvent('pwa_update_accepted', { update_type: updateType })
}

export const trackPWAUpdateDismissed = (updateType: string) => {
  logEvent('pwa_update_dismissed', { update_type: updateType })
}

// Navigation Events
export const trackPageView = (pageName: string) => {
  logEvent('page_view', { page_name: pageName })
}

// Error Events
export const trackError = (errorType: string, errorMessage: string) => {
  logEvent('error', { 
    error_type: errorType,
    error_message: errorMessage 
  })
}

// Feature Usage
export const trackFeatureUsed = (featureName: string) => {
  logEvent('feature_used', { feature_name: featureName })
}
