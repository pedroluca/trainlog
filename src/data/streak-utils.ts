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
    querySnapshot.docs.forEach((doc) => {
      const dia = doc.data().dia as string
      const dayNumber = dayNameToNumber[dia]
      if (dayNumber !== undefined) {
        uniqueDays.add(dayNumber)
      }
    })
    
    const scheduledDays = Array.from(uniqueDays).sort()
    
    const userDocRef = doc(db, 'usuarios', usuarioID)
    await updateDoc(userDocRef, {
      scheduledDays
    })
    
    return scheduledDays
  } catch (err) {
    console.error('❌ Error updating scheduled days:', err)
    return []
  }
}

function getPreviousScheduledDay(currentDate: Date, scheduledDays: number[]): Date | null {
  if (scheduledDays.length === 0) return null
  
  let daysToSubtract = 1
  
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(currentDate)
    checkDate.setDate(checkDate.getDate() - daysToSubtract)
    const checkDay = checkDate.getDay()
    
    if (scheduledDays.includes(checkDay)) {
      return checkDate
    }
    daysToSubtract++
  }
  
  return null
}

async function wasWorkoutCompletedOnDate(usuarioID: string, date: Date): Promise<boolean> {
  try {
    const targetDateStr = date.toDateString() // "Wed Oct 09 2025"
    
    const logsRef = collection(db, 'logs')
    const q = query(logsRef, where('usuarioID', '==', usuarioID))
    const querySnapshot = await getDocs(q)
    
    for (const docSnap of querySnapshot.docs) {
      const logData = docSnap.data()
      if (logData.data) {
        let logDate: Date
        
        if (typeof logData.data === 'string') {
          logDate = new Date(logData.data)
        } else if (logData.data.seconds) {
          logDate = new Date(logData.data.seconds * 1000)
        } else {
          continue // Skip invalid data
        }
        
        if (logDate.toDateString() === targetDateStr) {
          return true
        }
      }
    }
    
    return false
  } catch (err) {
    console.error('❌ Error checking workout completion:', err)
    return false
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
      const checkDayOfWeek = checkDate.getDay()
      
      if (scheduledDays.includes(checkDayOfWeek)) {
        const wasCompleted = await wasWorkoutCompletedOnDate(usuarioID, checkDate)
        if (!wasCompleted) {
          missedScheduledDay = true
          break
        }
      }
      
      checkDate.setDate(checkDate.getDate() + 1)
    }
    
    if (missedScheduledDay) {
      await updateDoc(userDocRef, {
        currentStreak: 0
      })
      
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
      
      const exercises = workoutData.exercises || []
      const hasCheckedExercises = exercises.some((ex: { checked?: boolean }) => ex.checked === true)
      
      if (hasCheckedExercises) {
        const resetExercises = exercises.map((ex: { checked?: boolean }) => ({
          ...ex,
          checked: false
        }))
        
        await updateDoc(doc(db, 'treinos', docSnap.id), {
          exercises: resetExercises
        })
        
        resetCount++
      }
    }
    
    if (resetCount > 0) {
      console.log(`✅ Reset ${resetCount} previous days' workouts for user ${usuarioID}`)
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
    const lastCompletedDate = userData.lastCompletedDate
    const todayStr = today.toDateString()
    if (lastCompletedDate === todayStr) {
      return currentStreak
    }
    const previousScheduledDate = getPreviousScheduledDay(today, scheduledDays)
    let newStreak = 1
    if (previousScheduledDate) {
      const wasPreviousCompleted = await wasWorkoutCompletedOnDate(usuarioID, previousScheduledDate)
      if (wasPreviousCompleted) {
        newStreak = currentStreak + 1
      } else {
        newStreak = 1
      }
    } else {
      newStreak = 1
    }
    const newLongestStreak = Math.max(longestStreak, newStreak)
    await updateDoc(userDocRef, {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastCompletedDate: todayStr
    })
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
