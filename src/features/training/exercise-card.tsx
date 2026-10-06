import { Check, CircleSlash, Ellipsis, NotebookPen, Pencil, RotateCcw, StickyNote, Timer, Undo2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/button'
import { IconButton } from '../../components/ui/icon-button'
import { ProgressBar } from '../../components/ui/misc'
import { ActionSheet, type ActionItem } from '../../components/ui/sheet'
import { useToast } from '../../contexts/toast-context'
import type { Exercicio } from '../../data/get-workout-exercises'
import { finishExercise, reopenExercise, saveExerciseNote, saveExerciseProgress } from '../../data/training'
import { trackExerciseCompleted } from '../../utils/analytics'
import { cn } from '../../utils/cn'
import { formatClock, formatRest, formatWeight } from '../../utils/format'
import { ExerciseSheet } from '../workout/exercise-sheet'
import { NoteSheet } from './note-sheet'

type ExerciseCardProps = {
  exercise: Exercicio
  workoutId: string
  userId: string
  position: number
  total: number
  /** Treinador vendo o treino do aluno: só planejamento, sem executar */
  readOnly: boolean
  onFinished: () => void
  playBeep: () => void
}

/**
 * Card de um exercício (mesmo desenho e regras do app nativo).
 * Não guarda progresso em estado local: tudo vem do exercício em tempo real.
 */
export function ExerciseCard({ exercise, workoutId, userId, position, total, readOnly, onFinished, playBeep }: ExerciseCardProps) {
  const toast = useToast()
  const [menuOpen, setMenuOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const setsDoneSaved = exercise.setsDone ?? 0
  const restEndsAt = exercise.restEndsAt ?? null

  // Os botões ficam travados até o Firestore devolver o novo estado do exercício
  // (a escrita local aparece quase na hora; isso evita clique duplo contar duas séries)
  const stateKey = `${setsDoneSaved}|${restEndsAt}|${exercise.isFeito}|${exercise.isSkipped}`
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const busy = busyKey === stateKey
  const setBusy = (value: boolean) => setBusyKey(value ? stateKey : null)

  const finished = exercise.isFeito || !!exercise.isSkipped
  const resting = !finished && restEndsAt != null
  const setsDone = finished ? exercise.series : Math.min(setsDoneSaved, exercise.series)
  // A série conta como feita quando o descanso começa; ela só é gravada quando o descanso acaba
  const displayDone = finished ? exercise.series : Math.min(exercise.series, setsDoneSaved + (resting ? 1 : 0))
  const progressive = exercise.usesProgressiveWeight && exercise.progressiveSets?.length ? exercise.progressiveSets : null
  const nextSet = progressive?.[setsDoneSaved + 1]

  // ─── Timer de descanso ────────────────────────────────────────────────────
  // O fim do descanso fica salvo no exercício (restEndsAt); o tempo restante é sempre
  // recalculado a partir dele, então o timer sobrevive a trocar de aba ou recarregar a página.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!resting) return
    const tick = () => setNow(Date.now())
    const first = setTimeout(tick, 0)
    const interval = setInterval(tick, 250)
    return () => {
      clearTimeout(first)
      clearInterval(interval)
    }
  }, [resting, restEndsAt])

  const remainingMs = resting ? Math.max(0, (restEndsAt ?? 0) - now) : 0
  const restProgress = resting && exercise.tempoIntervalo > 0 ? 1 - remainingMs / (exercise.tempoIntervalo * 1000) : 0

  const fail = (message: string) => (error: unknown) => {
    if (import.meta.env.DEV) console.warn(message, error)
    setBusy(false)
    toast.error(message)
  }

  const completeSet = (fromTimer: boolean) => {
    // Evita concluir a mesma série duas vezes (clique duplo, ou clique no mesmo instante em que o timer zera)
    if (busy) return
    if (fromTimer) playBeep()
    setBusy(true)
    const next = setsDoneSaved + 1
    if (next >= exercise.series) {
      finishExercise({ workoutId, exercise, userId, skipped: false }).catch(fail('Erro ao concluir o exercício.'))
      trackExerciseCompleted(exercise.titulo)
      onFinished()
    } else {
      saveExerciseProgress(workoutId, exercise.id, next, null).catch(fail('Erro ao salvar a série.'))
    }
  }

  const handledRestEnd = useRef<number | null>(null)
  useEffect(() => {
    if (!resting || readOnly || remainingMs > 0) return
    if (handledRestEnd.current === restEndsAt) return
    handledRestEnd.current = restEndsAt
    completeSet(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resting, remainingMs, readOnly, restEndsAt])

  const startSet = () => {
    if (exercise.tempoIntervalo <= 0) {
      completeSet(false)
      return
    }
    setBusy(true)
    const startedAt = Date.now()
    setNow(startedAt)
    saveExerciseProgress(workoutId, exercise.id, setsDoneSaved, startedAt + exercise.tempoIntervalo * 1000)
      .catch(fail('Erro ao iniciar o descanso.'))
  }

  const skipExercise = () => {
    setBusy(true)
    finishExercise({ workoutId, exercise, userId, skipped: true }).catch(fail('Erro ao pular o exercício.'))
    onFinished()
  }

  const undoSet = () => {
    // Durante o descanso, desfazer cancela só a série em andamento
    if (resting) {
      saveExerciseProgress(workoutId, exercise.id, setsDoneSaved, null).catch(fail('Erro ao desfazer a série.'))
      return
    }
    reopenExercise(workoutId, exercise.id, Math.max(0, setsDone - 1)).catch(fail('Erro ao desfazer a série.'))
  }

  const resetExercise = () => {
    reopenExercise(workoutId, exercise.id, 0).catch(fail('Erro ao reiniciar o exercício.'))
  }

  const saveNote = (note: string) => {
    saveExerciseNote(workoutId, exercise.id, note).catch(fail('Erro ao salvar a anotação.'))
    toast.success(note.trim() ? 'Anotação salva' : 'Anotação removida')
  }

  const menuActions: ActionItem[] = [
    { label: 'Editar exercício', icon: Pencil, onSelect: () => setEditOpen(true) },
    { label: exercise.nota ? 'Editar anotação' : 'Adicionar anotação', icon: NotebookPen, onSelect: () => setNoteOpen(true) },
    ...(!readOnly && displayDone > 0 ? [{ label: 'Desfazer última série', icon: Undo2, onSelect: undoSet }] : []),
    ...(!readOnly && (displayDone > 0 || finished) ? [{ label: 'Reiniciar exercício', icon: RotateCcw, onSelect: resetExercise, destructive: true }] : []),
  ]

  return (
    <article
      aria-label={exercise.titulo}
      className={cn('flex h-full flex-col overflow-hidden rounded-3xl border', finished ? 'bg-primary/5 border-primary/30' : 'bg-surface border-border')}
    >
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5 scrollbar-hide">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-1.5">
          <div className="-mr-2 -mt-1 flex items-center justify-between">
            <span className="type-overline text-subtle">Exercício {position} de {total}</span>
            <div className="flex items-center gap-1">
              {finished && (
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold', exercise.isSkipped ? 'bg-surface-2 text-muted' : 'bg-primary/15 text-primary')}>
                  {exercise.isSkipped ? <CircleSlash size={12} aria-hidden /> : <Check size={12} strokeWidth={3} aria-hidden />}
                  {exercise.isSkipped ? 'Pulado' : 'Concluído'}
                </span>
              )}
              <IconButton icon={Ellipsis} label="Opções do exercício" onClick={() => setMenuOpen(true)} />
            </div>
          </div>
          <h3 className="type-title leading-8">{exercise.titulo}</h3>
        </div>

        {/* Prescrição */}
        {progressive ? (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-muted">Progressão de carga</span>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 scrollbar-hide lg:flex-wrap">
              {progressive.map((set, index) => {
                const done = index < displayDone
                const current = !finished && !resting && index === setsDoneSaved
                return (
                  <div
                    key={index}
                    className={cn(
                      'min-w-24 shrink-0 rounded-2xl border px-3.5 py-2.5',
                      current ? 'bg-primary/10 border-primary' : done ? 'bg-surface-2 border-transparent' : 'bg-surface border-border',
                    )}
                  >
                    <span className={cn('block text-xs', current ? 'font-semibold text-primary' : 'text-muted')}>
                      Série {index + 1}{done ? ' ✓' : ''}
                    </span>
                    <span className={cn('text-lg font-bold', done && 'text-muted')}>
                      {set.reps}
                      <span className="text-sm font-medium text-subtle"> × </span>
                      {formatWeight(set.weight)}
                      <span className="text-sm font-medium text-subtle"> kg</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Metric label="Séries" value={String(exercise.series)} />
            <Metric label="Repetições" value={String(exercise.repeticoes)} />
            <Metric label="Carga" value={exercise.peso > 0 ? formatWeight(exercise.peso) : '—'} suffix={exercise.peso > 0 ? 'kg' : undefined} />
          </div>
        )}

        <div className="flex items-center gap-2 text-muted">
          <Timer size={16} aria-hidden />
          <span className="text-sm">Descanso de {formatRest(exercise.tempoIntervalo)} entre as séries</span>
        </div>

        {exercise.nota && (
          <div className="flex gap-2.5 rounded-2xl bg-surface-2 p-3.5 text-muted">
            <StickyNote size={16} className="mt-0.5 shrink-0" aria-hidden />
            <p className="flex-1 whitespace-pre-line text-sm leading-5">{exercise.nota}</p>
          </div>
        )}

        {/* Progresso das séries */}
        {!readOnly && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-muted">Séries feitas</span>
              <span>{displayDone} de {exercise.series}</span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: exercise.series }, (_, index) => (
                <div key={index} className={cn('h-2 flex-1 rounded-full transition-colors', index < displayDone ? 'bg-primary' : 'bg-surface-3')} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ações (fixas no rodapé, ao alcance do polegar) */}
      <div className="flex flex-col gap-2 px-5 pb-5 pt-1">
        {readOnly ? (
          <div className="rounded-2xl bg-surface-2 px-4 py-3">
            <p className="text-center text-sm text-muted">Modo planejamento: a execução fica com o aluno.</p>
          </div>
        ) : resting ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col items-center gap-1">
              <span className="type-overline text-subtle">Descanso</span>
              <span role="timer" className="text-6xl font-bold tabular-nums">{formatClock(remainingMs / 1000)}</span>
              <span className="text-center text-sm text-muted">
                {nextSet
                  ? `Série ${displayDone} de ${exercise.series} feita · próxima: ${nextSet.reps} × ${formatWeight(nextSet.weight)} kg`
                  : `Série ${displayDone} de ${exercise.series} feita`}
              </span>
            </div>
            <ProgressBar value={restProgress} />
            <Button label="Pular descanso" variant="secondary" size="lg" onClick={() => completeSet(false)} disabled={busy} />
          </div>
        ) : finished ? (
          <div className={cn('flex h-14 items-center justify-center gap-2 rounded-2xl bg-surface-2 text-base font-semibold', exercise.isSkipped ? 'text-muted' : 'text-primary')}>
            {exercise.isSkipped ? <CircleSlash size={18} aria-hidden /> : <Check size={18} strokeWidth={3} aria-hidden />}
            {exercise.isSkipped ? 'Você pulou esse hoje' : 'Exercício concluído'}
          </div>
        ) : (
          <>
            <Button label={`Concluir ${setsDoneSaved + 1}ª série`} size="lg" onClick={startSet} disabled={busy} />
            <Button label="Não fiz esse hoje" variant="ghost" size="sm" onClick={skipExercise} disabled={busy} className="self-center" />
          </>
        )}
      </div>

      <ActionSheet open={menuOpen} onClose={() => setMenuOpen(false)} title={exercise.titulo} actions={menuActions} />
      {noteOpen && (
        <NoteSheet open onClose={() => setNoteOpen(false)} initialNote={exercise.nota ?? ''} exerciseTitle={exercise.titulo} onSave={saveNote} />
      )}
      {editOpen && <ExerciseSheet workoutId={workoutId} exercise={exercise} onClose={() => setEditOpen(false)} />}
    </article>
  )
}

function Metric({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="flex flex-1 flex-col gap-0.5 rounded-2xl bg-surface-2 px-3.5 py-3">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-2xl font-bold">
        {value}
        {suffix && <span className="text-sm font-medium text-subtle">{` ${suffix}`}</span>}
      </span>
    </div>
  )
}
