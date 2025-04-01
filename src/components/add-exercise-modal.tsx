import { useState } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'

type Props = {
  workoutId: string
  onClose: () => void
}

export function AddExerciseModal({ onClose, workoutId }: Props) {
  const [titulo, setTitulo] = useState('')
  const [series, setSeries] = useState(0)
  const [repeticoes, setRepeticoes] = useState(0)
  const [peso, setPeso] = useState(0)
  const [tempoIntervalo, setTempoIntervalo] = useState(0)

  const handleAddExercise = async () => {
    try {
      const exercisesRef = collection(db, 'treinos', workoutId, 'exercicios')
      await addDoc(exercisesRef, { titulo, series, repeticoes, peso, tempoIntervalo })
      onClose()
      alert('Exercício adicionado com sucesso!')
    } catch (err) {
      console.error('Erro ao adicionar exercício:', err)
      alert('Erro ao adicionar exercício.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 overflow-y-auto max-h-screen">
        <h2 className="text-xl font-bold mb-4">Adicionar Exercício</h2>
        <form className="space-y-4">
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
              placeholder="Ex: Supino, Agachamento"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2" htmlFor="series">
              Séries:
            </label>
            <input
              id="series"
              type="number"
              value={series}
              onChange={(e) => setSeries(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
              placeholder="Ex: 3"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2" htmlFor="repeticoes">
              Repetições:
            </label>
            <input
              id="repeticoes"
              type="number"
              value={repeticoes}
              onChange={(e) => setRepeticoes(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
              placeholder="Ex: 12"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2" htmlFor="peso">
              Peso (kg):
            </label>
            <input
              id="peso"
              type="number"
              value={peso}
              onChange={(e) => setPeso(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
              placeholder="Ex: 20"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2" htmlFor="tempoIntervalo">
              Tempo de intervalo (min):
            </label>
            <input
              id="tempoIntervalo"
              type="number"
              value={tempoIntervalo}
              onChange={(e) => setTempoIntervalo(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
              placeholder="Ex: 1.5"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded mr-2"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={handleAddExercise}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}