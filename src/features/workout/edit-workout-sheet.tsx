import { doc, onSnapshot } from 'firebase/firestore'
import { ChevronDown, ChevronUp, Plus, RotateCcw, Share2, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { IconButton } from '../../components/ui/icon-button'
import { ListRow, ListSection } from '../../components/ui/list'
import { Callout, LoadingState } from '../../components/ui/misc'
import { SectionTitle } from '../../components/ui/page'
import { Sheet } from '../../components/ui/sheet'
import { TextField } from '../../components/ui/text-field'
import { useConfirm } from '../../contexts/confirm-context'
import { useToast } from '../../contexts/toast-context'
import { getUserWorkouts, type Treino } from '../../data/get-user-workouts'
import type { Exercicio } from '../../data/get-workout-exercises'
import { updateScheduledDays } from '../../data/streak-utils'
import {
  deleteExercise,
  deleteWorkoutWithExercises,
  resetWorkoutExercises,
  sortExercises,
  subscribeWorkoutExercises,
  updateWorkout,
} from '../../data/training'
import { WEEK_DAYS } from '../../data/week-days'
import { db } from '../../firebaseConfig'
import { trackWorkoutDeleted, trackWorkoutEdited } from '../../utils/analytics'
import { cn } from '../../utils/cn'
import { formatRest, formatWeight, getLocalDateKey } from '../../utils/format'
import { ExerciseSheet } from './exercise-sheet'
import { ShareWorkoutSheet } from './share-workout-sheet'

type Props = {
  workoutId: string
  /** Usuário logado */
  viewerId: string
  onClose: () => void
}

type SubSheet = { type: 'new-exercise' } | { type: 'edit-exercise'; exercise: Exercicio } | { type: 'share' }

/** Editar treino: nome, dia, ordem e lista de exercícios, mais as ações do treino */
export function EditWorkoutSheet({ workoutId, viewerId, onClose }: Props) {
  const toast = useToast()
  const confirm = useConfirm()

  const [workout, setWorkout] = useState<Treino | null | undefined>(undefined)
  const [exercises, setExercises] = useState<Exercicio[] | null>(null)
  const [takenDays, setTakenDays] = useState<Set<string>>(new Set())
  const [name, setName] = useState<string | null>(null)
  const [day, setDay] = useState<string | null>(null)
  const [order, setOrder] = useState<string[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [subSheet, setSubSheet] = useState<SubSheet | null>(null)

  useEffect(() => onSnapshot(
    doc(db, 'treinos', workoutId),
    snapshot => setWorkout(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Treino) : null),
    () => setWorkout(null),
  ), [workoutId])

  useEffect(() => subscribeWorkoutExercises(workoutId, setExercises, () => setExercises([])), [workoutId])

  const ownerId = workout?.usuarioID
  useEffect(() => {
    if (!ownerId) return
    getUserWorkouts(ownerId)
      .then(list => setTakenDays(new Set(list.filter(item => item.id !== workoutId).map(item => item.dia))))
      .catch(() => {})
  }, [ownerId, workoutId])

  // Rascunho local: começa com o que está salvo e só grava ao clicar em "Salvar"
  const currentName = name ?? workout?.musculo ?? ''
  const currentDay = day ?? workout?.dia ?? ''
  const sorted = useMemo(() => sortExercises(exercises ?? [], order ?? workout?.exerciseOrder), [exercises, order, workout?.exerciseOrder])

  const move = (index: number, direction: -1 | 1) => {
    const ids = sorted.map(exercise => exercise.id)
    const target = index + direction
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    setOrder(ids)
  }

  const hasChanges = (name !== null && name.trim() !== workout?.musculo) || (day !== null && day !== workout?.dia) || order !== null

  const save = async () => {
    if (!workout) return
    if (!currentName.trim()) {
      toast.error('O treino precisa de um nome.')
      return
    }
    setSaving(true)
    try {
      await updateWorkout(workout.id, { musculo: currentName.trim(), dia: currentDay, exerciseOrder: sorted.map(exercise => exercise.id) })
      if (day !== null && day !== workout.dia) updateScheduledDays(workout.usuarioID)
      trackWorkoutEdited()
      toast.success('Treino atualizado')
      onClose()
    } catch {
      toast.error('Não foi possível salvar as alterações.')
      setSaving(false)
    }
  }

  const confirmDeleteExercise = (exercise: Exercicio) => {
    confirm({
      title: 'Excluir exercício',
      message: `Excluir "${exercise.titulo}" deste treino?`,
      confirmLabel: 'Excluir',
      icon: Trash2,
      onConfirm: () => {
        setOrder(current => (current ? current.filter(id => id !== exercise.id) : current))
        deleteExercise(workoutId, exercise.id).catch(() => toast.error('Não foi possível excluir o exercício.'))
      },
    })
  }

  const confirmReset = () => {
    confirm({
      title: 'Reiniciar progresso',
      message: 'Desmarcar todos os exercícios deste treino feitos hoje?',
      confirmLabel: 'Reiniciar',
      icon: RotateCcw,
      tone: 'warning',
      onConfirm: () => resetWorkoutExercises(workoutId)
        .then(() => {
          // Permite comemorar de novo se o treino for concluído outra vez hoje
          localStorage.removeItem(`workout-completed-${workoutId}-${getLocalDateKey()}`)
          toast.success('Progresso reiniciado')
        })
        .catch(() => toast.error('Não foi possível reiniciar.')),
    })
  }

  const confirmDeleteWorkout = () => {
    if (!workout) return
    confirm({
      title: 'Excluir treino',
      message: `Excluir "${workout.musculo}" e todos os exercícios dele? Essa ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      icon: Trash2,
      onConfirm: async () => {
        try {
          await deleteWorkoutWithExercises(workout.id)
          updateScheduledDays(workout.usuarioID)
          trackWorkoutDeleted()
          onClose()
        } catch {
          toast.error('Não foi possível excluir o treino.')
        }
      },
    })
  }

  const canEdit = !!workout && (workout.usuarioID === viewerId || workout.createdByUserId === viewerId)

  return (
    <>
      <Sheet
        open
        onClose={onClose}
        title="Editar treino"
        footer={canEdit ? (
          <div className="flex gap-2">
            <Button label="Cancelar" variant="secondary" className="flex-1" onClick={onClose} disabled={saving} />
            <Button label="Salvar alterações" className="flex-1" loading={saving} disabled={!hasChanges} onClick={save} />
          </div>
        ) : undefined}
      >
        {workout === undefined ? (
          <LoadingState />
        ) : workout === null ? (
          <Callout tone="warning">Este treino não existe mais.</Callout>
        ) : (
          <div className="flex flex-col gap-6 pb-2">
            {!canEdit && <Callout tone="info">Este treino foi criado por outra pessoa; só ela pode alterá-lo.</Callout>}

            <TextField label="Nome do treino" value={currentName} onChange={event => setName(event.target.value)} placeholder="Ex.: Peito e Tríceps" maxLength={80} disabled={!canEdit} />

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-muted">Dia da semana</span>
              <div role="radiogroup" aria-label="Dia da semana" className="flex gap-1.5">
                {WEEK_DAYS.map(weekDay => {
                  const selected = weekDay === currentDay
                  const taken = takenDays.has(weekDay) && weekDay !== workout.dia
                  return (
                    <button
                      key={weekDay}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`${weekDay}${taken ? ', já tem treino' : ''}`}
                      title={taken ? `${weekDay} já tem treino` : weekDay}
                      disabled={taken || !canEdit}
                      onClick={() => setDay(weekDay)}
                      className={cn(
                        'flex h-11 flex-1 items-center justify-center rounded-xl border text-sm font-semibold transition-colors focus-ring',
                        selected ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface text-foreground hover:bg-surface-2',
                        taken && 'opacity-35',
                      )}
                    >
                      {weekDay.slice(0, 3)}
                    </button>
                  )
                })}
              </div>
              <span className="text-xs text-subtle">Dias apagados já têm outro treino.</span>
            </div>

            <section className="flex flex-col gap-2">
              <SectionTitle
                title={`Exercícios${exercises ? ` · ${exercises.length}` : ''}`}
                action={canEdit ? (
                  <Button label="Adicionar" icon={Plus} variant="ghost" size="sm" className="-my-2 -mr-2" onClick={() => setSubSheet({ type: 'new-exercise' })} />
                ) : undefined}
              />
              {exercises === null ? (
                <LoadingState className="py-8" />
              ) : sorted.length === 0 ? (
                <Card className="p-4">
                  <p className="text-center text-sm text-muted">Nenhum exercício ainda.</p>
                </Card>
              ) : (
                <Card className="overflow-hidden">
                  {sorted.map((exercise, index) => (
                    <div key={exercise.id}>
                      {index > 0 && <div className="mx-4 h-px bg-border" />}
                      <div className="flex items-center gap-1 py-2 pl-4 pr-2">
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => setSubSheet({ type: 'edit-exercise', exercise })}
                          className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg py-1.5 text-left focus-ring enabled:hover:text-primary"
                        >
                          <span className="truncate text-base font-medium">{exercise.titulo}</span>
                          <span className="text-xs text-muted">
                            {exercise.usesProgressiveWeight && exercise.progressiveSets?.length
                              ? `${exercise.series} séries com progressão`
                              : `${exercise.series} × ${exercise.repeticoes}${exercise.peso ? ` · ${formatWeight(exercise.peso)} kg` : ''}`}
                            {` · ${formatRest(exercise.tempoIntervalo)}`}
                          </span>
                        </button>
                        {canEdit && (
                          <>
                            <IconButton icon={ChevronUp} size={36} iconSize={18} label="Mover para cima" disabled={index === 0} onClick={() => move(index, -1)} />
                            <IconButton icon={ChevronDown} size={36} iconSize={18} label="Mover para baixo" disabled={index === sorted.length - 1} onClick={() => move(index, 1)} />
                            <IconButton icon={Trash2} size={36} iconSize={18} label="Excluir exercício" className="text-danger" onClick={() => confirmDeleteExercise(exercise)} />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </section>

            <ListSection title="Ações">
              <ListRow title="Compartilhar treino" icon={Share2} onClick={() => setSubSheet({ type: 'share' })} />
              {canEdit && <ListRow title="Reiniciar progresso de hoje" icon={RotateCcw} iconColor="var(--color-warning)" onClick={confirmReset} />}
              {canEdit && <ListRow title="Excluir treino" icon={Trash2} destructive onClick={confirmDeleteWorkout} />}
            </ListSection>
          </div>
        )}
      </Sheet>

      {subSheet?.type === 'new-exercise' && <ExerciseSheet workoutId={workoutId} onClose={() => setSubSheet(null)} />}
      {subSheet?.type === 'edit-exercise' && <ExerciseSheet workoutId={workoutId} exercise={subSheet.exercise} onClose={() => setSubSheet(null)} />}
      {subSheet?.type === 'share' && workout && <ShareWorkoutSheet workout={workout} onClose={() => setSubSheet(null)} />}
    </>
  )
}
