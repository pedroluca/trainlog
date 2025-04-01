import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDkiH2j8IiLneTn6ree38hiqPIXRNmrpJA',
  authDomain: 'trainlog-ae8e6.firebaseapp.com',
  projectId: 'trainlog-ae8e6',
  storageBucket: 'trainlog-ae8e6.appspot.com',
  messagingSenderId: 'SENDER_ID',
  appId: 'APP_ID'
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
