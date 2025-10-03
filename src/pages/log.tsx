import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserLogsLast7Days, getUserLogsPaginated, getUserLogsCount, groupLogsByDate, LogEntry } from '../data/get-user-logs'
import { Button } from '../components/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function LogPage() {
  const [last7DaysLogs, setLast7DaysLogs] = useState<LogEntry[]>([])
  const [paginatedLogs, setPaginatedLogs] = useState<LogEntry[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showPaginated, setShowPaginated] = useState(false)
  
  const usuarioID = localStorage.getItem('usuarioId')
  const navigate = useNavigate()
  const pageSize = 20

  if (!usuarioID) {
    navigate('/login')
  }

  const fetchLast7DaysLogs = useCallback(async () => {
    if (!usuarioID) return
    try {
      setLoading(true)
      const logs = await getUserLogsLast7Days(usuarioID)
      setLast7DaysLogs(logs)
    } catch (error) {
      console.error('Error fetching last 7 days logs:', error)
    } finally {
      setLoading(false)
    }
  }, [usuarioID])

  const fetchTotalCount = useCallback(async () => {
    if (!usuarioID) return
    try {
      const count = await getUserLogsCount(usuarioID)
      setTotalCount(count)
    } catch (error) {
      console.error('Error fetching logs count:', error)
    }
  }, [usuarioID])

  const fetchPaginatedLogs = useCallback(async () => {
    if (!usuarioID) return
    try {
      setLoading(true)
      const { logs, hasMore: moreAvailable } = await getUserLogsPaginated(usuarioID, pageSize)
      
      setPaginatedLogs(logs)
      setHasMore(moreAvailable)
    } catch (error) {
      console.error('Error fetching paginated logs:', error)
    } finally {
      setLoading(false)
    }
  }, [usuarioID, pageSize])

  useEffect(() => {
    fetchLast7DaysLogs()
    fetchTotalCount()
  }, [fetchLast7DaysLogs, fetchTotalCount])

  const handleShowAllLogs = () => {
    setShowPaginated(true)
    setPaginatedLogs([])
    fetchPaginatedLogs()
  }

  const handleLoadMore = () => {
    fetchPaginatedLogs()
  }

  const formatDate = (dateString: string) => {
    // dateString is now in YYYY-MM-DD format from grouping
    const date = new Date(dateString + 'T00:00:00')
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const todayStr = today.toISOString().split('T')[0]
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (dateString === todayStr) {
      return 'Hoje'
    } else if (dateString === yesterdayStr) {
      return 'Ontem'
    } else {
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderLogGroup = (dateKey: string, logs: LogEntry[]) => (
    <div key={dateKey} className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100 border-b border-gray-300 dark:border-[#404040] pb-2">
        {formatDate(dateKey)} - {logs.length} exercício{logs.length > 1 ? 's' : ''}
      </h3>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="bg-white dark:bg-[#2d2d2d] rounded-lg p-4 shadow-sm border border-gray-200 dark:border-[#404040]">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100">{log.titulo}</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {log.series} séries × {log.repeticoes} repetições × {log.peso}kg
                </p>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {formatTime(log.data)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const groupedLast7Days = groupLogsByDate(last7DaysLogs)
  const groupedPaginated = groupLogsByDate(paginatedLogs)

  if (loading && !showPaginated) {
    return (
      <main className='flex flex-col items-center min-h-[calc(100vh-11rem)] bg-gray-100 dark:bg-[#1a1a1a] p-4 lg:px-64'>
        <div className="animate-pulse space-y-4 w-full max-w-2xl">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
          <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </main>
    )
  }

  return (
    <main className='flex flex-col items-center min-h-[calc(100vh-11rem)] bg-gray-100 dark:bg-[#1a1a1a] p-4 lg:px-64 pb-32'>
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className='text-2xl font-bold text-gray-800 dark:text-gray-100'>Histórico de Exercícios</h1>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total: {totalCount} exercícios
          </div>
        </div>

        {!showPaginated ? (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Últimos 7 dias</h2>
              {Object.keys(groupedLast7Days).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">Nenhum exercício realizado nos últimos 7 dias.</p>
                </div>
              ) : (
                Object.entries(groupedLast7Days).map(([dateKey, logs]) => 
                  renderLogGroup(dateKey, logs)
                )
              )}
            </div>

            {totalCount > last7DaysLogs.length && (
              <div className="text-center">
                <Button
                  onClick={handleShowAllLogs}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Ver todo o histórico ({totalCount - last7DaysLogs.length} exercícios anteriores)
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button
                onClick={() => setShowPaginated(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white flex items-center gap-2"
              >
                <ChevronLeft size={16} />
                Voltar aos últimos 7 dias
              </Button>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando {paginatedLogs.length} de {totalCount}
              </div>
            </div>

            {Object.keys(groupedPaginated).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Nenhum exercício encontrado.</p>
              </div>
            ) : (
              <>
                {Object.entries(groupedPaginated).map(([dateKey, logs]) => 
                  renderLogGroup(dateKey, logs)
                )}

                {hasMore && (
                  <div className="text-center mt-6">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 mx-auto"
                    >
                      {loading ? 'Carregando...' : 'Carregar mais'}
                      {!loading && <ChevronRight size={16} />}
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}