import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { Treino } from '../data/get-user-workouts'

type EditWorkoutModalProps = {
  workout: Treino
  onClose: () => void
  onSave: () => void
}

export function EditWorkoutModal({ workout, onClose, onSave }: EditWorkoutModalProps) {
  const [musculo, setMusculo] = useState(workout.musculo)
  const [dia, setDia] = useState(workout.dia)

  const handleSave = async () => {
    try {
      const workoutRef = doc(db, 'treinos', workout.id)
      await updateDoc(workoutRef, { musculo, dia })
      onSave()
    } catch (err) {
      console.error('Erro ao atualizar treino:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Editar Treino</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Músculo:</label>
            <input
              type="text"
              value={musculo}
              onChange={(e) => setMusculo(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">Dia:</label>
            <select
              value={dia}
              onChange={(e) => setDia(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="Domingo">Domingo</option>
              <option value="Segunda-feira">Segunda-feira</option>
              <option value="Terça-feira">Terça-feira</option>
              <option value="Quarta-feira">Quarta-feira</option>
              <option value="Quinta-feira">Quinta-feira</option>
              <option value="Sexta-feira">Sexta-feira</option>
              <option value="Sábado">Sábado</option>
            </select>
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
              onClick={handleSave}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}