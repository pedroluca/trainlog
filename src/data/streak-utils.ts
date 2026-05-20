import { db } from '../firebaseConfig'
import { doc, getDoc, updateDoc, collection, query, where, getDocs, runTransaction } from 'firebase/firestore'
import { getStreakMilestoneValue } from './badges'
import { sendOneSignalPushToTargets } from '../utils/push-notifications'

const dayNameToNumber: Record<string, number> = {
  'Domingo': 0,
  'Segunda-feira': 1,
  'Terça-feira': 2,
  'Quarta-feira': 3,
  'Quinta-feira': 4,
  'Sexta-feira': 5,
  'Sábado': 6
}

const FREEZE_CAP_FREE = 2
const FREEZE_CAP_PREMIUM = 4
const FREEZE_MONTHLY_FREE = 1
const FREEZE_MONTHLY_PREMIUM = 2

type StreakUserData = {
  currentStreak?: number
  longestStreak?: number
  scheduledDays?: number[]
  lastCompletedDate?: string
  lastWorkoutDate?: string
  isPremium?: boolean
  freezeCount?: number
  freezeLastGrantedMonth?: string
  streakMilestoneRewardedUpTo?: number
  oneSignalSubscriptionId?: string
  player_id?: string
}

export type FreezeWarning = {
  remainingFreezes: number
  streakBroken: boolean
  message: string
}

type StreakSyncResult = {
  currentStreak: number
  longestStreak: number
  freezeCount: number
  freezeCap: number
  milestoneValue: number
  lastWorkoutDate: string | null
  freezeWarning: FreezeWarning | null
  pushTargets: string[]
}

function getLocalDateStamp(date = new Date()): string {
  return date.toDateString()
}

function getMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getFreezeCap(isPremium?: boolean): number {
  return isPremium ? FREEZE_CAP_PREMIUM : FREEZE_CAP_FREE
}

function getMonthlyFreezeAmount(isPremium?: boolean): number {
  return isPremium ? FREEZE_MONTHLY_PREMIUM : FREEZE_MONTHLY_FREE
}

function countMissedScheduledDays(lastCompletedDate: string | undefined, today: Date, scheduledDays: number[]): number {
  if (!lastCompletedDate || scheduledDays.length === 0) return 0

  const lastCompleted = new Date(lastCompletedDate)
  if (Number.isNaN(lastCompleted.getTime())) return 0

  lastCompleted.setHours(0, 0, 0, 0)
  const todayMidnight = new Date(today)
  todayMidnight.setHours(0, 0, 0, 0)

  if (lastCompleted >= todayMidnight) return 0

  const checkDate = new Date(lastCompleted)
  checkDate.setDate(checkDate.getDate() + 1)

  let missedScheduledDays = 0

  while (checkDate < todayMidnight) {
    if (scheduledDays.includes(checkDate.getDay())) {
      missedScheduledDays++
    }
    checkDate.setDate(checkDate.getDate() + 1)
  }

  return missedScheduledDays
}

function normalizeStreakData(data: StreakUserData) {
  const longestStreak = data.longestStreak || 0

  return {
    currentStreak: data.currentStreak || 0,
    longestStreak,
    scheduledDays: data.scheduledDays || [],
    lastCompletedDate: data.lastCompletedDate || '',
    lastWorkoutDate: data.lastWorkoutDate || '',
    isPremium: !!data.isPremium,
    freezeCount: data.freezeCount || 0,
    freezeLastGrantedMonth: data.freezeLastGrantedMonth || '',
    streakMilestoneRewardedUpTo: typeof data.streakMilestoneRewardedUpTo === 'number'
      ? data.streakMilestoneRewardedUpTo
      : getStreakMilestoneValue(longestStreak),
    pushTargets: [data.oneSignalSubscriptionId, data.player_id].filter(Boolean) as string[]
  }
}

function buildFreezeWarningMessage(remainingFreezes: number, streakBroken: boolean): string {
  if (streakBroken) {
    return 'Sua streak foi zerada porque os freezes acabaram.'
  }

  if (remainingFreezes === 0) {
    return 'Você usou o último freeze. A próxima falta vai zerar sua streak.'
  }

  return 'Freeze consumido com sucesso.'
}

async function syncStreakState(usuarioID: string, mode: 'maintenance' | 'workout'): Promise<StreakSyncResult | null> {
  const userDocRef = doc(db, 'usuarios', usuarioID)
  const today = new Date()
  const todayStamp = getLocalDateStamp(today)
  const todayMonth = getMonthKey(today)
  const todayIso = today.toLocaleDateString('en-CA')

  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userDocRef)
    if (!userDoc.exists()) return null

    const userData = normalizeStreakData(userDoc.data() as StreakUserData)
    const freezeCap = getFreezeCap(userData.isPremium)
    const monthlyFreezeAmount = getMonthlyFreezeAmount(userData.isPremium)
    const hadRewardField = typeof (userDoc.data() as StreakUserData).streakMilestoneRewardedUpTo === 'number'

    let currentStreak = userData.currentStreak
    let longestStreak = userData.longestStreak
    let freezeCount = userData.freezeCount
    let freezeLastGrantedMonth = userData.freezeLastGrantedMonth
    let lastCompletedDate = userData.lastCompletedDate
    let lastWorkoutDate = userData.lastWorkoutDate
    let streakMilestoneRewardedUpTo = userData.streakMilestoneRewardedUpTo
    let changed = !hadRewardField
    let freezeWarning: FreezeWarning | null = null
    let usedFreezeThisRun = false
    let streakBrokenThisRun = false

    if (freezeLastGrantedMonth !== todayMonth) {
      freezeCount = Math.min(freezeCap, freezeCount + monthlyFreezeAmount)
      freezeLastGrantedMonth = todayMonth
      changed = true
    }

    const missedScheduledDays = countMissedScheduledDays(lastCompletedDate, today, userData.scheduledDays)

    if (currentStreak > 0 && missedScheduledDays > 0) {
      if (freezeCount >= missedScheduledDays) {
        freezeCount -= missedScheduledDays
        lastCompletedDate = todayStamp
        usedFreezeThisRun = true
        changed = true
      } else {
        freezeCount = 0
        currentStreak = 0
        lastCompletedDate = todayStamp
        streakBrokenThisRun = true
        changed = true
      }
    }

    if (mode === 'workout' && lastWorkoutDate !== todayIso) {
      const newStreak = currentStreak > 0 ? currentStreak + 1 : 1
      currentStreak = newStreak
      longestStreak = Math.max(longestStreak, newStreak)
      lastWorkoutDate = todayIso
      lastCompletedDate = todayStamp
      changed = true

      const achievedMilestone = getStreakMilestoneValue(longestStreak)
      if (achievedMilestone > streakMilestoneRewardedUpTo) {
        const milestoneIndex = achievedMilestone / 30
        let rewardAmount = 0

        if (milestoneIndex === 1) {
          rewardAmount = 1
        } else if (userData.isPremium) {
          rewardAmount = 1
        }

        if (rewardAmount > 0) {
          const nextFreezeCount = Math.min(freezeCap, freezeCount + rewardAmount)
          if (nextFreezeCount !== freezeCount) {
            freezeCount = nextFreezeCount
            changed = true
          }
        }

        streakMilestoneRewardedUpTo = achievedMilestone
        changed = true
      }
    }

    if (streakBrokenThisRun) {
      freezeWarning = {
        remainingFreezes: freezeCount,
        streakBroken: true,
        message: buildFreezeWarningMessage(freezeCount, true)
      }
    } else if (usedFreezeThisRun && freezeCount === 0) {
      freezeWarning = {
        remainingFreezes: 0,
        streakBroken: false,
        message: buildFreezeWarningMessage(0, false)
      }
    }

    if (changed) {
      transaction.update(userDocRef, {
        currentStreak,
        longestStreak,
        lastCompletedDate,
        lastWorkoutDate,
        freezeCount,
        freezeLastGrantedMonth,
        streakMilestoneRewardedUpTo
      })
    }

    return {
      currentStreak,
      longestStreak,
      freezeCount,
      freezeCap,
      milestoneValue: getStreakMilestoneValue(longestStreak),
      lastWorkoutDate: lastWorkoutDate || null,
      freezeWarning,
      pushTargets: userData.pushTargets
    }
  })
}

function emitStreakEvents(result: StreakSyncResult): void {
  if (typeof window === 'undefined') return

  window.dispatchEvent(new CustomEvent('streakUpdated', {
    detail: {
      newStreak: result.currentStreak,
      longestStreak: result.longestStreak,
      freezeCount: result.freezeCount,
      freezeCap: result.freezeCap,
      milestoneValue: result.milestoneValue,
      lastWorkoutDate: result.lastWorkoutDate
    }
  }))

  if (result.freezeWarning) {
    window.dispatchEvent(new CustomEvent('freezeWarning', {
      detail: result.freezeWarning
    }))
  }
}

async function sendFreezeWarningPush(result: StreakSyncResult): Promise<void> {
  if (!result.freezeWarning || result.pushTargets.length === 0 || typeof window === 'undefined') return

  const title = result.freezeWarning.streakBroken
    ? 'Sua streak foi zerada'
    : 'Você usou o último freeze'

  const body = result.freezeWarning.message
  const url = `${window.location.origin}/profile/streak-calendar`

  await sendOneSignalPushToTargets({
    targetIds: result.pushTargets,
    title,
    body,
    url
  })
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
    const result = await syncStreakState(usuarioID, 'maintenance')
    if (!result) return

    emitStreakEvents(result)
    await sendFreezeWarningPush(result)
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
    const result = await syncStreakState(usuarioID, 'workout')
    if (!result) {
      console.error('❌ User not found')
      return 0
    }

    emitStreakEvents(result)
    await sendFreezeWarningPush(result)

    return result.currentStreak
  } catch (err) {
    console.error('❌ Error updating streak:', err)
    return 0
  }
}

export async function getStreakData(usuarioID: string): Promise<{
  currentStreak: number
  longestStreak: number
  scheduledDays: number[]
  freezeCount: number
  freezeCap: number
  milestoneValue: number
}> {
  try {
    const userDocRef = doc(db, 'usuarios', usuarioID)
    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      return { currentStreak: 0, longestStreak: 0, scheduledDays: [], freezeCount: 0, freezeCap: FREEZE_CAP_FREE, milestoneValue: 0 }
    }

    const userData = userDoc.data()
    const isPremium = !!userData.isPremium
    const longestStreak = userData.longestStreak || 0
    return {
      currentStreak: userData.currentStreak || 0,
      longestStreak,
      scheduledDays: userData.scheduledDays || [],
      freezeCount: userData.freezeCount || 0,
      freezeCap: getFreezeCap(isPremium),
      milestoneValue: getStreakMilestoneValue(longestStreak)
    }
  } catch (err) {
    console.error('❌ Error getting streak data:', err)
    return { currentStreak: 0, longestStreak: 0, scheduledDays: [], freezeCount: 0, freezeCap: FREEZE_CAP_FREE, milestoneValue: 0 }
  }
}
