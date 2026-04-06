/**
 * seed-emails.mjs
 * Populates the `emailsRegistrados` collection from existing `usuarios` documents.
 * Run once: node scripts/seed-emails.mjs
 *
 * Requires: npm install firebase-admin  (or use the already-installed package)
 * Requires: GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account JSON,
 *            OR run `firebase login` and use the emulator, OR paste your serviceAccount inline.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── Configure ──────────────────────────────────────────────
// Option A: Set GOOGLE_APPLICATION_CREDENTIALS env var before running
// Option B: Replace the path below with your service account JSON path
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  || resolve('./serviceAccount.json')

let app
if (!getApps().length) {
  app = initializeApp({
    credential: cert(JSON.parse(readFileSync(serviceAccountPath, 'utf8'))),
  })
}

const db = getFirestore(app)

async function seed() {
  console.log('🔍 Reading usuarios collection...')
  const snapshot = await db.collection('usuarios').get()

  if (snapshot.empty) {
    console.log('No users found.')
    return
  }

  const batch = db.batch()
  let count = 0

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data()
    const email = data.email?.trim().toLowerCase()
    if (!email) continue

    const emailRef = db.collection('emailsRegistrados').doc(email)
    batch.set(emailRef, { uid: docSnap.id, criadoEm: data.criadoEm || new Date().toISOString() }, { merge: true })
    count++
    console.log(`  ✔ ${email}`)
  }

  await batch.commit()
  console.log(`\n✅ Done! ${count} emails indexed in emailsRegistrados.`)
}

seed().catch((err) => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
