import { db } from '../firebaseConfig'
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'

// Map Portuguese day names to weekday numbers (0 = Sunday, 6 = Saturday)
const dayNameToNumber: Record<string, number> = {
  'Domingo': 0,
  'Segunda-feira': 1,
  'Terça-feira': 2,
  'Quarta-feira': 3,
  'Quinta-feira': 4,
  'Sexta-feira': 5,
  'Sábado': 6
}

/**
 * Updates user's scheduled days based on their workouts
 * This runs when user loads profile or adds/removes workouts
 */
export async function updateScheduledDays(usuarioID: string): Promise<number[]> {
  try {
    // Fetch all user's workouts
    const workoutsRef = collection(db, 'treinos')
    const q = query(workoutsRef, where('usuarioID', '==', usuarioID))
    const querySnapshot = await getDocs(q)
    
    // Extract unique days and convert to numbers
    const uniqueDays = new Set<number>()
    querySnapshot.docs.forEach((doc) => {
      const dia = doc.data().dia as string
      const dayNumber = dayNameToNumber[dia]
      if (dayNumber !== undefined) {
        uniqueDays.add(dayNumber)
      }
    })
    
    const scheduledDays = Array.from(uniqueDays).sort()
    
    // Update user document
    const userDocRef = doc(db, 'usuarios', usuarioID)
    await updateDoc(userDocRef, {
      scheduledDays
    })
    
    console.log('✅ Scheduled days updated:', scheduledDays)
    return scheduledDays
  } catch (err) {
    console.error('❌ Error updating scheduled days:', err)
    return []
  }
}

/**
 * Gets the previous scheduled day before a given date
 */
function getPreviousScheduledDay(currentDate: Date, scheduledDays: number[]): Date | null {
  if (scheduledDays.length === 0) return null
  
  let daysToSubtract = 1
  
  // Go back up to 7 days to find the previous scheduled day
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

/**
 * Checks if user completed workout on a specific date
 */
async function wasWorkoutCompletedOnDate(usuarioID: string, date: Date): Promise<boolean> {
  try {
    const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
    
    // Check if there's a log entry for this date
    const logsRef = collection(db, 'logs')
    const q = query(
      logsRef,
      where('usuarioID', '==', usuarioID),
      where('data', '>=', dateStr),
      where('data', '<', dateStr + 'T23:59:59')
    )
    const querySnapshot = await getDocs(q)
    
    // If there are any logs for this date, workout was completed
    return !querySnapshot.empty
  } catch (err) {
    console.error('❌ Error checking workout completion:', err)
    return false
  }
}

/**
 * Updates user's streak when they complete all exercises of the day
 * Logic: 
 * - If previous scheduled day was completed → increment streak
 * - If previous scheduled day was missed → reset to 1
 */
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
    const todayWeekday = today.getDay()
    
    // Check if today is a scheduled day
    if (!scheduledDays.includes(todayWeekday)) {
      console.log('⚠️ Today is not a scheduled workout day')
      return currentStreak
    }
    
    // Check if user already completed today (prevent double counting)
    const lastCompletedDate = userData.lastCompletedDate
    const todayStr = today.toISOString().split('T')[0]
    if (lastCompletedDate === todayStr) {
      console.log('⚠️ Workout already completed today')
      return currentStreak
    }
    
    // Get previous scheduled day
    const previousScheduledDate = getPreviousScheduledDay(today, scheduledDays)
    
    let newStreak = 1 // Default: reset to 1 (today is the new first day)
    
    if (previousScheduledDate) {
      // Check if previous scheduled day was completed
      const wasPreviousCompleted = await wasWorkoutCompletedOnDate(usuarioID, previousScheduledDate)
      
      if (wasPreviousCompleted) {
        // Previous day was completed → increment streak
        newStreak = currentStreak + 1
        console.log('🔥 Streak continued! +1')
      } else {
        // Previous day was missed → reset to 1
        newStreak = 1
        console.log('💔 Streak reset (missed previous day)')
      }
    } else {
      // First workout ever or no previous scheduled day found
      newStreak = 1
      console.log('🆕 First workout streak!')
    }
    
    // Update user document
    const newLongestStreak = Math.max(longestStreak, newStreak)
    await updateDoc(userDocRef, {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastCompletedDate: todayStr
    })
    
    console.log(`✅ Streak updated: ${newStreak} (Longest: ${newLongestStreak})`)
    return newStreak
  } catch (err) {
    console.error('❌ Error updating streak:', err)
    return 0
  }
}

/**
 * Gets user's current streak data
 */
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
