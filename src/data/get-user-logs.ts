import { db } from '../firebaseConfig'
import { collection, query, where, orderBy, getDocs, getCountFromServer } from 'firebase/firestore'

export type LogEntry = {
  id: string
  usuarioID: string
  titulo: string
  series: number
  repeticoes: number
  peso: number
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
    console.log('Fetching ALL logs for user:', usuarioID)
    
    const logsRef = collection(db, 'logs')
    const q = query(
      logsRef,
      where('usuarioID', '==', usuarioID),
      orderBy('data', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    const logs = querySnapshot.docs.map(doc => {
      const data = doc.data()
      console.log('Found log (all):', data)
      return {
        id: doc.id,
        ...data
      } as LogEntry
    })
    
    console.log('Total ALL logs found:', logs.length)
    return logs
  } catch (error) {
    console.error('Error fetching all logs:', error)
    return []
  }
}

// Get logs for the last 7 days (very simple approach)
export async function getUserLogsLast7Days(usuarioID: string): Promise<LogEntry[]> {
  try {
    console.log('Fetching logs for user:', usuarioID)
    
    // Use the getAllUserLogs function which works
    const allLogs = await getAllUserLogs(usuarioID)
    
    // Filter last 7 days client-side
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const filteredLogs = allLogs.filter(log => {
      const logDate = new Date(log.data)
      return logDate >= sevenDaysAgo
    })
    
    console.log('Total logs found:', allLogs.length)
    console.log('Last 7 days logs:', filteredLogs.length)
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