/**
 * Script to automatically bump the lastVersion in the 'sistema' collection
 * on Firebase, using the logged-in admin credentials.
 * Run automatically during pnpm version scripts.
 */

import 'dotenv/config'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const email = process.env.VITE_ADMIN_EMAIL
const password = process.env.VITE_ADMIN_PASSWORD

if (!email || !password) {
  console.warn('⚠️ Warning: VITE_ADMIN_EMAIL or VITE_ADMIN_PASSWORD not set in .env')
  console.warn('The Firebase `sistema/info` document will NOT be updated automatically.')
  console.warn('You can update the version manually in the Firestore dashboard.')
  process.exit(0)
}

const packageJsonPath = path.join(__dirname, '../package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const currentVersion = packageJson.version

// Your Firebase config - using process.env
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

async function updateSystemVersion() {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email as string, password as string)

    const infoRef = doc(db, 'sistema', 'info')
    await setDoc(infoRef, { lastVersion: currentVersion }, { merge: true })
  } catch (error) {
    console.error('❌ Error updating system version:', error)
    process.exit(1)
  }

  process.exit(0)
}

updateSystemVersion()
