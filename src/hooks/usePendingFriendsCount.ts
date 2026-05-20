import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebaseConfig'

export function usePendingFriendsCount(): number {
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const currentUserId = localStorage.getItem('usuarioId')
    if (!currentUserId) return

    const q = query(
      collection(db, 'amizades'),
      where('receptorID', '==', currentUserId),
      where('status', '==', 'pendente')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.size)
    })

    return () => unsubscribe()
  }, [])

  return pendingCount
}
