import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics, logEvent as firebaseLogEvent, isSupported, Analytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Initialize Analytics (only in browser environment)
let analytics: Analytics | null = null
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app)
        console.log('📊 Google Analytics initialized successfully')
      } catch (error) {
        console.warn('⚠️ Google Analytics not available:', error)
        console.warn('💡 To enable Analytics: Go to Firebase Console → Analytics → Enable')
      }
    } else {
      console.warn('⚠️ Google Analytics not supported in this environment')
    }
  }).catch((error) => {
    console.warn('⚠️ Failed to check Analytics support:', error)
  })
}

// Helper function to safely log events
export const logEvent = (eventName: string, eventParams?: Record<string, string | number | boolean>) => {
  if (analytics) {
    try {
      firebaseLogEvent(analytics, eventName, eventParams)
      console.log(`📊 Analytics event: ${eventName}`, eventParams)
    } catch (error) {
      console.error('❌ Failed to log analytics event:', error)
    }
  } else {
    // Analytics not available - events will be logged to console only
    console.log(`📊 Analytics event (not tracked): ${eventName}`, eventParams)
  }
}

// Secondary app for admin operations (creating users without affecting current auth)
export const secondaryApp = initializeApp(firebaseConfig, 'Secondary')
export const secondaryAuth = getAuth(secondaryApp)