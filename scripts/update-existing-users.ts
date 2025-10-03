/**
 * Script to add isActive: true to all existing users
 * Run this once to migrate existing users
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore'

// Firebase config from your project
const firebaseConfig = {
  apiKey: "AIzaSyDkiH2j8IiLneTn6ree38hiqPIXRNmrpJA",
  authDomain: "trainlog-ae8e6.firebaseapp.com",
  projectId: "trainlog-ae8e6",
  storageBucket: "trainlog-ae8e6.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function updateExistingUsers() {
  try {
    console.log('🚀 Starting user migration...')
    
    const usersRef = collection(db, 'usuarios')
    const usersSnapshot = await getDocs(usersRef)
    
    console.log(`📊 Found ${usersSnapshot.size} users to update`)
    
    let updated = 0
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data()
      
      // Only update if isActive doesn't exist
      if (userData.isActive === undefined) {
        await updateDoc(doc(db, 'usuarios', userDoc.id), {
          isActive: true
        })
        
        console.log(`✅ Updated user: ${userData.nome || userData.email}`)
        updated++
      } else {
        console.log(`⏭️  Skipped user: ${userData.nome || userData.email} (already has isActive)`)
      }
    }
    
    console.log(`🎉 Migration complete! Updated ${updated} users.`)
    
  } catch (error) {
    console.error('❌ Error updating users:', error)
  }
}

// Run the migration
updateExistingUsers()