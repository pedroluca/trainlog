import { db } from '../firebaseConfig'
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'

const dayNameToNumber: Record<string, number> = {
  'Domingo': 0,
  'Segunda-feira': 1,
  'Terça-feira': 2,
  'Quarta-feira': 3,
  'Quinta-feira': 4,
  'Sexta-feira': 5,
  'Sábado': 6
}

export async function updateScheduledDays(usuarioID: string): Promise<number[]> {
  try {
    const workoutsRef = collection(db, 'treinos')
    const q = query(workoutsRef, where('usuarioID', '==', usuarioID))
    const querySnapshot = await getDocs(q)

    const uniqueDays = new Set<number>()
    
    // Verifica cada treino para ver se ele tem exercícios
    const exerciseChecks = querySnapshot.docs.map(async (workoutDoc) => {
      const exercisesRef = collection(db, 'treinos', workoutDoc.id, 'exercicios')
      const exercisesSnap = await getDocs(exercisesRef)
      
      // Só adiciona o dia na lista de dias de treino se tiver PELA MENOS UM exercício
      if (!exercisesSnap.empty) {
        const dia = workoutDoc.data().dia as string
        const dayNumber = dayNameToNumber[dia]
        if (dayNumber !== undefined) {
          uniqueDays.add(dayNumber)
        }
      }
    })

    // Aguarda todas as checagens subjacentes terminarem
    await Promise.all(exerciseChecks)

    const scheduledDays = Array.from(uniqueDays).sort()

    const userDocRef = doc(db, 'usuarios', usuarioID)
    updateDoc(userDocRef, {
      scheduledDays
    }).catch(console.error)

    return scheduledDays
  } catch (err) {
    console.error('❌ Error updating scheduled days:', err)
    return []
  }
}


export async function checkAndResetStreakIfMissed(usuarioID: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'usuarios', usuarioID)
    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) return

    const userData = userDoc.data()
    const scheduledDays = userData.scheduledDays || []
    const lastCompletedDate = userData.lastCompletedDate
    const currentStreak = userData.currentStreak || 0

    if (scheduledDays.length === 0 || currentStreak === 0) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (!lastCompletedDate) return

    const lastCompleted = new Date(lastCompletedDate)
    lastCompleted.setHours(0, 0, 0, 0)

    if (lastCompleted.toDateString() === today.toDateString()) return

    const checkDate = new Date(lastCompleted)
    checkDate.setDate(checkDate.getDate() + 1) // Start from day after last completed

    let missedScheduledDay = false

    while (checkDate < today) {
      if (scheduledDays.includes(checkDate.getDay())) {
        missedScheduledDay = true
        break
      }
      checkDate.setDate(checkDate.getDate() + 1)
    }

    if (missedScheduledDay) {
      updateDoc(userDocRef, {
        currentStreak: 0
      }).catch(console.error)

      window.dispatchEvent(new CustomEvent('streakUpdated', {
        detail: { newStreak: 0 }
      }))
    }
  } catch (err) {
    console.error('❌ Error checking missed streak:', err)
  }
}

export async function resetPreviousDaysExercises(usuarioID: string): Promise<void> {
  try {
    const today = new Date()
    const todayDayOfWeek = today.getDay()

    const dayNumberToName: Record<number, string> = {
      0: 'Domingo',
      1: 'Segunda-feira',
      2: 'Terça-feira',
      3: 'Quarta-feira',
      4: 'Quinta-feira',
      5: 'Sexta-feira',
      6: 'Sábado'
    }

    const todayName = dayNumberToName[todayDayOfWeek]

    const workoutsRef = collection(db, 'treinos')
    const q = query(workoutsRef, where('usuarioID', '==', usuarioID))
    const querySnapshot = await getDocs(q)

    let resetCount = 0

    for (const docSnap of querySnapshot.docs) {
      const workoutData = docSnap.data()
      const workoutDay = workoutData.dia

      if (workoutDay === todayName) continue

      const exercisesRef = collection(db, 'treinos', docSnap.id, 'exercicios')
      const exercisesSnap = await getDocs(exercisesRef)

      let hasUpdates = false
      const updatePromises: Promise<void>[] = []

      for (const exDoc of exercisesSnap.docs) {
        const exData = exDoc.data()
        if (exData.isFeito === true) {
          hasUpdates = true
          updatePromises.push(updateDoc(exDoc.ref, { isFeito: false }))
        }
      }

      if (hasUpdates) {
        await Promise.all(updatePromises)
        resetCount++
      }
    }
  } catch (err) {
    console.error('❌ Error resetting previous days exercises:', err)
  }
}

export async function updateStreak(usuarioID: string): Promise<number> {
  try {
    const userDocRef = doc(db, 'usuarios', usuarioID)
    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      console.error('❌ User not found')
      return 0
    }

    const userData = userDoc.data()
    const scheduledDays = userData.scheduledDays || []
    const currentStreak = userData.currentStreak || 0
    const longestStreak = userData.longestStreak || 0

    const today = new Date()
    const todayStrCA = today.toLocaleDateString('en-CA') // YYYY-MM-DD local
    const todayStrLocal = today.toDateString() // "Sun Mar 30 2026"
    const lastCompletedDateStr = userData.lastCompletedDate // Local string from previous completions
    const lastWorkoutDateStr = userData.lastWorkoutDate // YYYY-MM-DD

    // Check if we already computed streak today
    if (lastCompletedDateStr === todayStrLocal || lastWorkoutDateStr === todayStrCA) {
      return currentStreak
    }

    let newStreak = 1

    if (lastCompletedDateStr) {
      const lastCompleted = new Date(lastCompletedDateStr)
      lastCompleted.setHours(0, 0, 0, 0)

      const checkDate = new Date(lastCompleted)
      checkDate.setDate(checkDate.getDate() + 1)

      today.setHours(0, 0, 0, 0)
      let missedScheduledDay = false

      while (checkDate < today) {
        if (scheduledDays.includes(checkDate.getDay())) {
          missedScheduledDay = true
          break
        }
        checkDate.setDate(checkDate.getDate() + 1)
      }

      if (!missedScheduledDay) {
        newStreak = currentStreak + 1
      }
    }

    const newLongestStreak = Math.max(longestStreak, newStreak)

    updateDoc(userDocRef, {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastCompletedDate: todayStrLocal,
      lastWorkoutDate: todayStrCA
    }).catch(console.error)

    return newStreak
  } catch (err) {
    console.error('❌ Error updating streak:', err)
    return 0
  }
}

export async function getStreakData(usuarioID: string): Promise<{
  currentStreak: number
  longestStreak: number
  scheduledDays: number[]
}> {
  try {
    const userDocRef = doc(db, 'usuarios', usuarioID)
    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      return { currentStreak: 0, longestStreak: 0, scheduledDays: [] }
    }

    const userData = userDoc.data()
    return {
      currentStreak: userData.currentStreak || 0,
      longestStreak: userData.longestStreak || 0,
      scheduledDays: userData.scheduledDays || []
    }
  } catch (err) {
    console.error('❌ Error getting streak data:', err)
    return { currentStreak: 0, longestStreak: 0, scheduledDays: [] }
  }
}
