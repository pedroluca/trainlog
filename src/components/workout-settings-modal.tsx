import { useState, useRef } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { Button } from './button'
import { Toast, ToastState } from './toast'
import { GripVertical, IterationCw, Plus, X } from 'lucide-react'
import { Exercicio } from '../data/get-workout-exercises'
import { Treino } from '../data/get-user-workouts'

type WorkoutSettingsModalProps = {
  workout: Treino
  exercises: Exercicio[]
  onClose: () => void
  onSave: () => void
  onResetExercises: () => void
  onAddExercise: () => void
}

export function WorkoutSettingsModal({
  workout,
  exercises,
  onClose,
  onSave,
  onResetExercises,
  onAddExercise
}: WorkoutSettingsModalProps) {
  const [workoutName, setWorkoutName] = useState(workout.musculo || '')
  // O estado local dos exercícios dita a ordem mostrada na lista e salva
  const [orderedExercises, setOrderedExercises] = useState<Exercicio[]>([...exercises])
  
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success'
  })
  const [isLoading, setIsLoading] = useState(false)

  // Para o Drag and Drop nativo
  const dragItemIndex = useRef<number | null>(null)
  const dragOverItemIndex = useRef<number | null>(null)

  const handleDragStart = (index: number) => {
    dragItemIndex.current = index
  }

  const handleDragEnter = (index: number) => {
    dragOverItemIndex.current = index
  }

  const handleDragEnd = () => {
    if (dragItemIndex.current === null || dragOverItemIndex.current === null) return
    
    // Nenhuma mudança
    if (dragItemIndex.current === dragOverItemIndex.current) {
      dragItemIndex.current = null
      dragOverItemIndex.current = null
      return
    }

    const _orderedExercises = [...orderedExercises]
    const draggedItemContent = _orderedExercises.splice(dragItemIndex.current, 1)[0]
    _orderedExercises.splice(dragOverItemIndex.current, 0, draggedItemContent)

    dragItemIndex.current = null
    dragOverItemIndex.current = null

    setOrderedExercises(_orderedExercises)
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      const workoutRef = doc(db, 'treinos', workout.id)
      
      // Monta o array de IDs na ordem atual do state
      const newOrderIds = orderedExercises.map(ex => ex.id)
      
      const updates: any = {}
      
      if (workoutName.trim() !== workout.musculo) {
        updates.musculo = workoutName.trim()
      }
      
      updates.exerciseOrder = newOrderIds
      
      await updateDoc(workoutRef, updates)
      
      onSave() // Atualiza os dados na tela principal
    } catch (err) {
      console.error('Erro ao salvar ajustes do treino:', err)
      setToast({ show: true, message: 'Erro ao salvar ajustes.', type: 'error' })
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.5)] dark:bg-[rgba(0,0,0,0.7)] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#2d2d2d] rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-[#404040]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#404040]">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Ajustes do Treino</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#404040] text-gray-400 dark:text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          
          {/* Nome do Treino */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Nome do Treino
            </label>
            <input
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              className="w-full border border-gray-300 dark:border-[#404040] rounded-lg px-3 py-2 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#27AE60]/50 font-medium"
              placeholder="Ex: Peito e Tríceps"
            />
          </div>

          <div className="h-px w-full bg-gray-100 dark:bg-[#404040]" />

          {/* Quick Actions (moved from main screen) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Ações Rápidas
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                className="bg-gray-200 dark:bg-[#404040] border-0 hover:bg-gray-300 dark:hover:bg-[#505050] flex items-center justify-center gap-2 py-3"
                buttonTextColor="text-gray-700 dark:text-gray-200"
                onClick={() => {
                  onClose();
                  onAddExercise();
                }}
              >
                <Plus size={18} /> Adicionar
              </Button>
              <Button
                type="button"
                className="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border-0 flex items-center justify-center gap-2 py-3"
                buttonTextColor="text-red-600 dark:text-red-400"
                onClick={() => {
                  onClose();
                  onResetExercises();
                }}
              >
                <IterationCw size={18} /> Reiniciar
              </Button>
            </div>
          </div>

          <div className="h-px w-full bg-gray-100 dark:bg-[#404040]" />

          {/* Lista de Exercícios (Reordenação) */}
          <div>
            <label className="flex justify-between items-center text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              <span>Ordem dos Exercícios</span>
              <span className="text-xs font-normal text-gray-500">Arraste para reordenar</span>
            </label>
            <div className="space-y-2">
              {orderedExercises.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-dashed border-gray-300 dark:border-[#404040]">
                  Nenhum exercício cadastrado.
                </p>
              ) : (
                orderedExercises.map((ex, index) => (
                  <div
                    key={ex.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()} // Necessário para permitir o drop
                    className="flex items-center gap-3 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#404040] p-3 rounded-lg cursor-move hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors"
                  >
                    <div className="text-gray-400 cursor-grab active:cursor-grabbing">
                      <GripVertical size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-tight">
                        {ex.titulo}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {ex.series}s × {ex.repeticoes}r - {ex.peso}kg
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 px-5 pb-5 pt-4 bg-gray-50 dark:bg-[#252525] border-t border-gray-100 dark:border-[#404040]">
          <Button
            type="button"
            className="flex-1 bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] disabled:opacity-50"
            buttonTextColor="text-gray-700 dark:text-gray-200"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="flex-1 bg-[#27AE60] hover:bg-[#219150] flex items-center justify-center gap-2 disabled:opacity-75"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading && <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div>}
            <span>Salvar Ajustes</span>
          </Button>
        </div>

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
