import { ChevronLeft, ChevronRight, Dumbbell, Flame, Snowflake, Trophy } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { PremiumGate } from '../components/premium-gate'
import { Card } from '../components/ui/card'
import { IconButton } from '../components/ui/icon-button'
import { LoadingState, StatTile } from '../components/ui/misc'
import { Page, StackHeader } from '../components/ui/page'
import { useCurrentUser } from '../contexts/current-user-context'
import { getWorkoutDates } from '../data/logs'
import { getWeekKey } from '../data/streak-utils'
import { trackStreakCalendarViewed } from '../utils/analytics'
import { cn } from '../utils/cn'

type DayStatus = 'completed' | 'missed' | 'scheduled' | 'none'
type CalendarDay = { date: Date; status: DayStatus; isToday: boolean; isStreakWeek: boolean } | null

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const FREEZE_CAP_PREMIUM = 2
// A contagem de streak começou em 8/10/2025: antes disso nenhum dia aparece como falta
const STREAK_START = new Date(2025, 9, 8)

function buildMonth(month: Date, scheduled: number[], completed: Set<string>): CalendarDay[] {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstWeekday = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Streak é semanal: um dia agendado só é falta se a semana inteira ficou sem treino
  const weeksWithWorkout = new Set(Array.from(completed, dateString => getWeekKey(new Date(dateString))))

  const days: CalendarDay[] = Array.from({ length: firstWeekday }, () => null)
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day)
    const isStreakWeek = weeksWithWorkout.has(getWeekKey(date))
    let status: DayStatus = 'none'
    if (completed.has(date.toDateString())) status = 'completed'
    else if (scheduled.includes(date.getDay()) && date >= STREAK_START) {
      if (date < today) status = isStreakWeek ? 'none' : 'missed'
      else status = 'scheduled'
    }
    days.push({ date, status, isToday: date.getTime() === today.getTime(), isStreakWeek })
  }
  while (days.length % 7 !== 0) days.push(null)
  return days
}

const statusLabel: Record<DayStatus, string> = { completed: 'treinou', missed: 'faltou', scheduled: 'treino agendado', none: 'sem treino' }

export function StreakCalendar() {
  const usuarioID = localStorage.getItem('usuarioId')
  const profile = useCurrentUser()
  const isPremium = !!profile?.isPremium
  const [completed, setCompleted] = useState<Set<string> | null>(null)
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))

  useEffect(() => {
    if (!usuarioID || !isPremium) return
    trackStreakCalendarViewed()
    getWorkoutDates(usuarioID).then(setCompleted).catch(() => setCompleted(new Set()))
  }, [usuarioID, isPremium])

  const days = useMemo(
    () => (completed ? buildMonth(month, profile?.scheduledDays ?? [], completed) : []),
    [month, profile?.scheduledDays, completed],
  )

  if (!usuarioID) return <Navigate to="/login" replace />

  const header = <StackHeader title="Calendário de streak" backTo="/profile" />
  if (!profile) return <>{header}<LoadingState /></>
  if (!isPremium) {
    return (
      <>
        {header}
        <Page className="pt-2">
          <PremiumGate title="Calendário exclusivo do Premium" description="Veja em quais dias você treinou, as semanas que entraram na sequência e as faltas." />
        </Page>
      </>
    )
  }
  if (!completed) return <>{header}<LoadingState /></>

  const now = new Date()
  const isCurrentMonth = month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth()
  const rawMonthLabel = month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  // "outubro de 2026" -> "Outubro de 2026" (o capitalize do CSS deixaria "De" maiúsculo)
  const monthLabel = rawMonthLabel.charAt(0).toUpperCase() + rawMonthLabel.slice(1)
  const weeks = Array.from({ length: days.length / 7 }, (_, index) => days.slice(index * 7, index * 7 + 7))
  const workoutsThisMonth = days.filter(day => day?.status === 'completed').length
  const shiftMonth = (delta: number) => setMonth(current => new Date(current.getFullYear(), current.getMonth() + delta, 1))

  return (
    <>
      {header}
      <Page className="pt-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile label="Atual" value={profile.currentStreak ?? 0} suffix="sem" icon={Flame} color="var(--color-streak)" />
          <StatTile label="Recorde" value={profile.longestStreak ?? 0} suffix="sem" icon={Trophy} />
          <StatTile label="Treinos" value={profile.totalWorkouts ?? 0} icon={Dumbbell} />
          <StatTile label="Freezes" value={`${profile.freezeCount ?? 0}/${FREEZE_CAP_PREMIUM}`} icon={Snowflake} color="var(--color-info)" />
        </div>

        <Card className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <IconButton icon={ChevronLeft} variant="surface" label="Mês anterior" onClick={() => shiftMonth(-1)} />
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold">{monthLabel}</span>
              <span className="text-xs text-muted">{workoutsThisMonth} {workoutsThisMonth === 1 ? 'dia treinado' : 'dias treinados'}</span>
            </div>
            <IconButton icon={ChevronRight} variant="surface" label="Próximo mês" disabled={isCurrentMonth} onClick={() => shiftMonth(1)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex">
              {WEEKDAY_LABELS.map((label, index) => (
                <span key={index} className="flex-1 text-center text-xs font-semibold text-subtle">{label}</span>
              ))}
            </div>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className={cn('flex rounded-xl py-1', week.some(day => day?.isStreakWeek) && 'bg-streak/10')}>
                {week.map((day, dayIndex) => (
                  <div key={dayIndex} className="flex flex-1 justify-center">
                    {day && (
                      <span
                        aria-label={`${day.date.getDate()}, ${statusLabel[day.status]}`}
                        title={statusLabel[day.status]}
                        className={cn(
                          'flex size-9 items-center justify-center rounded-full text-sm sm:size-10',
                          day.status === 'completed' && 'bg-streak font-bold text-white',
                          day.status === 'missed' && 'bg-danger/10 text-danger',
                          day.status === 'scheduled' && 'border border-primary/60',
                          day.isToday && day.status !== 'completed' && 'border-2 border-foreground font-bold',
                        )}
                      >
                        {day.date.getDate()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {!isCurrentMonth && (
            <button type="button" onClick={() => setMonth(new Date(now.getFullYear(), now.getMonth(), 1))} className="self-center text-sm font-semibold text-primary hover:underline">
              Voltar para o mês atual
            </button>
          )}
        </Card>

        <Card className="flex flex-col gap-2.5 p-4">
          <Legend swatch={<span className="size-4 rounded-full bg-streak" />} label="Dia com treino" />
          <Legend swatch={<span className="size-4 rounded bg-streak/20" />} label="Semana que entrou na sequência" />
          <Legend swatch={<span className="size-4 rounded-full border border-primary/60" />} label="Dia agendado" />
          <Legend swatch={<span className="size-4 rounded-full bg-danger/15" />} label="Semana sem treino (falta)" />
        </Card>

        <p className="px-4 text-center text-xs text-subtle">
          Os dias agendados são os dias da semana em que você tem treino com exercícios cadastrados.
        </p>
      </Page>
    </>
  )
}

function Legend({ swatch, label }: { swatch: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3">
      {swatch}
      <span className="text-sm text-muted">{label}</span>
    </div>
  )
}
