import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { Button } from './button'
import { Toast, ToastState } from './toast'

type EditWorkoutModalProps = {
  workout: { id: string; dia: string; musculo: string }
  onClose: () => void
  onSave: () => void
  disabledDays: string[] // Dias que já possuem treinos cadastrados
}

export function EditWorkoutModal({ workout, onClose, onSave, disabledDays }: EditWorkoutModalProps) {
  const [day, setDay] = useState(workout.dia)
  const [muscleGroup, setMuscleGroup] = useState(workout.musculo)
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success'
  })

  const handleSave = async () => {
    try {
      const workoutRef = doc(db, 'treinos', workout.id)
      await updateDoc(workoutRef, { dia: day, musculo: muscleGroup })
      onSave()
      onClose()
    } catch (err) {
      console.error('Erro ao salvar treino:', err)
      setToast({ show: true, message: 'Erro ao salvar treino.', type: 'error' })
    }
  }

  const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

  return (
    <div className="fixed inset-0 z-20 bg-[rgba(0,0,0,0.5)] dark:bg-[rgba(0,0,0,0.7)] flex items-center justify-center px-4">
      <div className="bg-white dark:bg-[#2d2d2d] dark:border dark:border-[#404040] rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4 dark:text-gray-100">Editar Treino</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
              Dia da Semana: <span className="text-[#27AE60] font-normal">{day}</span>
            </label>
            <div className="flex gap-1.5">
              {daysOfWeek.map((dayOption) => {
                const isDisabled = disabledDays.includes(dayOption) && dayOption !== workout.dia
                const isSelected = day === dayOption
                return (
                  <button
                    key={dayOption}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => !isDisabled && setDay(dayOption)}
                    className={`flex-1 aspect-square rounded-lg text-xs font-bold transition-all flex items-center justify-center
                      ${isSelected
                        ? 'bg-[#27AE60] text-white ring-2 ring-[#27AE60] ring-offset-2 dark:ring-offset-[#2d2d2d] shadow-md'
                        : isDisabled
                          ? 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#404040] cursor-pointer'
                      }`}
                    title={isDisabled ? `${dayOption} já tem treino` : dayOption}
                  >
                    {dayOption.charAt(0)}
                  </button>
                )
              })}
            </div>

          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Grupo Muscular:</label>
            <input
              type="text"
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              className="w-full border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 mr-2"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={handleSave}
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