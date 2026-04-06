/**
 * Script to add isActive: true to all existing users
 * Run this once to migrate existing users
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function updateExistingUsers() {
  try {
    const usersRef = collection(db, 'usuarios')
    const usersSnapshot = await getDocs(usersRef)

    let updated = 0

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data()

      if (userData.isActive === undefined) {
        await updateDoc(doc(db, 'usuarios', userDoc.id), {
          isActive: true
        })

        updated++
      }
    }

  } catch (error) {
    console.error('❌ Error updating users:', error)
  }
}

updateExistingUsers()