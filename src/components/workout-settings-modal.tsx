import { useState } from 'react'
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { Button } from './button'
import { Toast, ToastState } from './toast'
import { ChevronDown, ChevronUp, IterationCw, Pen, Plus, Trash2, X } from 'lucide-react'
import { Exercicio } from '../data/get-workout-exercises'
import { Treino } from '../data/get-user-workouts'
import { EditExerciseModal } from './edit-exercise-modal'

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
  const [isDeleteWorkoutModalOpen, setIsDeleteWorkoutModalOpen] = useState(false)
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null)
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercicio | null>(null)

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newOrder = [...orderedExercises]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index - 1]
    newOrder[index - 1] = temp
    setOrderedExercises(newOrder)
  }

  const handleMoveDown = (index: number) => {
    if (index === orderedExercises.length - 1) return
    const newOrder = [...orderedExercises]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index + 1]
    newOrder[index + 1] = temp
    setOrderedExercises(newOrder)
  }

  const handleDeleteWorkout = async () => {
    try {
      setIsLoading(true)
      const workoutRef = doc(db, 'treinos', workout.id)
      await deleteDoc(workoutRef)
      onSave() // Atualiza os dados na tela principal
      onClose()
    } catch (err) {
      console.error('Erro ao excluir treino:', err)
      setToast({ show: true, message: 'Erro ao excluir treino.', type: 'error' })
      setIsLoading(false)
    }
  }

  const handleConfirmDeleteExercise = async () => {
    if (!exerciseToDelete) return
    try {
      setIsLoading(true)
      await deleteDoc(doc(db, 'treinos', workout.id, 'exercicios', exerciseToDelete))
      setOrderedExercises(prev => prev.filter(ex => ex.id !== exerciseToDelete))
      setExerciseToDelete(null)
    } catch (err) {
      console.error('Erro ao excluir exercício:', err)
      setToast({ show: true, message: 'Erro ao excluir.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditExerciseFinished = async () => {
    if (!exerciseToEdit) return
    try {
      setIsLoading(true)
      const docRef = doc(db, 'treinos', workout.id, 'exercicios', exerciseToEdit.id)
      const snap = await getDoc(docRef)
      if (snap.exists()) {
        const updatedData = snap.data()
        setOrderedExercises(prev => prev.map(ex => ex.id === exerciseToEdit.id ? { ...ex, ...updatedData } as Exercicio : ex))
      }
    } catch (err) {
      console.error('Erro ao recarregar exercício atualizado:', err)
    } finally {
      setIsLoading(false)
      setExerciseToEdit(null)
    }
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
              className="w-full border border-gray-300 dark:border-[#404040] rounded-lg px-3 py-2 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium mb-3"
              placeholder="Ex: Peito e Tríceps"
            />
            <Button
              type="button"
              className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border-0 flex items-center justify-center gap-2 py-2.5 transition-colors"
              buttonTextColor="text-red-600 dark:text-red-400 font-semibold text-sm"
              onClick={() => setIsDeleteWorkoutModalOpen(true)}
            >
              <Trash2 size={16} /> Excluir este treino
            </Button>
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
                <Plus size={18} /> Exercício
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
              <span className="text-xs font-normal text-gray-500">Use as setas para reordenar</span>
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
                    className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#404040] p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors shadow-sm"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-tight">
                        {ex.titulo}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {ex.series}s × {ex.repeticoes}r - {ex.peso}kg
                      </p>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                      <button
                        type="button"
                        onClick={() => setExerciseToEdit(ex)}
                        className="p-1.5 md:p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="Editar exercício"
                      >
                        <Pen size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExerciseToDelete(ex.id)}
                        className="p-1.5 md:p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Excluir exercício"
                      >
                        <Trash2 size={18} />
                      </button>
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className={`p-1 rounded border border-gray-300 dark:border-[#505050] bg-white dark:bg-[#2a2a2a] transition-colors flex items-center justify-center ${
                            index === 0
                              ? 'opacity-30 cursor-not-allowed'
                              : 'hover:bg-gray-100 dark:hover:bg-[#3a3a3a] text-gray-700 dark:text-gray-300 active:bg-gray-200 dark:active:bg-[#4a4a4a]'
                          }`}
                          title="Mover para cima"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === orderedExercises.length - 1}
                          className={`p-1 rounded border border-gray-300 dark:border-[#505050] bg-white dark:bg-[#2a2a2a] transition-colors flex items-center justify-center ${
                            index === orderedExercises.length - 1
                              ? 'opacity-30 cursor-not-allowed'
                              : 'hover:bg-gray-100 dark:hover:bg-[#3a3a3a] text-gray-700 dark:text-gray-300 active:bg-gray-200 dark:active:bg-[#4a4a4a]'
                          }`}
                          title="Mover para baixo"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
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
            className="flex-1 flex items-center justify-center gap-2 disabled:opacity-75"
            bgColor='bg-[#27AE60] hover:bg-[#219150]'
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

      {isDeleteWorkoutModalOpen && (
        <div className="fixed inset-0 z-[60] bg-[rgba(0,0,0,0.5)] dark:bg-[rgba(0,0,0,0.7)] flex items-center justify-center px-4">
          <div className="bg-white dark:bg-[#2d2d2d] rounded-lg p-6 w-80 border border-gray-200 dark:border-[#404040]">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Excluir Treino?</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">Tem certeza de que deseja excluir permanentemente o treino "{workout.musculo}"?</p>
            <div className="flex w-full gap-2">
              <Button
                type="button"
                buttonTextColor="text-gray-800 dark:text-gray-100"
                className="w-1/2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                onClick={() => setIsDeleteWorkoutModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="w-1/2 bg-red-500 hover:bg-red-600"
                onClick={handleDeleteWorkout}
                disabled={isLoading}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {exerciseToDelete && (
        <div className="fixed inset-0 z-[60] bg-[rgba(0,0,0,0.5)] dark:bg-[rgba(0,0,0,0.7)] flex items-center justify-center px-4">
          <div className="bg-white dark:bg-[#2d2d2d] rounded-lg p-6 w-80 border border-gray-200 dark:border-[#404040]">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Excluir Exercício?</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">Tem certeza de que deseja excluir este exercício?</p>
            <div className="flex w-full gap-2">
              <Button
                type="button"
                buttonTextColor="text-gray-800 dark:text-gray-100"
                className="w-1/2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                onClick={() => setExerciseToDelete(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="w-1/2 bg-red-500 hover:bg-red-600"
                onClick={handleConfirmDeleteExercise}
                disabled={isLoading}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {exerciseToEdit && (
        <EditExerciseModal
          workoutId={workout.id}
          exerciseId={exerciseToEdit.id}
          initialData={{
            title: exerciseToEdit.titulo || '',
            sets: exerciseToEdit.series || 0,
            reps: exerciseToEdit.repeticoes || 0,
            weight: exerciseToEdit.peso || 0,
            breakTime: exerciseToEdit.tempoIntervalo || 0,
            usesProgressiveWeight: exerciseToEdit.usesProgressiveWeight || false,
            progressiveSets: exerciseToEdit.progressiveSets || []
          }}
          onClose={() => setExerciseToEdit(null)}
          onEdit={handleEditExerciseFinished}
        />
      )}
    </div>
  )
}
