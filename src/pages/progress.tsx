import { Award, CalendarDays, Dumbbell, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/card'
import { EmptyState, LoadingState, StatTile } from '../components/ui/misc'
import { Page, SectionTitle, StackHeader } from '../components/ui/page'
import { SelectField } from '../components/ui/select-field'
import { WeightChart, type ChartPoint } from '../components/weight-chart'
import { getAllUserLogs, type LogEntry } from '../data/logs'
import { trackProgressViewed } from '../utils/analytics'
import { cn } from '../utils/cn'
import { formatDate, formatDecimal, formatWeight, getLocalDateKey } from '../utils/format'

/** Carga considerada do registro: na progressão, a maior carga das séries */
const logWeight = (log: LogEntry) =>
  log.usesProgressiveWeight && log.progressiveSets?.length ? Math.max(...log.progressiveSets.map(set => set.weight)) : log.peso

type Session = { dateKey: string; date: string; weight: number }

export function Progress() {
  const usuarioID = localStorage.getItem('usuarioId')
  const navigate = useNavigate()
  const [logs, setLogs] = useState<LogEntry[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    if (!usuarioID) return
    trackProgressViewed()
    getAllUserLogs(usuarioID).then(setLogs).catch(() => setLogs([]))
  }, [usuarioID])

  // Exercícios ordenados pelos mais registrados
  const exerciseOptions = useMemo(() => {
    const counts = new Map<string, number>()
    logs?.forEach(log => counts.set(log.titulo, (counts.get(log.titulo) ?? 0) + 1))
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([title, count]) => ({ value: title, label: title, description: `${count} ${count === 1 ? 'registro' : 'registros'}` }))
  }, [logs])

  const exercise = selected && exerciseOptions.some(option => option.value === selected) ? selected : exerciseOptions[0]?.value ?? null

  // Uma sessão por dia, com a maior carga do dia
  const sessions = useMemo<Session[]>(() => {
    if (!logs || !exercise) return []
    const byDay = new Map<string, Session>()
    for (const log of logs) {
      if (log.titulo !== exercise) continue
      const dateKey = getLocalDateKey(new Date(log.data))
      const weight = logWeight(log)
      const current = byDay.get(dateKey)
      if (!current || weight > current.weight) byDay.set(dateKey, { dateKey, date: log.data, weight })
    }
    return Array.from(byDay.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  }, [logs, exercise])

  const overall = useMemo(() => ({
    days: new Set((logs ?? []).map(log => getLocalDateKey(new Date(log.data)))).size,
    exercises: exerciseOptions.length,
    maxWeight: Math.max(0, ...(logs ?? []).map(logWeight)),
  }), [logs, exerciseOptions.length])

  if (!usuarioID) return <Navigate to="/login" replace />

  const record = sessions.length ? Math.max(...sessions.map(session => session.weight)) : 0
  const first = sessions[0]?.weight ?? 0
  const last = sessions[sessions.length - 1]?.weight ?? 0
  const change = first > 0 ? ((last - first) / first) * 100 : 0

  const points: ChartPoint[] = sessions.map(session => ({
    value: session.weight,
    label: formatDate(session.date, { day: '2-digit', month: '2-digit' }),
    date: formatDate(session.date, { day: '2-digit', month: 'short', year: 'numeric' }),
  }))

  return (
    <>
      <StackHeader title="Progresso" backTo="/profile" width="lg" />
      <Page width="lg" className="pt-2">
        {logs === null ? (
          <LoadingState />
        ) : logs.length === 0 ? (
          <Card>
            <EmptyState
              icon={TrendingUp}
              title="Ainda sem dados de progresso"
              description="Conclua exercícios na aba Treino e a evolução da sua carga aparece aqui."
              actionLabel="Ir para o treino"
              onAction={() => navigate('/train')}
            />
          </Card>
        ) : (
          <>
            <div className="flex gap-2">
              <StatTile label="Dias treinados" value={overall.days} icon={CalendarDays} />
              <StatTile label="Exercícios" value={overall.exercises} icon={Dumbbell} />
              <StatTile label="Maior carga" value={formatWeight(overall.maxWeight)} suffix="kg" icon={Award} />
            </div>

            <div className="lg:max-w-md">
              <SelectField label="Exercício" value={exercise} options={exerciseOptions} onChange={setSelected} sheetTitle="Escolha o exercício" />
            </div>

            {exercise && sessions.length > 0 && (
              <>
                <div className="flex gap-2">
                  <StatTile label="Recorde" value={formatWeight(record)} suffix="kg" color="var(--color-primary)" />
                  <StatTile label="Última carga" value={formatWeight(last)} suffix="kg" />
                  <StatTile label="Sessões" value={sessions.length} />
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
                  <Card className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-1 flex-col gap-0.5">
                        <h2 className="text-base font-semibold">Evolução da carga</h2>
                        <p className="text-xs text-muted">Maior carga de cada dia · passe o mouse ou toque para ver o valor</p>
                      </div>
                      {sessions.length > 1 && (
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold', change >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger')}>
                          {change >= 0 ? <TrendingUp size={14} aria-hidden /> : <TrendingDown size={14} aria-hidden />}
                          {change > 0 ? '+' : ''}{formatDecimal(change)}%
                        </span>
                      )}
                    </div>
                    {sessions.length > 1 ? (
                      <WeightChart points={points} />
                    ) : (
                      <p className="py-6 text-center text-sm text-muted">Registre esse exercício em mais um dia para ver o gráfico.</p>
                    )}
                  </Card>

                  <section className="flex flex-col gap-2">
                    <SectionTitle title="Sessões recentes" />
                    <Card className="overflow-hidden">
                      {sessions.slice(-10).reverse().map((session, index) => (
                        <div key={session.dateKey}>
                          {index > 0 && <div className="mx-4 h-px bg-border" />}
                          <div className="flex items-center gap-3 px-4 py-3">
                            <span className="flex-1 text-base">{formatDate(session.date, { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                            {session.weight === record && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-premium/15 px-2 py-0.5 text-xs font-semibold text-premium">
                                <Award size={12} aria-hidden />
                                Recorde
                              </span>
                            )}
                            <span className="text-base font-semibold tabular-nums">{formatWeight(session.weight)} kg</span>
                          </div>
                        </div>
                      ))}
                    </Card>
                    {sessions.length > 10 && <p className="text-center text-xs text-subtle">Mostrando as últimas 10 de {sessions.length} sessões</p>}
                  </section>
                </div>
              </>
            )}
          </>
        )}
      </Page>
    </>
  )
}
