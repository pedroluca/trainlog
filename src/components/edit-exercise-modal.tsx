import { useState, useEffect } from 'react'
import { doc, updateDoc, deleteDoc, deleteField } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { Button } from './button'
import { Toast, ToastState } from './toast'
import { Minus, Plus, Trash2 } from 'lucide-react'

type EditExerciseModalProps = {
  workoutId: string
  exerciseId: string
  initialData: {
    title: string
    sets: number
    reps: number
    weight: number
    breakTime: number
    usesProgressiveWeight: boolean
    progressiveSets: Array<{ reps: number; weight: number }>
  }
  onClose: () => void
  onEdit: () => void
}

export function EditExerciseModal({
  workoutId,
  exerciseId,
  initialData,
  onClose,
  onEdit
}: EditExerciseModalProps) {
  const [editedTitle, setEditedTitle] = useState(initialData.title)
  const [editedSets, setEditedSets] = useState(initialData.sets)
  const [editedReps, setEditedReps] = useState(initialData.reps)
  const [editedWeight, setEditedWeight] = useState(initialData.weight)
  
  const initialBreakTimeFormat = `${String(Math.floor(initialData.breakTime / 60)).padStart(2, '0')}:${String(Math.round(initialData.breakTime % 60)).padStart(2, '0')}`
  const [editedBreakTime, setEditedBreakTime] = useState(initialBreakTimeFormat)
  
  const [editedUsesProgressiveWeight, setEditedUsesProgressiveWeight] = useState(initialData.usesProgressiveWeight)
  const [editedProgressiveSets, setEditedProgressiveSets] = useState<Array<{ reps: number; weight: number }>>(
    initialData.progressiveSets?.length > 0 
      ? initialData.progressiveSets 
      : (initialData.usesProgressiveWeight ? Array.from({ length: initialData.sets }, () => ({ reps: initialData.reps, weight: initialData.weight })) : [])
  )

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success'
  })

  // Sync progressive sets when number of sets changes
  useEffect(() => {
    if (editedUsesProgressiveWeight) {
      setEditedProgressiveSets(currentSets => {
        const currentLength = currentSets.length
        if (editedSets > currentLength) {
          const newSets = Array.from({ length: editedSets - currentLength }, () => ({
            reps: editedReps,
            weight: editedWeight
          }))
          return [...currentSets, ...newSets]
        } else if (editedSets < currentLength) {
          return currentSets.slice(0, editedSets)
        }
        return currentSets
      })
    }
  }, [editedSets, editedUsesProgressiveWeight, editedReps, editedWeight])

  const handleBreakTimeChange = (value: string) => {
    const sanitizedValue = value.replace(/[^0-9:]/g, '').slice(0, 5)
    const formattedValue = sanitizedValue.replace(/^(\d{2})(\d{1,2})?$/, (_, m, s) => (s ? `${m}:${s}` : m))
    setEditedBreakTime(formattedValue)
  }

  const adjustBreakTime = (adjustment: number) => {
    const [minutes = 0, seconds = 0] = editedBreakTime.split(':').map(Number)
    let totalSeconds = minutes * 60 + seconds + adjustment
    if (totalSeconds < 0) totalSeconds = 0
    const newMinutes = Math.floor(totalSeconds / 60)
    const newSeconds = totalSeconds % 60
    setEditedBreakTime(`${String(newMinutes).padStart(2, '0')}:${String(newSeconds).padStart(2, '0')}`)
  }

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true)
      const [minutes, seconds] = editedBreakTime.split(':').map(Number)
      const totalBreakTime = minutes * 60 + seconds

      const exerciseRef = doc(db, 'treinos', workoutId, 'exercicios', exerciseId)
      
      const updateData = {
        titulo: editedTitle,
        series: editedSets,
        repeticoes: editedReps,
        peso: editedWeight,
        tempoIntervalo: totalBreakTime,
        usesProgressiveWeight: editedUsesProgressiveWeight,
        progressiveSets: editedUsesProgressiveWeight ? editedProgressiveSets : deleteField()
      }
      
      await updateDoc(exerciseRef, updateData)
      onEdit()
      onClose()
    } catch (err) {
      console.error('Erro ao atualizar exercício:', err)
      setToast({ show: true, message: 'Erro ao atualizar exercício.', type: 'error' })
      setIsLoading(false)
    }
  }

  const handleDeleteExercise = async () => {
    try {
      setIsLoading(true)
      const exerciseRef = doc(db, 'treinos', workoutId, 'exercicios', exerciseId)
      await deleteDoc(exerciseRef)
      onEdit()
      onClose()
    } catch (err) {
      console.error('Erro ao excluir exercício:', err)
      setToast({ show: true, message: 'Erro ao excluir exercício.', type: 'error' })
      setIsLoading(false)
    }
  }

  const inputClass = 'flex-1 border border-gray-300 dark:border-[#404040] rounded-lg px-3 py-2.5 bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-100 text-center w-4/6 focus:outline-none focus:ring-2 focus:ring-[#27AE60]/50 font-medium transition-all shadow-sm'
  const stepBtnClass = 'bg-gray-100 border border-gray-200 dark:border-[#404040] dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#3a3a3a] text-gray-700 dark:text-gray-300 font-bold w-1/6 h-[46px] rounded-lg flex items-center justify-center transition-all shadow-sm'

  return (
    <div className='fixed inset-0 z-[70] bg-[rgba(0,0,0,0.5)] dark:bg-[rgba(0,0,0,0.7)] flex items-center justify-center px-4'>
      <div className='bg-white dark:bg-[#2d2d2d] dark:border dark:border-[#404040] rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto'>
        <h2 className='text-2xl font-bold mb-6 dark:text-gray-100'>Editar Exercício</h2>
        <form className="space-y-5">
          <div>
            <label className='block text-gray-700 dark:text-gray-300 font-bold mb-2'>Nome do Exercício:</label>
            <input
              type='text'
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className='w-full border border-gray-300 dark:border-[#404040] rounded-lg px-3 py-2.5 bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#27AE60]/50 font-medium transition-all shadow-sm'
            />
          </div>
          <div>
            <label className='block text-gray-700 dark:text-gray-300 font-bold mb-2'>Séries:</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditedSets(Math.max(0, editedSets - 1))}
                className={stepBtnClass}
              >
                <Minus size={20} />
              </button>
              <input
                type='number'
                value={editedSets}
                onChange={(e) => setEditedSets(Number(e.target.value))}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setEditedSets(editedSets + 1)}
                className={stepBtnClass}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
          
          {/* Progressive Weight Switch */}
          <div className='bg-gray-50 dark:bg-[#252525] p-4 rounded-xl border border-gray-200 dark:border-[#404040] flex items-center justify-between'>
            <div className="flex-1 pr-4">
              <p className="text-gray-800 dark:text-gray-100 font-bold text-sm">Progressão de carga</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Configurar peso e repetições para cada série</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const checked = !editedUsesProgressiveWeight
                setEditedUsesProgressiveWeight(checked)
                if (checked && editedProgressiveSets.length === 0) {
                  setEditedProgressiveSets(Array.from({ length: editedSets }, () => ({ reps: editedReps, weight: editedWeight })))
                }
              }}
              className={`cursor-pointer relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                editedUsesProgressiveWeight ? 'bg-[#27AE60]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  editedUsesProgressiveWeight ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Progressive Sets Configuration */}
          {editedUsesProgressiveWeight && editedProgressiveSets.length > 0 && (
            <div className='p-4 border border-gray-200 dark:border-[#404040] rounded-xl bg-gray-50 dark:bg-[#1f1f1f]'>
              {editedProgressiveSets.map((set, index) => (
                <div key={index} className='flex items-center gap-2 mb-3 last:mb-0'>
                  <span className='text-gray-700 dark:text-gray-300 text-sm font-bold w-16'>Série {index + 1}:</span>
                  <input
                    type='number'
                    value={set.reps}
                    onChange={(e) => {
                      const newSets = [...editedProgressiveSets]
                      newSets[index].reps = Number(e.target.value)
                      setEditedProgressiveSets(newSets)
                    }}
                    className='min-w-0 flex-1 border border-gray-300 dark:border-[#404040] rounded-lg px-2 py-2 text-center bg-white dark:bg-[#1a1a1a] dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#27AE60]/50 transition-all shadow-sm'
                    placeholder='Reps'
                  />
                  <span className='text-gray-600 dark:text-gray-400 text-sm font-medium'>x</span>
                  <input
                    type='number'
                    value={set.weight}
                    onChange={(e) => {
                      const newSets = [...editedProgressiveSets]
                      newSets[index].weight = Number(e.target.value)
                      setEditedProgressiveSets(newSets)
                    }}
                    className='min-w-0 flex-1 border border-gray-300 dark:border-[#404040] rounded-lg px-2 py-2 text-center bg-white dark:bg-[#1a1a1a] dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#27AE60]/50 transition-all shadow-sm'
                    placeholder='Peso'
                  />
                  <span className='text-gray-600 dark:text-gray-400 text-sm font-medium'>kg</span>
                </div>
              ))}
            </div>
          )}

          {!editedUsesProgressiveWeight && (
            <>
              <div>
                <label className='block text-gray-700 dark:text-gray-300 font-bold mb-2'>Repetições:</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditedReps(Math.max(0, editedReps - 1))}
                    className={stepBtnClass}
                  >
                    <Minus size={20} />
                  </button>
                  <input
                    type='number'
                    value={editedReps}
                    onChange={(e) => setEditedReps(Number(e.target.value))}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setEditedReps(editedReps + 1)}
                    className={stepBtnClass}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              <div>
                <label className='block text-gray-700 dark:text-gray-300 font-bold mb-2'>Peso (kg):</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditedWeight(Math.max(0, editedWeight - 1))}
                    className={stepBtnClass}
                  >
                    <Minus size={20} />
                  </button>
                  <input
                    type='number'
                    value={editedWeight}
                    onChange={(e) => setEditedWeight(Number(e.target.value))}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setEditedWeight(editedWeight + 1)}
                    className={stepBtnClass}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className='block text-gray-700 dark:text-gray-300 font-bold mb-2'>Descanso (MM:SS):</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustBreakTime(-10)}
                className={stepBtnClass}
              >
                <Minus size={20} />
              </button>
              <input
                type='text'
                value={editedBreakTime}
                onChange={(e) => handleBreakTimeChange(e.target.value)}
                className={inputClass}
                placeholder='00:00'
              />
              <button
                type="button"
                onClick={() => adjustBreakTime(10)}
                className={stepBtnClass}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
          
          <div className='flex items-center w-full gap-2 mt-6'>
            <Button
              type='button'
              className='flex-shrink-0 flex items-center justify-center bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-500 py-3 rounded-lg border border-transparent shadow-sm aspect-square'
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={isLoading}
            >
              <Trash2 size={24} />
            </Button>
            <Button
              type='button'
              buttonTextColor='text-gray-800 dark:text-gray-300'
              className='flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-[#404040] dark:hover:bg-[#505050] py-3 rounded-lg border border-gray-200 dark:border-[#505050] shadow-sm'
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type='button'
              onClick={handleSaveChanges}
              className='flex-1 py-3 rounded-lg shadow-sm flex items-center justify-center gap-2'
              disabled={isLoading}
            >
               {isLoading && <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div>}
              <span>Salvar</span>
            </Button>
          </div>
        </form>
      </div>

      {isDeleteModalOpen && (
        <div className='fixed inset-0 z-[80] bg-[rgba(0,0,0,0.5)] dark:bg-[rgba(0,0,0,0.7)] flex items-center justify-center px-4'>
          <div className='bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#404040] rounded-2xl shadow-xl p-6 w-full max-w-sm'>
            <h2 className='text-xl font-bold mb-4 dark:text-gray-100'>Confirmar Exclusão</h2>
            <p className='text-gray-700 dark:text-gray-300 mb-6'>Tem certeza de que deseja excluir este exercício?</p>
            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                buttonTextColor='text-gray-800 dark:text-gray-300'
                className='flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-[#404040] dark:hover:bg-[#505050] border border-gray-200 dark:border-[#505050] py-2.5 rounded-lg'
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type='button'
                className='flex-1 border border-transparent bg-red-500 hover:bg-red-600 py-2.5 rounded-lg flex justify-center'
                onClick={handleDeleteExercise}
                disabled={isLoading}
              >
                {isLoading ? <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div> : 'Excluir'}
              </Button>
            </div>
          </div>
        </div>
      )}

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
