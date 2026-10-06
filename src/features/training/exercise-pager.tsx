import { useLayoutEffect, useRef, useState } from 'react'
import type { Exercicio } from '../../data/get-workout-exercises'
import { useIsDesktop } from '../../hooks/useMediaQuery'
import { cn } from '../../utils/cn'
import { ExerciseCard } from './exercise-card'

type ExercisePagerProps = {
  exercises: Exercicio[]
  workoutId: string
  userId: string
  readOnly: boolean
  playBeep: () => void
}

const isDone = (exercise: Exercicio) => exercise.isFeito || !!exercise.isSkipped

/**
 * Celular: carrossel horizontal com um card por exercício (como no app nativo).
 * Desktop: grade com o treino inteiro à vista.
 * Deve ser montado com key do treino: assim abre direto no primeiro exercício pendente.
 */
export function ExercisePager({ exercises, workoutId, userId, readOnly, playBeep }: ExercisePagerProps) {
  const isDesktop = useIsDesktop()
  const listRef = useRef<HTMLDivElement>(null)
  const [initialIndex] = useState(() => Math.max(0, exercises.findIndex(exercise => !isDone(exercise))))
  const [page, setPage] = useState(initialIndex)

  const itemAt = (index: number) => listRef.current?.children[index] as HTMLElement | undefined

  const goTo = (index: number, behavior: ScrollBehavior = 'smooth') => {
    const list = listRef.current
    const item = itemAt(index)
    if (!list || !item) return
    if (isDesktop) {
      item.scrollIntoView({ behavior, block: 'nearest' })
      return
    }
    // Todos os cards têm a mesma largura: o card N começa em N × (largura + espaço)
    list.scrollTo({ left: index * (item.offsetWidth + gapOf(list)), behavior })
  }

  // Abre no primeiro exercício pendente, sem animação
  useLayoutEffect(() => {
    if (!isDesktop && initialIndex > 0) goTo(initialIndex, 'instant')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop])

  const onScroll = () => {
    const list = listRef.current
    const first = itemAt(0)
    if (!list || !first) return
    const index = Math.round(list.scrollLeft / (first.offsetWidth + gapOf(list)))
    setPage(Math.min(exercises.length - 1, Math.max(0, index)))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={listRef}
        onScroll={isDesktop ? undefined : onScroll}
        className={cn(
          // Celular: cada card ocupa a largura toda e trava no centro ao arrastar
          'flex min-h-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 scrollbar-hide',
          // Desktop: grade, a página rola na vertical
          'lg:grid lg:snap-none lg:grid-cols-2 lg:gap-4 lg:overflow-visible lg:px-0 2xl:grid-cols-3',
        )}
      >
        {exercises.map((exercise, index) => (
          <div key={exercise.id} className="w-full shrink-0 snap-center lg:min-h-[440px]">
            <ExerciseCard
              exercise={exercise}
              workoutId={workoutId}
              userId={userId}
              position={index + 1}
              total={exercises.length}
              readOnly={readOnly}
              playBeep={playBeep}
              onFinished={() => setTimeout(() => goTo(index + 1), 350)}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-1.5 pb-3 lg:hidden" aria-label={`Exercício ${page + 1} de ${exercises.length}`}>
        {exercises.map((exercise, index) => (
          <button
            key={exercise.id}
            type="button"
            aria-label={`Ir para o exercício ${index + 1}`}
            onClick={() => goTo(index)}
            className={cn(
              'h-1.5 rounded-full transition-all',
              index === page ? 'w-5 bg-primary' : isDone(exercise) ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-surface-3',
            )}
          />
        ))}
      </div>
    </div>
  )
}

function gapOf(element: HTMLElement) {
  return parseFloat(getComputedStyle(element).columnGap) || 0
}
