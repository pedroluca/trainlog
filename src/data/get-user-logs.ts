import { db } from '../firebaseConfig'
import { collection, query, where, orderBy, getDocs, getCountFromServer } from 'firebase/firestore'

export type LogEntry = {
  id: string
  usuarioID: string
  titulo: string
  series: number
  repeticoes: number
  peso: number
  usesProgressiveWeight?: boolean
  progressiveSets?: { reps: number; weight: number }[]
  data: string
}

// Get total count of logs for pagination
export async function getUserLogsCount(usuarioID: string): Promise<number> {
  try {
    const logsRef = collection(db, 'logs')
    const q = query(
      logsRef,
      where('usuarioID', '==', usuarioID)
    )

    const snapshot = await getCountFromServer(q)
    return snapshot.data().count
  } catch (error) {
    console.error('Error getting logs count:', error)
    return 0
  }
}

// Get all logs for a user (for debugging)
export async function getAllUserLogs(usuarioID: string): Promise<LogEntry[]> {
  try {
    const logsRef = collection(db, 'logs')
    const q = query(
      logsRef,
      where('usuarioID', '==', usuarioID),
      orderBy('data', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const logs = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data
      } as LogEntry
    })

    return logs
  } catch (error) {
    console.error('Error fetching all logs:', error)
    return []
  }
}

export async function getUserLogsLast7Days(usuarioID: string): Promise<LogEntry[]> {
  try {

    const allLogs = await getAllUserLogs(usuarioID)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const filteredLogs = allLogs.filter(log => {
      const logDate = new Date(log.data)
      return logDate >= sevenDaysAgo
    })

    return filteredLogs
  } catch (error) {
    console.error('Error fetching last 7 days logs:', error)
    return []
  }
}

// Get paginated logs (very simple approach)
export async function getUserLogsPaginated(
  usuarioID: string,
  pageSize: number = 20
): Promise<{ logs: LogEntry[], hasMore: boolean }> {
  try {
    // Use the getAllUserLogs function which works
    const allLogs = await getAllUserLogs(usuarioID)

    // Simple pagination - take first pageSize items
    const hasMore = allLogs.length > pageSize
    const logs = allLogs.slice(0, pageSize)

    return { logs, hasMore }
  } catch (error) {
    console.error('Error fetching paginated logs:', error)
    return { logs: [], hasMore: false }
  }
}

// Group logs by date (ignoring time)
export function groupLogsByDate(logs: LogEntry[]): Record<string, LogEntry[]> {
  return logs.reduce((groups, log) => {
    // Extract only the date part (YYYY-MM-DD) from the timestamp
    const date = new Date(log.data).toISOString().split('T')[0]
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(log)
    return groups
  }, {} as Record<string, LogEntry[]>)
}