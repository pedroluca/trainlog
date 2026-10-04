import { db } from '../firebaseConfig'
import { doc, getDoc, updateDoc, collection, query, where, getDocs, runTransaction } from 'firebase/firestore'
import { getStreakMilestoneValue, STREAK_MILESTONE_WEEKS } from './badges'
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

const FREEZE_CAP_FREE = 1
const FREEZE_CAP_PREMIUM = 2
const FREEZE_MONTHLY_FREE = 1
const FREEZE_MONTHLY_PREMIUM = 2

// Versão 2 = streak semanal (1 treino por semana, Dom–Sáb)
const STREAK_VERSION = 2
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

type StreakUserData = {
  currentStreak?: number
  longestStreak?: number
  scheduledDays?: number[]
  lastStreakWeek?: string
  lastWorkoutDate?: string
  totalWorkouts?: number
  streakVersion?: number
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

export type StreakUpdateResult = {
  currentStreak: number
  totalWorkouts: number
  streakIncremented: boolean
}

type StreakSyncResult = {
  currentStreak: number
  longestStreak: number
  totalWorkouts: number
  freezeCount: number
  freezeCap: number
  milestoneValue: number
  lastWorkoutDate: string | null
  lastStreakWeek: string | null
  streakIncremented: boolean
  freezeWarning: FreezeWarning | null
  pushTargets: string[]
}

function getMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getWeekStart(date = new Date()): Date {
  const weekStart = new Date(date)
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  return weekStart
}

/** Chave da semana (domingo que a inicia) no formato YYYY-MM-DD, horário local */
export function getWeekKey(date = new Date()): string {
  return getWeekStart(date).toLocaleDateString('en-CA')
}

// Interpreta YYYY-MM-DD como data local (new Date('YYYY-MM-DD') seria UTC)
function parseDateKey(key: string): Date | null {
  const [year, month, day] = key.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function weeksBetween(fromWeekKey: string, toWeekKey: string): number {
  const from = parseDateKey(fromWeekKey)
  const to = parseDateKey(toWeekKey)
  if (!from || !to) return 0
  // Math.round absorve a hora a mais/a menos do horário de verão
  return Math.round((to.getTime() - from.getTime()) / WEEK_MS)
}

function getPreviousWeekKey(weekKey: string): string {
  const weekStart = parseDateKey(weekKey) ?? getWeekStart()
  weekStart.setDate(weekStart.getDate() - 7)
  return weekStart.toLocaleDateString('en-CA')
}

// Semanas inteiras sem treino entre a última semana contabilizada e a atual (a atual nunca conta como falta)
function countMissedWeeks(lastStreakWeek: string, currentWeekKey: string): number {
  if (!lastStreakWeek) return 0
  return Math.max(0, weeksBetween(lastStreakWeek, currentWeekKey) - 1)
}

/** Converte o campo `data` de um log (ISO string ou Firestore Timestamp) em Date */
export function parseLogDate(raw: unknown): Date | null {
  if (typeof raw === 'string') {
    const date = new Date(raw)
    return Number.isNaN(date.getTime()) ? null : date
  }

  if (raw && typeof raw === 'object' && 'seconds' in raw && typeof raw.seconds === 'number') {
    return new Date(raw.seconds * 1000)
  }

  return null
}

function getFreezeCap(isPremium?: boolean): number {
  return isPremium ? FREEZE_CAP_PREMIUM : FREEZE_CAP_FREE
}

function getMonthlyFreezeAmount(isPremium?: boolean): number {
  return isPremium ? FREEZE_MONTHLY_PREMIUM : FREEZE_MONTHLY_FREE
}

function computeWeeklyHistory(workoutWeeks: Set<string>) {
  let currentStreak = 0
  let longestStreak = 0
  let lastStreakWeek = ''

  for (const weekKey of Array.from(workoutWeeks).sort()) {
    currentStreak = lastStreakWeek && weeksBetween(lastStreakWeek, weekKey) === 1 ? currentStreak + 1 : 1
    longestStreak = Math.max(longestStreak, currentStreak)
    lastStreakWeek = weekKey
  }

  return { currentStreak, longestStreak, lastStreakWeek }
}

// Migra usuários do modelo diário para o semanal recalculando a partir dos logs
async function ensureStreakMigrated(usuarioID: string): Promise<void> {
  const userDocRef = doc(db, 'usuarios', usuarioID)
  const userDoc = await getDoc(userDocRef)
  if (!userDoc.exists() || (userDoc.data() as StreakUserData).streakVersion === STREAK_VERSION) return

  const logsSnapshot = await getDocs(query(collection(db, 'logs'), where('usuarioID', '==', usuarioID)))

  const workoutDays = new Set<string>()
  const workoutWeeks = new Set<string>()

  logsSnapshot.docs.forEach((logDoc) => {
    const date = parseLogDate(logDoc.data().data)
    if (!date) return
    workoutDays.add(date.toDateString())
    workoutWeeks.add(getWeekKey(date))
  })

  const history = computeWeeklyHistory(workoutWeeks)

  await runTransaction(db, async (transaction) => {
    const freshDoc = await transaction.get(userDocRef)
    if (!freshDoc.exists()) return

    const data = freshDoc.data() as StreakUserData
    if (data.streakVersion === STREAK_VERSION) return

    transaction.update(userDocRef, {
      currentStreak: history.currentStreak,
      longestStreak: history.longestStreak,
      lastStreakWeek: history.lastStreakWeek,
      totalWorkouts: workoutDays.size,
      freezeCount: Math.min(data.freezeCount || 0, getFreezeCap(data.isPremium)),
      streakMilestoneRewardedUpTo: getStreakMilestoneValue(history.longestStreak),
      streakVersion: STREAK_VERSION
    })
  })
}

function normalizeStreakData(data: StreakUserData) {
  const longestStreak = data.longestStreak || 0

  return {
    currentStreak: data.currentStreak || 0,
    longestStreak,
    lastStreakWeek: data.lastStreakWeek || '',
    lastWorkoutDate: data.lastWorkoutDate || '',
    totalWorkouts: data.totalWorkouts || 0,
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
    return 'Sua streak foi zerada: você ficou uma semana sem treinar e não tinha freezes suficientes.'
  }

  if (remainingFreezes === 0) {
    return 'Você usou o último freeze. Se passar mais uma semana sem treinar, sua streak será zerada.'
  }

  return 'Freeze consumido com sucesso.'
}

async function syncStreakState(usuarioID: string, mode: 'maintenance' | 'workout'): Promise<StreakSyncResult | null> {
  await ensureStreakMigrated(usuarioID)

  const userDocRef = doc(db, 'usuarios', usuarioID)
  const today = new Date()
  const todayMonth = getMonthKey(today)
  const todayIso = today.toLocaleDateString('en-CA')
  const currentWeek = getWeekKey(today)

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
    let lastStreakWeek = userData.lastStreakWeek
    let lastWorkoutDate = userData.lastWorkoutDate
    let totalWorkouts = userData.totalWorkouts
    let streakMilestoneRewardedUpTo = userData.streakMilestoneRewardedUpTo
    let changed = !hadRewardField
    let freezeWarning: FreezeWarning | null = null
    let usedFreezeThisRun = false
    let streakBrokenThisRun = false
    let streakIncremented = false

    if (freezeLastGrantedMonth !== todayMonth) {
      freezeCount = Math.min(freezeCap, freezeCount + monthlyFreezeAmount)
      freezeLastGrantedMonth = todayMonth
      changed = true
    }

    if (freezeCount > freezeCap) {
      freezeCount = freezeCap
      changed = true
    }

    const missedWeeks = countMissedWeeks(lastStreakWeek, currentWeek)

    if (currentStreak > 0 && missedWeeks > 0) {
      if (freezeCount >= missedWeeks) {
        freezeCount -= missedWeeks
        lastStreakWeek = getPreviousWeekKey(currentWeek)
        usedFreezeThisRun = true
      } else {
        freezeCount = 0
        currentStreak = 0
        streakBrokenThisRun = true
      }
      changed = true
    }

    if (mode === 'workout' && lastWorkoutDate !== todayIso) {
      totalWorkouts++
      lastWorkoutDate = todayIso
      changed = true

      // Só o primeiro treino da semana avança a streak
      if (lastStreakWeek !== currentWeek) {
        currentStreak = currentStreak > 0 ? currentStreak + 1 : 1
        longestStreak = Math.max(longestStreak, currentStreak)
        lastStreakWeek = currentWeek
        streakIncremented = true

        const achievedMilestone = getStreakMilestoneValue(longestStreak)
        if (achievedMilestone > streakMilestoneRewardedUpTo) {
          const milestoneIndex = achievedMilestone / STREAK_MILESTONE_WEEKS
          let rewardAmount = 0

          if (milestoneIndex === 1) {
            rewardAmount = 1
          } else if (userData.isPremium) {
            rewardAmount = 1
          }

          if (rewardAmount > 0) {
            freezeCount = Math.min(freezeCap, freezeCount + rewardAmount)
          }

          streakMilestoneRewardedUpTo = achievedMilestone
        }
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
        lastStreakWeek,
        lastWorkoutDate,
        totalWorkouts,
        freezeCount,
        freezeLastGrantedMonth,
        streakMilestoneRewardedUpTo
      })
    }

    return {
      currentStreak,
      longestStreak,
      totalWorkouts,
      freezeCount,
      freezeCap,
      milestoneValue: getStreakMilestoneValue(longestStreak),
      lastWorkoutDate: lastWorkoutDate || null,
      lastStreakWeek: lastStreakWeek || null,
      streakIncremented,
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
      totalWorkouts: result.totalWorkouts,
      freezeCount: result.freezeCount,
      freezeCap: result.freezeCap,
      milestoneValue: result.milestoneValue,
      lastWorkoutDate: result.lastWorkoutDate,
      lastStreakWeek: result.lastStreakWeek,
      streakIncremented: result.streakIncremented
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
        const hasProgress = (exData.setsDone ?? 0) > 0 || exData.restEndsAt != null
        if (exData.isFeito === true || exData.isSkipped === true || hasProgress) {
          hasUpdates = true
          updatePromises.push(updateDoc(exDoc.ref, { isFeito: false, isSkipped: false, setsDone: 0, restEndsAt: null }))
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

export async function updateStreak(usuarioID: string): Promise<StreakUpdateResult | null> {
  try {
    const result = await syncStreakState(usuarioID, 'workout')
    if (!result) {
      console.error('❌ User not found')
      return null
    }

    emitStreakEvents(result)
    await sendFreezeWarningPush(result)

    return {
      currentStreak: result.currentStreak,
      totalWorkouts: result.totalWorkouts,
      streakIncremented: result.streakIncremented
    }
  } catch (err) {
    console.error('❌ Error updating streak:', err)
    return null
  }
}

export async function getStreakData(usuarioID: string): Promise<{
  currentStreak: number
  longestStreak: number
  totalWorkouts: number
  scheduledDays: number[]
  freezeCount: number
  freezeCap: number
  milestoneValue: number
}> {
  const emptyData = { currentStreak: 0, longestStreak: 0, totalWorkouts: 0, scheduledDays: [], freezeCount: 0, freezeCap: FREEZE_CAP_FREE, milestoneValue: 0 }

  try {
    const userDocRef = doc(db, 'usuarios', usuarioID)
    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      return emptyData
    }

    const userData = userDoc.data()
    const isPremium = !!userData.isPremium
    const longestStreak = userData.longestStreak || 0
    return {
      currentStreak: userData.currentStreak || 0,
      longestStreak,
      totalWorkouts: userData.totalWorkouts || 0,
      scheduledDays: userData.scheduledDays || [],
      freezeCount: userData.freezeCount || 0,
      freezeCap: getFreezeCap(isPremium),
      milestoneValue: getStreakMilestoneValue(longestStreak)
    }
  } catch (err) {
    console.error('❌ Error getting streak data:', err)
    return emptyData
  }
}
