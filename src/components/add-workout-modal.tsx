import { useState } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'

type Props = {
  currentDay: string
  onClose: () => void
  usuarioID: string | null
}

export function AddWorkoutModal({ onClose, currentDay, usuarioID }: Props) {
  const [musculo, setMusculo] = useState('')

  const handleAddWorkout = async () => {
    try {
      const workoutRef = collection(db, 'treinos')
      await addDoc(workoutRef, { musculo, dia: currentDay, usuarioID })
      onClose()
      alert('Treino adicionado com sucesso!')
    } catch (err) {
      console.error('Erro ao adicionar treino:', err)
      alert('Erro ao adicionar treino.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">Adicionar Treino</h2>
        <input
          type="text"
          value={musculo}
          onChange={(e) => setMusculo(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
          placeholder="Ex: Peito, Costas, Pernas"
        />
        <div className="flex justify-end">
          <button className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded mr-2" onClick={onClose}>
            Cancelar
          </button>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded" onClick={handleAddWorkout}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}