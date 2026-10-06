import { Flame } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCurrentUser } from '../contexts/current-user-context'
import { getWeekKey } from '../data/streak-utils'
import { cn } from '../utils/cn'

/** Contador de semanas seguidas. Fica laranja quando a semana atual já foi garantida */
export function StreakPill() {
  const profile = useCurrentUser()
  const trainedThisWeek = profile?.lastStreakWeek === getWeekKey()
  const streak = profile?.currentStreak ?? 0

  return (
    <Link
      to={profile?.isPremium ? '/profile/streak-calendar' : '/profile'}
      aria-label={`Streak de ${streak} semanas${trainedThisWeek ? ', semana garantida' : ''}`}
      title="Semanas seguidas treinando"
      className={cn(
        'inline-flex items-center gap-1.5 h-9 pl-2.5 pr-3 rounded-full transition-colors focus-ring',
        trainedThisWeek ? 'bg-streak/15 text-streak hover:bg-streak/20' : 'bg-surface-2 text-muted hover:bg-surface-3',
      )}
    >
      <Flame size={18} fill={trainedThisWeek ? 'currentColor' : 'transparent'} aria-hidden />
      <span className="text-base font-bold tabular-nums">{streak}</span>
    </Link>
  )
}
