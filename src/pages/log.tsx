import { History } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { EmptyState, LoadingState } from '../components/ui/misc'
import { Page, StackHeader } from '../components/ui/page'
import { describeLog, getLogsPage, getUserLogsCount, groupLogsByDay, type LogEntry, type LogsPage } from '../data/logs'
import { formatRelativeDay, formatTime } from '../utils/format'

const PAGE_SIZE = 30

export function LogPage() {
  const usuarioID = localStorage.getItem('usuarioId')
  const [logs, setLogs] = useState<LogEntry[] | null>(null)
  const [total, setTotal] = useState<number | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const cursor = useRef<LogsPage['cursor']>(null)
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!usuarioID) return
    let active = true
    getUserLogsCount(usuarioID).then(count => active && setTotal(count))
    getLogsPage(usuarioID, PAGE_SIZE)
      .catch((): LogsPage => ({ logs: [], cursor: null, hasMore: false }))
      .then(page => {
        if (!active) return
        cursor.current = page.cursor
        setHasMore(page.hasMore)
        setLogs(page.logs)
      })
    return () => {
      active = false
    }
  }, [usuarioID])

  const loadMore = async () => {
    if (!usuarioID || loadingMore || !hasMore || !cursor.current) return
    setLoadingMore(true)
    try {
      const page = await getLogsPage(usuarioID, PAGE_SIZE, cursor.current)
      cursor.current = page.cursor
      setHasMore(page.hasMore)
      setLogs(current => [...(current ?? []), ...page.logs])
    } finally {
      setLoadingMore(false)
    }
  }

  // Carrega a próxima página quando o fim da lista aparece na tela
  const loadMoreRef = useRef(loadMore)
  loadMoreRef.current = loadMore
  useEffect(() => {
    const element = sentinel.current
    if (!element || !hasMore) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) loadMoreRef.current()
    }, { rootMargin: '300px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [hasMore, logs])

  if (!usuarioID) return <Navigate to="/login" replace />

  const sections = logs ? groupLogsByDay(logs) : []

  return (
    <>
      <StackHeader title="Histórico" backTo="/profile" />
      {!logs ? (
        <LoadingState />
      ) : (
        <Page className="gap-0 pt-2">
          {logs.length === 0 ? (
            <Card>
              <EmptyState icon={History} title="Nenhuma atividade registrada" description="Os exercícios concluídos aparecem aqui, agrupados por dia." />
            </Card>
          ) : (
            <>
              {total !== null && total > 0 && <p className="pb-1 text-xs text-muted">{total} exercícios registrados no total</p>}
              {sections.map(section => (
                <section key={section.dateKey}>
                  <div className="flex items-baseline justify-between px-1 pb-2 pt-5">
                    <h2 className="text-base font-semibold">{formatRelativeDay(section.dateKey)}</h2>
                    <span className="text-xs text-subtle">{section.data.length} {section.data.length === 1 ? 'exercício' : 'exercícios'}</span>
                  </div>
                  <Card className="overflow-hidden">
                    {section.data.map((item, index) => (
                      <div key={item.id}>
                        {index > 0 && <div className="mx-4 h-px bg-border" />}
                        <div className="flex gap-3 px-4 py-3">
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="text-base font-medium">{item.titulo}</span>
                            <span className="text-xs text-muted">{describeLog(item)}</span>
                          </div>
                          <span className="text-xs text-subtle">{formatTime(item.data)}</span>
                        </div>
                      </div>
                    ))}
                  </Card>
                </section>
              ))}
              <div ref={sentinel} className="flex justify-center pt-5">
                {hasMore && <Button label="Carregar mais" variant="secondary" loading={loadingMore} onClick={loadMore} />}
              </div>
            </>
          )}
        </Page>
      )}
    </>
  )
}
