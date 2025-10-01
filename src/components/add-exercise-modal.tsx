import { useState } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { Button } from './button'
import { exerciseLibrary } from '../data/exercise-library'

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

  const handleAddExercise = async () => {
    try {
      const [minutes, seconds] = tempoIntervalo.split(':').map(Number)
      const totalBreakTime = minutes * 60 + seconds

      const exercisesRef = collection(db, 'treinos', workoutId, 'exercicios')
      await addDoc(exercisesRef, {
        titulo,
        series,
        repeticoes,
        peso,
        tempoIntervalo: totalBreakTime, // Salva em segundos
      })
      onClose()
    } catch (err) {
      console.error('Erro ao adicionar exercício:', err)
      alert('Erro ao adicionar exercício.')
    }
  }

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-60">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 overflow-y-auto max-h-screen">
        <h2 className="text-xl font-bold mb-4">Adicionar Exercício</h2>

        <form className="space-y-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2" htmlFor="exercise-select">
              Escolher exercício:
            </label>
            <select
              id="exercise-select"
              value={selectedExerciseId}
              onChange={(e) => handleSelectExercise(e.target.value)}
              className="w-full border rounded px-3 py-2 bg-white"
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
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">ou preencher manualmente</span>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2" htmlFor="titulo">
              Nome do exercício:
            </label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Ex: Supino Inclinado"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2" htmlFor="series">
              Séries:
            </label>
            <input
              id="series"
              type="number"
              value={series || ''}
              onChange={(e) => setSeries(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
              placeholder="Ex: 3"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2" htmlFor="repeticoes">
              Repetições:
            </label>
            <input
              id="repeticoes"
              type="number"
              value={repeticoes || ''}
              onChange={(e) => setRepeticoes(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
              placeholder="Ex: 12"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2" htmlFor="peso">
              Peso (kg):
            </label>
            <input
              id="peso"
              type="number"
              value={peso || ''}
              onChange={(e) => setPeso(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
              placeholder="Ex: 20"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2" htmlFor="tempoIntervalo">
              Tempo de intervalo (MM:SS):
            </label>
            <input
              id="tempoIntervalo"
              type="text"
              value={tempoIntervalo}
              onChange={(e) => handleBreakTimeChange(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Ex: 01:30"
              required
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              className="bg-gray-300 hover:bg-gray-400 mr-2"
              buttonTextColor='text-gray-700'
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
    </div>
  )
}