import { useState, useEffect } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { Button } from './button'
import { exerciseLibrary } from '../data/exercise-library'
import { Toast, ToastState } from './toast'

type Props = {
  workoutId: string
  onClose: () => void
}

export function AddExerciseModal({ onClose, workoutId }: Props) {
  const [titulo, setTitulo] = useState('')
  const [series, setSeries] = useState(0)
  const [repeticoes, setRepeticoes] = useState(0)
  const [peso, setPeso] = useState(0)
  const [tempoIntervalo, setTempoIntervalo] = useState('')
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [usesProgressiveWeight, setUsesProgressiveWeight] = useState(false)
  const [progressiveSets, setProgressiveSets] = useState<Array<{ reps: number; weight: number }>>([])
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success'
  })

  // Sync progressive sets when series changes
  useEffect(() => {
    if (usesProgressiveWeight && series > 0) {
      setProgressiveSets(currentSets => {
        const currentLength = currentSets.length
        if (series > currentLength) {
          const newSets = Array.from({ length: series - currentLength }, () => ({
            reps: repeticoes || 10,
            weight: peso || 0
          }))
          return [...currentSets, ...newSets]
        } else if (series < currentLength) {
          return currentSets.slice(0, series)
        }
        return currentSets
      })
    }
  }, [series, usesProgressiveWeight, repeticoes, peso])

  const handleSelectExercise = (exerciseId: string) => {
    const exercise = exerciseLibrary.find(ex => ex.id === exerciseId)
    if (!exercise) return
    
    setSelectedExerciseId(exerciseId)
    setTitulo(exercise.nome)
    
    // Set default values based on difficulty
    if (exercise.dificuldade === 'Iniciante') {
      setSeries(3)
      setRepeticoes(12)
    } else if (exercise.dificuldade === 'Intermediário') {
      setSeries(4)
      setRepeticoes(10)
    } else {
      setSeries(4)
      setRepeticoes(8)
    }
    setTempoIntervalo('01:30') // Default 90 seconds
  }

  const handleBreakTimeChange = (value: string) => {
    const sanitizedValue = value.replace(/[^0-9:]/g, '').slice(0, 5)
    const formattedValue = sanitizedValue.replace(/^(\d{2})(\d{1,2})?$/, (_, m, s) => (s ? `${m}:${s}` : m))

    setTempoIntervalo(formattedValue)
  }

  const adjustBreakTime = (adjustment: number) => {
    const [minutes = 0, seconds = 0] = tempoIntervalo.split(':').map(Number)
    let totalSeconds = minutes * 60 + seconds + adjustment
    
    // Don't allow negative values
    if (totalSeconds < 0) totalSeconds = 0
    
    const newMinutes = Math.floor(totalSeconds / 60)
    const newSeconds = totalSeconds % 60
    
    setTempoIntervalo(`${String(newMinutes).padStart(2, '0')}:${String(newSeconds).padStart(2, '0')}`)
  }

  const handleAddExercise = async () => {
    try {
      const [minutes, seconds] = tempoIntervalo.split(':').map(Number)
      const totalBreakTime = minutes * 60 + seconds

      const exercisesRef = collection(db, 'treinos', workoutId, 'exercicios')
      
      const exerciseData: Record<string, unknown> = {
        titulo,
        series,
        repeticoes,
        peso,
        tempoIntervalo: totalBreakTime,
        usesProgressiveWeight
      }
      
      if (usesProgressiveWeight) {
        exerciseData.progressiveSets = progressiveSets
      }
      
      await addDoc(exercisesRef, exerciseData)
      onClose()
    } catch (err) {
      console.error('Erro ao adicionar exercício:', err)
      setToast({ show: true, message: 'Erro ao adicionar exercício.', type: 'error' })
    }
  }

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] dark:bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-60">
      <div className="bg-white dark:bg-[#2d2d2d] dark:border dark:border-[#404040] rounded-lg p-6 w-full max-w-md mx-4 overflow-y-auto max-h-screen">
        <h2 className="text-xl font-bold mb-4 dark:text-gray-100">Adicionar Exercício</h2>

        <form className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="exercise-select">
              Escolher exercício:
            </label>
            <select
              id="exercise-select"
              value={selectedExerciseId}
              onChange={(e) => handleSelectExercise(e.target.value)}
              className="w-full border dark:border-[#404040] rounded px-3 py-2 bg-white dark:bg-[#1a1a1a] dark:text-gray-100"
            >
              <option value="">-- Selecione um exercício --</option>
              {exerciseLibrary.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.nome} ({exercise.musculos.join(', ')})
                </option>
              ))}
            </select>
          </div>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-[#404040]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white dark:bg-[#2d2d2d] px-2 text-gray-500 dark:text-gray-400">ou preencher manualmente</span>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="titulo">
              Nome do exercício:
            </label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100"
              placeholder="Ex: Supino Inclinado"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="series">
              Séries:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSeries(Math.max(0, series - 1))}
                className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
              >
                -
              </button>
              <input
                id="series"
                type="number"
                value={series || ''}
                onChange={(e) => setSeries(Number(e.target.value))}
                className="flex-1 border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100 text-center"
                placeholder="Ex: 3"
                required
              />
              <button
                type="button"
                onClick={() => setSeries(series + 1)}
                className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
          
          {/* Progressive Weight Toggle */}
          <div>
            <label className='flex items-center gap-2 text-gray-700 dark:text-gray-300 font-bold cursor-pointer'>
              <input
                type='checkbox'
                checked={usesProgressiveWeight}
                onChange={(e) => {
                  setUsesProgressiveWeight(e.target.checked)
                  if (e.target.checked) {
                    // Initialize with current values
                    setProgressiveSets(
                      Array.from({ length: series || 3 }, () => ({
                        reps: repeticoes || 10,
                        weight: peso || 0
                      }))
                    )
                  }
                }}
                className='w-4 h-4'
              />
              Usar peso progressivo nas séries?
            </label>
          </div>

          {/* Progressive Sets Configuration */}
          {usesProgressiveWeight && (
            <div className='p-4 border border-gray-300 dark:border-[#404040] rounded bg-gray-50 dark:bg-[#1a1a1a]'>
              <p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>
                Configure cada série individualmente:
              </p>
              {progressiveSets.map((set, index) => (
                <div key={index} className='flex items-center gap-2 mb-2'>
                  <span className='text-gray-700 dark:text-gray-300 text-sm font-bold w-16'>
                    Série {index + 1}:
                  </span>
                  <input
                    type='number'
                    value={set.reps}
                    onChange={(e) => {
                      const newSets = [...progressiveSets]
                      newSets[index].reps = Number(e.target.value)
                      setProgressiveSets(newSets)
                    }}
                    className='w-16 border dark:border-[#404040] rounded px-2 py-1 dark:bg-[#2d2d2d] dark:text-gray-100 text-center text-sm'
                    placeholder='Reps'
                  />
                  <span className='text-gray-600 dark:text-gray-400 text-sm'>reps ×</span>
                  <input
                    type='number'
                    value={set.weight}
                    onChange={(e) => {
                      const newSets = [...progressiveSets]
                      newSets[index].weight = Number(e.target.value)
                      setProgressiveSets(newSets)
                    }}
                    className='w-16 border dark:border-[#404040] rounded px-2 py-1 dark:bg-[#2d2d2d] dark:text-gray-100 text-center text-sm'
                    placeholder='Peso'
                  />
                  <span className='text-gray-600 dark:text-gray-400 text-sm'>kg</span>
                </div>
              ))}
            </div>
          )}

          {!usesProgressiveWeight && (
            <>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="repeticoes">
              Repetições:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRepeticoes(Math.max(0, repeticoes - 1))}
                className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
              >
                -
              </button>
              <input
                id="repeticoes"
                type="number"
                value={repeticoes || ''}
                onChange={(e) => setRepeticoes(Number(e.target.value))}
                className="flex-1 border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100 text-center"
                placeholder="Ex: 12"
                required
              />
              <button
                type="button"
                onClick={() => setRepeticoes(repeticoes + 1)}
                className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="peso">
              Peso (kg):
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPeso(Math.max(0, peso - 1))}
                className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
              >
                -
              </button>
              <input
                id="peso"
                type="number"
                value={peso || ''}
                onChange={(e) => setPeso(Number(e.target.value))}
                className="flex-1 border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100 text-center"
                placeholder="Ex: 20"
                required
              />
              <button
                type="button"
                onClick={() => setPeso(peso + 1)}
                className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
            </>
          )}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="tempoIntervalo">
              Tempo de intervalo (MM:SS):
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustBreakTime(-10)}
                className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
              >
                -
              </button>
              <input
                id="tempoIntervalo"
                type="text"
                value={tempoIntervalo}
                onChange={(e) => handleBreakTimeChange(e.target.value)}
                className="flex-1 border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100 text-center"
                placeholder="Ex: 01:30"
                required
              />
              <button
                type="button"
                onClick={() => adjustBreakTime(10)}
                className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 mr-2"
              buttonTextColor='text-gray-700 dark:text-gray-300'
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={handleAddExercise}
            >
              Salvar
            </Button>
          </div>
        </form>
      </div>
      
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  )
}