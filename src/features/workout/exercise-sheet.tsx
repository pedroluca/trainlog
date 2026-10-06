import { doc, getDoc } from 'firebase/firestore'
import { BookOpen, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Switch } from '../../components/ui/list'
import { Sheet } from '../../components/ui/sheet'
import { StepperField } from '../../components/ui/stepper-field'
import { TextField } from '../../components/ui/text-field'
import { useConfirm } from '../../contexts/confirm-context'
import { useToast } from '../../contexts/toast-context'
import type { Exercise } from '../../data/exercise-library'
import type { Exercicio } from '../../data/get-workout-exercises'
import { updateScheduledDays } from '../../data/streak-utils'
import { addExercise, deleteExercise, updateExercise, type ExerciseInput, type ProgressiveSet } from '../../data/training'
import { db } from '../../firebaseConfig'
import { trackExerciseAdded, trackExerciseDeleted } from '../../utils/analytics'
import { formatRest } from '../../utils/format'
import { ExerciseLibrarySheet } from './exercise-library-sheet'

type ExerciseSheetProps = {
  workoutId: string
  /** Sem exercício = criar um novo */
  exercise?: Exercicio
  onClose: () => void
}

const DEFAULTS: ExerciseInput = { titulo: '', series: 3, repeticoes: 12, peso: 0, tempoIntervalo: 90, usesProgressiveWeight: false }

/** Ajusta a lista de séries progressivas ao número de séries, copiando a última */
function resizeSets(sets: ProgressiveSet[], count: number, fallback: ProgressiveSet): ProgressiveSet[] {
  if (sets.length === count) return sets
  if (sets.length > count) return sets.slice(0, count)
  const last = sets[sets.length - 1] ?? fallback
  return [...sets, ...Array.from({ length: count - sets.length }, () => ({ ...last }))]
}

/** Atualiza os dias agendados do dono do treino (pode ser um aluno do treinador) */
function refreshOwnerSchedule(workoutId: string) {
  getDoc(doc(db, 'treinos', workoutId))
    .then(snapshot => {
      const ownerId = snapshot.data()?.usuarioID
      if (ownerId) updateScheduledDays(ownerId)
    })
    .catch(() => {})
}

/** Criar ou editar um exercício (mesmo formulário do app nativo) */
export function ExerciseSheet({ workoutId, exercise, onClose }: ExerciseSheetProps) {
  const toast = useToast()
  const confirm = useConfirm()
  const start: ExerciseInput = exercise
    ? {
      titulo: exercise.titulo,
      series: exercise.series,
      repeticoes: exercise.repeticoes,
      peso: exercise.peso,
      tempoIntervalo: exercise.tempoIntervalo,
      usesProgressiveWeight: !!exercise.usesProgressiveWeight,
      progressiveSets: exercise.progressiveSets,
    }
    : DEFAULTS

  const [titulo, setTitulo] = useState(start.titulo)
  const [series, setSeries] = useState(start.series || 3)
  const [repeticoes, setRepeticoes] = useState(start.repeticoes)
  const [peso, setPeso] = useState(start.peso)
  const [descanso, setDescanso] = useState(start.tempoIntervalo)
  const [progressive, setProgressive] = useState(start.usesProgressiveWeight)
  const [sets, setSets] = useState<ProgressiveSet[]>(
    start.progressiveSets?.length ? start.progressiveSets : resizeSets([], start.series || 3, { reps: start.repeticoes || 10, weight: start.peso }),
  )
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const changeSeries = (value: number) => {
    setSeries(value)
    setSets(current => resizeSets(current, value, { reps: repeticoes || 10, weight: peso }))
  }

  const updateSet = (index: number, patch: Partial<ProgressiveSet>) => {
    setSets(current => current.map((set, setIndex) => (setIndex === index ? { ...set, ...patch } : set)))
  }

  const applyLibrary = (picked: Exercise) => {
    setTitulo(picked.nome)
    // Sugestão inicial pelo nível do exercício
    const preset = picked.dificuldade === 'Iniciante' ? { s: 3, r: 12 } : picked.dificuldade === 'Intermediário' ? { s: 4, r: 10 } : { s: 4, r: 8 }
    changeSeries(preset.s)
    setRepeticoes(preset.r)
    setDescanso(90)
  }

  const submit = async () => {
    if (!titulo.trim()) {
      setError('Dê um nome ao exercício.')
      return
    }
    setError(null)
    setSaving(true)
    const finalSets = resizeSets(sets, series, { reps: repeticoes || 10, weight: peso })
    const input: ExerciseInput = {
      titulo: titulo.trim(),
      series,
      repeticoes: progressive ? finalSets[0]?.reps ?? repeticoes : repeticoes,
      peso: progressive ? finalSets[0]?.weight ?? peso : peso,
      tempoIntervalo: descanso,
      usesProgressiveWeight: progressive,
      progressiveSets: progressive ? finalSets : undefined,
    }
    try {
      if (exercise) {
        await updateExercise(workoutId, exercise.id, input)
        toast.success('Exercício atualizado')
      } else {
        await addExercise(workoutId, input)
        trackExerciseAdded(input.titulo)
        refreshOwnerSchedule(workoutId)
        toast.success('Exercício adicionado')
      }
      onClose()
    } catch {
      toast.error(exercise ? 'Não foi possível salvar o exercício.' : 'Não foi possível adicionar o exercício.')
      setSaving(false)
    }
  }

  const confirmDelete = () => {
    if (!exercise) return
    confirm({
      title: 'Excluir exercício',
      message: `Excluir "${exercise.titulo}" deste treino?`,
      confirmLabel: 'Excluir',
      icon: Trash2,
      onConfirm: () => {
        onClose()
        deleteExercise(workoutId, exercise.id)
          .then(() => {
            trackExerciseDeleted()
            refreshOwnerSchedule(workoutId)
          })
          .catch(() => toast.error('Não foi possível excluir o exercício.'))
      },
    })
  }

  return (
    <>
      <Sheet
        open
        onClose={onClose}
        title={exercise ? 'Editar exercício' : 'Novo exercício'}
        footer={(
          <div className="flex gap-2">
            {exercise && <Button label="Excluir" icon={Trash2} variant="danger-soft" onClick={confirmDelete} />}
            <Button label={exercise ? 'Salvar' : 'Adicionar exercício'} className="flex-1" loading={saving} onClick={submit} />
          </div>
        )}
      >
        <div className="flex flex-col gap-5 pb-2">
          {!exercise && <Button label="Escolher da biblioteca" icon={BookOpen} variant="secondary" onClick={() => setLibraryOpen(true)} />}

          <TextField
            label="Nome do exercício"
            value={titulo}
            onChange={event => setTitulo(event.target.value)}
            placeholder="Ex.: Supino inclinado com halteres"
            maxLength={120}
            error={error}
            autoFocus={!!exercise}
          />

          <StepperField label="Séries" value={series} onChange={changeSeries} min={1} max={20} />

          <Card className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-base font-medium">Progressão de carga</span>
              <span className="text-xs text-muted">Repetições e carga diferentes em cada série</span>
            </div>
            <Switch checked={progressive} onCheckedChange={setProgressive} label="Progressão de carga" />
          </Card>

          {progressive ? (
            <div className="flex flex-col gap-3">
              {sets.slice(0, series).map((set, index) => (
                <div key={index} className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-muted">Série {index + 1}</span>
                  <div className="flex gap-2">
                    <StepperField className="flex-1" value={set.reps} onChange={reps => updateSet(index, { reps })} min={0} max={200} suffix="reps" compact />
                    <StepperField className="flex-1" value={set.weight} onChange={weight => updateSet(index, { weight })} min={0} max={2000} decimals={1} suffix="kg" compact />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <StepperField label="Repetições" value={repeticoes} onChange={setRepeticoes} min={0} max={200} />
              <StepperField label="Carga" value={peso} onChange={setPeso} min={0} max={2000} decimals={1} suffix="kg" />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <StepperField label="Descanso entre séries" value={descanso} onChange={setDescanso} step={15} min={0} max={3600} suffix="s" />
            <span className="text-xs text-subtle">{descanso > 0 ? `${formatRest(descanso)} de descanso` : 'Sem descanso: a série conta assim que você concluir'}</span>
          </div>
        </div>
      </Sheet>
      {libraryOpen && <ExerciseLibrarySheet onClose={() => setLibraryOpen(false)} onSelect={applyLibrary} />}
    </>
  )
}
