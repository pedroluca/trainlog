import { CalendarPlus, ListPlus, Plus, Settings2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import beepSound from '../../assets/beep.mp3'
import { IconButton } from '../../components/ui/icon-button'
import { Chip, ChipRow, EmptyState, ProgressBar, Skeleton } from '../../components/ui/misc'
import type { Exercicio } from '../../data/get-workout-exercises'
import { updateStreak, type StreakUpdateResult } from '../../data/streak-utils'
import { useKeepScreenOn } from '../../hooks/useKeepScreenOn'
import { trackWorkoutCompleted } from '../../utils/analytics'
import { getLocalDateKey } from '../../utils/format'
import { DayStrip } from './day-strip'
import { ExercisePager } from './exercise-pager'
import { useTrainingData } from './use-training-data'
import { EditWorkoutSheet } from '../workout/edit-workout-sheet'
import { ExerciseSheet } from '../workout/exercise-sheet'
import { NewWorkoutSheet } from '../workout/new-workout-sheet'
import { WorkoutCompleteDialog } from './workout-complete-dialog'

type TrainingViewProps = {
  /** Usuário logado */
  viewerId: string
  /** Dono dos treinos (o próprio usuário ou um aluno) */
  ownerId: string
  audioEnabled: boolean
  /** Para o diálogo de conclusão, caso a atualização da streak falhe */
  fallbackStreak: StreakUpdateResult
}

const isDoneToday = (exercise: Exercicio) =>
  (exercise.isFeito || !!exercise.isSkipped) && !!exercise.lastDoneDate && getLocalDateKey(new Date(exercise.lastDoneDate)) === getLocalDateKey()

// Mesma chave usada antes do redesign, para não comemorar de novo o mesmo treino no mesmo dia
const celebrationKey = (workoutId: string) => `workout-completed-${workoutId}-${getLocalDateKey()}`

type Completion = { workoutName: string; result: StreakUpdateResult | null }

export function TrainingView({ viewerId, ownerId, audioEnabled, fallbackStreak }: TrainingViewProps) {
  const managing = ownerId !== viewerId
  const [dayIndex, setDayIndex] = useState(() => new Date().getDay())
  const { loading, day, dayWorkouts, workout, exercises, selectWorkout, creatorLabel, daysWithWorkout, dayTakenByOther } = useTrainingData({
    userId: ownerId,
    managerId: managing ? viewerId : undefined,
    dayIndex,
  })

  const [modal, setModal] = useState<'workout' | 'exercise' | 'settings' | null>(null)

  const beep = () => {
    if (!audioEnabled) return
    const audio = new Audio(beepSound)
    audio.volume = 0.5
    audio.play().catch(() => {})
  }

  // Tela sempre ligada enquanto treina
  useKeepScreenOn(!managing && !!exercises?.length)

  // ─── Treino concluído: atualiza streak e comemora uma vez por dia ─────────
  const [completion, setCompletion] = useState<Completion | null>(null)
  const allDone = !managing && !!exercises?.length && exercises.every(isDoneToday)
  const workoutId = workout?.id
  const workoutName = workout?.musculo ?? ''
  const workoutDay = workout?.dia ?? ''
  const exerciseCount = exercises?.length ?? 0

  useEffect(() => {
    if (!allDone || !workoutId) return
    const key = celebrationKey(workoutId)
    if (localStorage.getItem(key) === 'true') return
    localStorage.setItem(key, 'true')

    trackWorkoutCompleted(workoutDay, exerciseCount)
    let active = true
    // O diálogo abre logo e a streak chega em seguida (a escrita da streak é uma transação no servidor)
    const opening = setTimeout(() => active && setCompletion({ workoutName, result: null }), 0)
    updateStreak(viewerId).then(result => {
      if (active) setCompletion({ workoutName, result: result ?? fallbackStreak })
    })
    return () => {
      active = false
      clearTimeout(opening)
    }
    // Só reage à conclusão do treino; os outros valores são lidos no momento
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, workoutId])

  const doneCount = exercises?.filter(exercise => exercise.isFeito || exercise.isSkipped).length ?? 0

  const creator = workout ? creatorLabel(workout) : null

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="px-4 lg:px-0">
        <DayStrip selected={dayIndex} onSelect={setDayIndex} daysWithWorkout={daysWithWorkout} />
      </div>

      {loading ? (
        <div className="flex flex-1 flex-col gap-3 px-4 lg:px-0">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mb-4 min-h-80 flex-1 rounded-3xl" />
        </div>
      ) : !workout ? (
        <div className="flex flex-1 flex-col justify-center px-4 lg:px-0">
          {dayTakenByOther ? (
            <EmptyState
              icon={CalendarPlus}
              title={`Esse aluno já tem treino na ${day.toLowerCase()}`}
              description="Ele foi criado por outra pessoa. Para evitar conflito, não é possível criar outro treino nesse dia."
            />
          ) : (
            <EmptyState
              icon={CalendarPlus}
              title={`Nenhum treino para ${day.toLowerCase()}`}
              description="Crie um treino do zero, escolha um modelo pronto ou use um código de compartilhamento."
              actionLabel="Adicionar treino"
              onAction={() => setModal('workout')}
            />
          )}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {dayWorkouts.length > 1 && (
            <ChipRow className="px-4 lg:px-0">
              {dayWorkouts.map(item => (
                <Chip key={item.id} label={item.musculo} selected={item.id === workout.id} onClick={() => selectWorkout(item.id)} />
              ))}
            </ChipRow>
          )}

          <div className="flex items-start gap-2 px-4 lg:px-0">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <h2 className="type-title line-clamp-2">{workout.musculo}</h2>
              <p className="text-sm text-muted">
                {[creator && `Criado por ${creator}`, exercises && `${exercises.length} ${exercises.length === 1 ? 'exercício' : 'exercícios'}`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <IconButton icon={Plus} variant="surface" label="Adicionar exercício" onClick={() => setModal('exercise')} />
            <IconButton icon={Settings2} variant="surface" label="Editar treino" onClick={() => setModal('settings')} />
          </div>

          {!managing && !!exercises?.length && (
            <div className="flex flex-col gap-1.5 px-4 lg:px-0">
              <ProgressBar value={doneCount / exercises.length} />
              <span className="text-xs text-muted">{doneCount} de {exercises.length} concluídos hoje</span>
            </div>
          )}

          {exercises === null ? (
            <div className="flex flex-1 px-4 pb-4 lg:px-0">
              <Skeleton className="min-h-80 flex-1 rounded-3xl" />
            </div>
          ) : exercises.length === 0 ? (
            <div className="flex flex-1 flex-col justify-center px-4 lg:px-0">
              <EmptyState
                icon={ListPlus}
                title="Treino sem exercícios"
                description="Adicione os exercícios com séries, repetições, carga e descanso."
                actionLabel="Adicionar exercício"
                onAction={() => setModal('exercise')}
              />
            </div>
          ) : (
            <ExercisePager
              key={workout.id}
              exercises={exercises}
              workoutId={workout.id}
              userId={viewerId}
              readOnly={managing}
              playBeep={beep}
            />
          )}
        </div>
      )}

      {completion && (
        <WorkoutCompleteDialog
          open
          workoutName={completion.workoutName}
          result={completion.result}
          onClose={() => setCompletion(null)}
        />
      )}

      {modal === 'workout' && <NewWorkoutSheet day={day} ownerId={ownerId} createdBy={viewerId} onClose={() => setModal(null)} />}
      {modal === 'exercise' && workout && <ExerciseSheet workoutId={workout.id} onClose={() => setModal(null)} />}
      {modal === 'settings' && workout && <EditWorkoutSheet workoutId={workout.id} viewerId={viewerId} onClose={() => setModal(null)} />}
    </div>
  )
}
