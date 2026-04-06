/**
 * Badge utility functions for Firestore operations.
 * Use these helpers whenever you need to add/remove badges from a user document.
 */

import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'

/**
 * Adds one or more badge IDs to a user's `badges` array (no duplicates).
 */
export async function addBadgesToUser(userId: string, badgeIds: string[]): Promise<void> {
  const userRef = doc(db, 'usuarios', userId)
  const snap = await getDoc(userRef)
  if (!snap.exists()) return

  const existing: string[] = snap.data().badges || []
  const toAdd = badgeIds.filter(id => !existing.includes(id))
  if (toAdd.length === 0) return

  await updateDoc(userRef, { badges: [...existing, ...toAdd] })
}

/**
 * Removes one or more badge IDs from a user's `badges` array.
 */
export async function removeBadgesFromUser(userId: string, badgeIds: string[]): Promise<void> {
  const userRef = doc(db, 'usuarios', userId)
  const snap = await getDoc(userRef)
  if (!snap.exists()) return

  const existing: string[] = snap.data().badges || []
  const updated = existing.filter(id => !badgeIds.includes(id))
  if (updated.length === existing.length) return // nothing to remove

  await updateDoc(userRef, { badges: updated })
}
