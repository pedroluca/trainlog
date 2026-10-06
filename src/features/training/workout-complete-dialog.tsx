import { Flame } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Spinner } from '../../components/ui/misc'
import type { StreakUpdateResult } from '../../data/streak-utils'
import { cn } from '../../utils/cn'

const HEADLINES = ['Mandou bem!', 'Treino concluído!', 'Arrasou!', 'Mais um pra conta!']

type Props = {
  open: boolean
  workoutName: string
  /** null enquanto a streak ainda está sendo atualizada */
  result: StreakUpdateResult | null
  onClose: () => void
}

export function WorkoutCompleteDialog({ open, workoutName, result, onClose }: Props) {
  const [headline] = useState(() => HEADLINES[Math.floor(Math.random() * HEADLINES.length)])
  const [revealed, setRevealed] = useState(false)

  // Quando a semana entra na sequência, mostra o valor anterior e "sobe" para o novo
  const animateIncrement = !!result?.streakIncremented
  useEffect(() => {
    if (!open || !animateIncrement) return
    const timer = setTimeout(() => setRevealed(true), 650)
    return () => clearTimeout(timer)
  }, [open, animateIncrement])

  const displayStreak = !result
    ? null
    : animateIncrement && !revealed ? Math.max(0, result.currentStreak - 1) : result.currentStreak

  return (
    <Dialog open={open} onClose={onClose} animation="pop" label="Treino concluído">
      <div className="flex flex-col items-center gap-4 pt-2 text-center">
        <div className="flex flex-col items-center">
          {/* Só o círculo pulsa quando a streak sobe */}
          <div
            className={cn('flex size-20 items-center justify-center rounded-full bg-streak/12 text-streak', revealed && 'animate-streak-bump')}
          >
            <Flame size={40} fill="currentColor" aria-hidden />
          </div>
          <div className="mt-2 flex h-9 items-center justify-center">
            {displayStreak === null ? (
              <Spinner className="text-streak" />
            ) : (
              <span className="text-3xl font-bold text-streak tabular-nums">
                {displayStreak} {displayStreak === 1 ? 'semana' : 'semanas'}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <h2 className="type-title">{headline}</h2>
          <p className="text-sm text-muted">Você completou todos os exercícios de</p>
          <p className="text-base font-semibold">{workoutName}</p>
          {!!result?.totalWorkouts && <p className="mt-0.5 text-xs text-subtle">Treino nº {result.totalWorkouts}</p>}
        </div>

        {result && (
          <div className="self-stretch rounded-2xl bg-surface-2 px-4 py-3">
            <p className="text-sm font-medium">
              {result.streakIncremented ? 'Mais uma semana na sequência.' : 'Semana já garantida na sua sequência.'}
            </p>
          </div>
        )}

        <Button label="Fechar" onClick={onClose} fullWidth autoFocus />
      </div>
    </Dialog>
  )
}
