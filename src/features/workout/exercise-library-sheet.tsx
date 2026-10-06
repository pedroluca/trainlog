import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Chip, ChipRow } from '../../components/ui/misc'
import { Sheet } from '../../components/ui/sheet'
import { exerciseLibrary, getMuscleGroups, type Exercise, type MuscleGroup } from '../../data/exercise-library'
import { normalizeText } from '../../data/week-days'
import { trackExerciseLibraryOpened } from '../../utils/analytics'

type Props = {
  onClose: () => void
  onSelect: (exercise: Exercise) => void
}

const muscleGroups = getMuscleGroups()

/** Biblioteca de exercícios com busca (ignora acentos) e filtro por músculo */
export function ExerciseLibrarySheet({ onClose, onSelect }: Props) {
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState<MuscleGroup | 'all'>('all')

  useEffect(() => {
    trackExerciseLibraryOpened()
  }, [])

  const filtered = useMemo(() => {
    const term = normalizeText(search)
    return exerciseLibrary.filter(exercise => {
      const matchesMuscle = muscle === 'all' || exercise.musculos.includes(muscle)
      const matchesSearch = !term
        || normalizeText(exercise.nome).includes(term)
        || exercise.musculos.some(item => normalizeText(item).includes(term))
        || normalizeText(exercise.equipamento).includes(term)
      return matchesMuscle && matchesSearch
    })
  }, [search, muscle])

  return (
    <Sheet open onClose={onClose} title="Biblioteca de exercícios" size="lg" contentClassName="px-0">
      <div className="flex flex-col gap-3 px-5 pb-3">
        <label className="flex h-11 items-center gap-2 rounded-xl border border-transparent bg-surface-2 px-3.5 focus-within:border-primary">
          <Search size={18} className="shrink-0 text-subtle" aria-hidden />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar por nome, músculo ou equipamento"
            aria-label="Buscar exercício"
            autoFocus
            className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-subtle"
          />
        </label>
        <ChipRow>
          <Chip label="Todos" selected={muscle === 'all'} onClick={() => setMuscle('all')} />
          {muscleGroups.map(group => (
            <Chip key={group} label={group} selected={muscle === group} onClick={() => setMuscle(group)} />
          ))}
        </ChipRow>
      </div>

      <div className="min-h-[40dvh]">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-muted">Nenhum exercício encontrado.</p>
        ) : (
          filtered.map((item, index) => (
            <div key={item.id}>
              {index > 0 && <div className="mx-5 h-px bg-border" />}
              <button
                type="button"
                onClick={() => {
                  onSelect(item)
                  onClose()
                }}
                className="flex w-full flex-col gap-1 px-5 py-3 text-left transition-colors hover:bg-surface-2 focus-ring focus-visible:-outline-offset-2"
              >
                <span className="text-base font-semibold">{item.nome}</span>
                <span className="text-xs text-muted">{item.musculos.join(', ')} · {item.equipamento} · {item.dificuldade}</span>
              </button>
            </div>
          ))
        )}
      </div>
    </Sheet>
  )
}
