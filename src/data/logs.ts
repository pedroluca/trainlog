import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { getLocalDateKey } from '../utils/format'

// Mesmas operações do app nativo (tractus-app/src/data/logs.ts)

export type LogEntry = {
  id: string
  usuarioID: string
  titulo: string
  series: number
  repeticoes: number
  peso: number
  usesProgressiveWeight?: boolean
  progressiveSets?: { reps: number; weight: number }[]
  /** ISO string */
  data: string
}

const logsCollection = () => collection(db, 'logs')

/** Logs antigos podem ter a data como Timestamp do Firestore em vez de string */
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

function mapLog(snapshot: QueryDocumentSnapshot<DocumentData>): LogEntry {
  const data = snapshot.data()
  const date = parseLogDate(data.data)
  return {
    id: snapshot.id,
    usuarioID: data.usuarioID,
    titulo: data.titulo ?? 'Exercício',
    series: Number(data.series) || 0,
    repeticoes: Number(data.repeticoes) || 0,
    peso: Number(data.peso) || 0,
    usesProgressiveWeight: data.usesProgressiveWeight === true,
    progressiveSets: Array.isArray(data.progressiveSets) ? data.progressiveSets : [],
    data: (date ?? new Date(0)).toISOString(),
  }
}

export type LogsPage = {
  logs: LogEntry[]
  cursor: QueryDocumentSnapshot<DocumentData> | null
  hasMore: boolean
}

/** Histórico paginado direto no Firestore */
export async function getLogsPage(userId: string, pageSize: number, cursor?: QueryDocumentSnapshot<DocumentData> | null): Promise<LogsPage> {
  const q = cursor
    ? query(logsCollection(), where('usuarioID', '==', userId), orderBy('data', 'desc'), startAfter(cursor), limit(pageSize))
    : query(logsCollection(), where('usuarioID', '==', userId), orderBy('data', 'desc'), limit(pageSize))

  const snapshot = await getDocs(q)
  return {
    logs: snapshot.docs.map(mapLog),
    cursor: snapshot.docs[snapshot.docs.length - 1] ?? null,
    hasMore: snapshot.docs.length === pageSize,
  }
}

/** Os N registros mais recentes (perfil de amigo) */
export async function getRecentLogs(userId: string, count: number): Promise<LogEntry[]> {
  const snapshot = await getDocs(query(logsCollection(), where('usuarioID', '==', userId), orderBy('data', 'desc'), limit(count)))
  return snapshot.docs.map(mapLog)
}

export async function getAllUserLogs(userId: string): Promise<LogEntry[]> {
  const snapshot = await getDocs(query(logsCollection(), where('usuarioID', '==', userId), orderBy('data', 'desc')))
  return snapshot.docs.map(mapLog)
}

export async function getUserLogsCount(userId: string): Promise<number> {
  try {
    const snapshot = await getCountFromServer(query(logsCollection(), where('usuarioID', '==', userId)))
    return snapshot.data().count
  } catch {
    return 0
  }
}

/** Datas (toDateString) em que o usuário registrou algum exercício */
export async function getWorkoutDates(userId: string): Promise<Set<string>> {
  const snapshot = await getDocs(query(logsCollection(), where('usuarioID', '==', userId)))
  const dates = new Set<string>()
  snapshot.docs.forEach(logDoc => {
    const date = parseLogDate(logDoc.data().data)
    if (date) dates.add(date.toDateString())
  })
  return dates
}

export type LogSection = { dateKey: string; data: LogEntry[] }

/** Agrupa por dia (horário local) mantendo a ordem de chegada */
export function groupLogsByDay(logs: LogEntry[]): LogSection[] {
  const sections: LogSection[] = []
  const byKey = new Map<string, LogSection>()
  for (const log of logs) {
    const key = getLocalDateKey(new Date(log.data))
    let section = byKey.get(key)
    if (!section) {
      section = { dateKey: key, data: [] }
      byKey.set(key, section)
      sections.push(section)
    }
    section.data.push(log)
  }
  return sections
}

export function describeLog(log: LogEntry): string {
  if (log.usesProgressiveWeight && log.progressiveSets && log.progressiveSets.length > 0) {
    return `${log.series} séries · ${log.progressiveSets.map(set => `${set.reps}×${set.weight}kg`).join(' · ')}`
  }
  const weight = log.peso > 0 ? ` · ${log.peso} kg` : ''
  return `${log.series} × ${log.repeticoes}${weight}`
}
