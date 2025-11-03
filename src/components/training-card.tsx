import { useCallback, useEffect, useState } from 'react'
import { Button } from './button'
import { EllipsisVertical, Trash2 } from 'lucide-react'
import { addDoc, collection, deleteDoc, doc, updateDoc, getDoc, deleteField } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import beepSound from '../assets/beep.mp3'
import { Toast, ToastState } from './toast'
import { ContextMenu } from './context-menu'
import { AddNoteModal } from './add-note-modal'

type TrainingCardProps = {
  id: string // ID do exercício
  workoutId: string // ID do treino
  title: string
  sets: number
  reps: number
  weight: number
  breakTime: number
  isFeito: boolean
  reset?: boolean
  onEdit: () => void
  onComplete?: () => void // Callback when exercise is completed
  nota?: string
  usesProgressiveWeight?: boolean
  progressiveSets?: Array<{ reps: number; weight: number }>
}

export function TrainingCard(props: TrainingCardProps) {
  const { id, workoutId, title, sets, reps, weight, breakTime, isFeito, reset, onEdit, onComplete, nota, usesProgressiveWeight, progressiveSets } = props
  const [isBreakTime, setIsBreakTime] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [setsDone, setSetsDone] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success'
  })

  const [editedTitle, setEditedTitle] = useState(title)
  const [editedSets, setEditedSets] = useState(sets)
  const [editedReps, setEditedReps] = useState(reps)
  const [editedWeight, setEditedWeight] = useState(weight)
  const [editedBreakTime, setEditedBreakTime] = useState(
    `${String(Math.floor(breakTime / 60)).padStart(2, '0')}:${String(Math.round(breakTime % 60)).padStart(2, '0')}`
  )
  const [editedUsesProgressiveWeight, setEditedUsesProgressiveWeight] = useState(usesProgressiveWeight || false)
  const [editedProgressiveSets, setEditedProgressiveSets] = useState<Array<{ reps: number; weight: number }>>(
    progressiveSets || (usesProgressiveWeight ? Array.from({ length: sets }, () => ({ reps: reps, weight: weight })) : [])
  )

  // Sync progressive sets when number of sets changes
  useEffect(() => {
    if (editedUsesProgressiveWeight) {
      setEditedProgressiveSets(currentSets => {
        const currentLength = currentSets.length
        if (editedSets > currentLength) {
          // Add more sets
          const newSets = Array.from({ length: editedSets - currentLength }, () => ({
            reps: editedReps,
            weight: editedWeight
          }))
          return [...currentSets, ...newSets]
        } else if (editedSets < currentLength) {
          // Remove sets
          return currentSets.slice(0, editedSets)
        }
        return currentSets
      })
    }
  }, [editedSets, editedUsesProgressiveWeight, editedReps, editedWeight])

  // Fetch audio setting on mount
  useEffect(() => {
    const fetchAudioSetting = async () => {
      try {
        const usuarioId = localStorage.getItem('usuarioId')
        if (usuarioId) {
          const userDocRef = doc(db, 'usuarios', usuarioId)
          const userDoc = await getDoc(userDocRef)
          
          if (userDoc.exists()) {
            const userData = userDoc.data()
            // Audio is disabled by default
            setAudioEnabled(userData.audioEnabled === true)
          }
        }
      } catch (err) {
        console.error('Erro ao buscar configuração de áudio:', err)
      }
    }

    fetchAudioSetting()
  }, [])

  // Function to play beep sound when timer ends
  const playBeepSound = useCallback(() => {
    // Only play if audio is enabled
    if (!audioEnabled) return

    try {
      const audio = new Audio(beepSound)
      audio.volume = 0.5 // Set volume to 50%
      audio.play().catch((error) => {
        console.error('Error playing beep sound:', error)
      })
    } catch (error) {
      console.error('Error initializing beep sound:', error)
    }
  }, [audioEnabled])

  const handleBreakTimeChange = (value: string) => {
    const sanitizedValue = value.replace(/[^0-9:]/g, '').slice(0, 5)
    const formattedValue = sanitizedValue.replace(/^(\d{2})(\d{1,2})?$/, (_, m, s) => (s ? `${m}:${s}` : m))
  
    setEditedBreakTime(formattedValue)
  }

  const adjustBreakTime = (adjustment: number) => {
    const [minutes = 0, seconds = 0] = editedBreakTime.split(':').map(Number)
    let totalSeconds = minutes * 60 + seconds + adjustment
    
    // Don't allow negative values
    if (totalSeconds < 0) totalSeconds = 0
    
    const newMinutes = Math.floor(totalSeconds / 60)
    const newSeconds = totalSeconds % 60
    
    setEditedBreakTime(`${String(newMinutes).padStart(2, '0')}:${String(newSeconds).padStart(2, '0')}`)
  }

  const isFinished = isFeito

  useEffect(() => {
    if (reset) {
      setSetsDone(0)
    }
  }, [reset])

  const handleStartSet = () => {
    setIsBreakTime(true)
    setTimeLeft(breakTime)
  }

  const handleFinishSet = useCallback(async () => {
    try {
      const exerciseRef = doc(db, 'treinos', workoutId, 'exercicios', id)
      await updateDoc(exerciseRef, { isFeito: true, lastDoneDate: new Date().toISOString() })
      
      // Add exercise to log when completed
      try {
        const usuarioId = localStorage.getItem('usuarioId')
        // console.log('User ID from localStorage:', usuarioId)
        // console.log('Exercise data:', { title, sets, reps, weight })
        
        if (usuarioId) {
          // console.log('Creating log entry for user:', usuarioId)
          
          const logsRef = collection(db, 'logs')
          const logDoc = await addDoc(logsRef, {
            usuarioID: usuarioId,
            titulo: title,
            series: sets,
            repeticoes: reps,
            peso: weight,
            data: new Date().toISOString(),
          })
          
          console.log('Log entry created with ID:', logDoc.id)
        } else {
          console.error('No user ID found in localStorage')
        }
      } catch (logErr) {
        console.error('Erro ao adicionar exercício ao log:', logErr)
        if (logErr instanceof Error) {
          console.error('Error details:', logErr.message)
        }
      }
      
      onEdit()
      
      // Call onComplete callback to move to next exercise
      if (onComplete) {
        onComplete()
      }
    } catch (err) {
      console.error('Erro ao marcar exercício como concluído:', err)
    }
  }, [workoutId, id, onEdit, onComplete, title, sets, reps, weight])

  const handleDeleteExercise = async () => {
    try {
      const exerciseRef = doc(db, 'treinos', workoutId, 'exercicios', id)
      await deleteDoc(exerciseRef)
      setIsDeleteModalOpen(false)
      onEdit()
    } catch (err) {
      console.error('Erro ao excluir exercício:', err)
      setToast({ show: true, message: 'Erro ao excluir exercício.', type: 'error' })
    }
  }

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)

      return () => clearInterval(timer)
    } else if (timeLeft === 0 && isBreakTime) {
      // Play beep sound when timer ends
      playBeepSound()
      
      setIsBreakTime(false)
      setSetsDone((prev) => prev + 1)
      if (setsDone + 1 === sets) {
        handleFinishSet()
      }
    }
  }, [timeLeft, isBreakTime, sets, setsDone, handleFinishSet, playBeepSound])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleSaveChanges = async () => {
    try {
      const [minutes, seconds] = editedBreakTime.split(':').map(Number)
      const totalBreakTime = minutes * 60 + seconds
  
      const exerciseRef = doc(db, 'treinos', workoutId, 'exercicios', id)
      
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
      setIsModalOpen(false)
      onEdit()
    } catch (err) {
      console.error('Erro ao atualizar exercício:', err)
      setToast({ show: true, message: 'Erro ao atualizar exercício.', type: 'error' })
    }
  }

  const handleSaveNote = async (noteText: string) => {
    try {
      const exerciseRef = doc(db, 'treinos', workoutId, 'exercicios', id)
      await updateDoc(exerciseRef, {
        nota: noteText
      })
      setToast({ show: true, message: 'Nota salva com sucesso!', type: 'success' })
      onEdit()
    } catch (err) {
      console.error('Erro ao salvar nota:', err)
      setToast({ show: true, message: 'Erro ao salvar nota.', type: 'error' })
    }
  }

  return (
    <div
      className={`shadow-md relative rounded-lg overflow-hidden p-6 my-4 mx-2 transition-all min-h-[500px] flex flex-col ${
        isFinished ? 'bg-[#27AE60] border-green-400' : 'bg-white dark:bg-[#2d2d2d] border-gray-200 dark:border-[#404040]'
      }`}
    >
      <button
        className={`absolute top-4 right-4 cursor-pointer z-10 ${isFinished ? 'text-[#f4f4f4] hover:bg-[#219150]' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'} rounded-full p-2`}
        onClick={() => setIsContextMenuOpen(true)}
      >
        <EllipsisVertical />
      </button>

      <ContextMenu
        isOpen={isContextMenuOpen}
        onClose={() => setIsContextMenuOpen(false)}
        onEdit={() => setIsModalOpen(true)}
        onAddNote={() => setIsNoteModalOpen(true)}
      />

      <h2 className={`text-3xl font-bold mb-6 mr-7 ${isFinished ? 'text-[#f4f4f4]' : 'text-gray-800 dark:text-gray-100'}`}>{title}</h2>
      
      {!isBreakTime ? (
        <>
          <div className='mb-auto'>
            {usesProgressiveWeight && progressiveSets ? (
              // Progressive weight display
              <>
                <p className={`text-lg mb-3 font-bold ${isFinished ? 'text-[#f4f4f4]' : 'text-gray-700 dark:text-gray-300'}`}>
                  Peso Progressivo:
                </p>
                {progressiveSets.map((set, index) => {
                  const isCurrentSet = index === setsDone
                  const isCompleted = index < setsDone
                  
                  return (
                    <p 
                      key={index} 
                      className={`text-base mb-2 transition-all ${
                        isFinished 
                          ? 'text-[#f4f4f4]' 
                          : isCurrentSet
                          ? 'text-[#27AE60] dark:text-[#2ecc71] font-bold text-lg scale-105'
                          : isCompleted
                          ? 'text-gray-400 dark:text-gray-600 line-through opacity-60'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {isCurrentSet && '➤ '}
                      <strong>Série {index + 1}:</strong> {set.reps} reps × {set.weight} kg
                      {isCompleted && ' ✓'}
                    </p>
                  )
                })}
                <p className={`text-lg mb-3 mt-3 ${isFinished ? 'text-[#f4f4f4]' : 'text-gray-700 dark:text-gray-300'}`}>
                  <strong>Descanso:</strong> {formatTime(breakTime)} min
                </p>
              </>
            ) : (
              // Normal display
              <>
                <p className={`text-lg mb-3 ${isFinished ? 'text-[#f4f4f4]' : 'text-gray-700 dark:text-gray-300'}`}>
                  <strong>Repetição:</strong> {sets} x {reps}
                </p>
                <p className={`text-lg mb-3 ${isFinished ? 'text-[#f4f4f4]' : 'text-gray-700 dark:text-gray-300'}`}>
                  <strong>Carga:</strong> {weight} kg
                </p>
                <p className={`text-lg mb-3 ${isFinished ? 'text-[#f4f4f4]' : 'text-gray-700 dark:text-gray-300'}`}>
                  <strong>Descanso:</strong> {formatTime(breakTime)} min
                </p>
              </>
            )}
            <p className={`text-lg mb-3 ${isFinished ? 'text-[#f4f4f4]' : 'text-gray-700 dark:text-gray-300'}`}>
              <strong>Você fez:</strong> {isFinished ? sets : setsDone} séries de {sets}
            </p>
            {nota && (
              <div className={`mt-4 p-3 rounded-lg ${isFinished ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <p className={`text-sm ${isFinished ? 'text-[#f4f4f4]' : 'text-gray-600 dark:text-gray-400'}`}>
                  <strong>Nota:</strong> {nota}
                </p>
              </div>
            )}
          </div>
          <Button 
            onClick={handleStartSet} 
            disabled={isFinished} 
            bgColor={'bg-[#27AE60] hover:bg-[#219150] disabled:bg-[#219150]'}
            className='w-full py-4 text-lg font-bold mt-4'
          >
            {isFinished ? 'Concluído' : ('Finalizar ' + (setsDone + 1) + 'ª série')}
          </Button>
        </>
      ) : (
        <>
          <div className='mb-auto flex flex-col items-center justify-center flex-1'>
            {usesProgressiveWeight && progressiveSets ? (
              <p className='text-xl mb-6 text-gray-700 dark:text-gray-300 text-center'>
                <strong>Séries feitas:</strong> {setsDone + 1} de {sets}<br />
                <span className='text-base'>({progressiveSets[setsDone]?.reps || reps} reps × {progressiveSets[setsDone]?.weight || weight} kg)</span>
              </p>
            ) : (
              <p className='text-xl mb-6 text-gray-700 dark:text-gray-300 text-center'>
                <strong>Séries feitas:</strong> {setsDone + 1} de {sets} com {reps} repetições cada
              </p>
            )}
            <h2 className='text-2xl font-bold mb-4 text-gray-500 dark:text-gray-400'>Intervalo de descanso:</h2>
            <p className='text-gray-700 dark:text-gray-300 text-6xl font-mono mb-8'>{formatTime(timeLeft)}</p>
          </div>
          <Button
            className='w-full bg-red-400 hover:bg-red-500 py-4 text-lg rounded text-white font-bold mt-4'
            onClick={() => {
              setIsBreakTime(false)
              setTimeLeft(0)
              setSetsDone((prev) => prev + 1)
              if (setsDone + 1 === sets) {
                handleFinishSet()
              }
            }}
          >
            Pular Descanso
          </Button>
        </>
      )}

      {isModalOpen && (
        <div className='fixed inset-0 z-10 bg-[rgba(0,0,0,0.5)] dark:bg-[rgba(0,0,0,0.7)] flex items-center justify-center px-4'>
          <div className='bg-white dark:bg-[#2d2d2d] dark:border dark:border-[#404040] rounded-lg p-6 w-96'>
            <h2 className='text-xl font-bold mb-4 dark:text-gray-100'>Editar Exercício</h2>
            <form>
              <div className='mb-4'>
                <label className='block text-gray-700 dark:text-gray-300 font-bold mb-2'>Nome do Exercício:</label>
                <input
                  type='text'
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className='w-full border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100'
                />
              </div>
              <div className='mb-4'>
                <label className='block text-gray-700 dark:text-gray-300 font-bold mb-2'>Séries:</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditedSets(Math.max(0, editedSets - 1))}
                    className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type='number'
                    value={editedSets}
                    onChange={(e) => setEditedSets(Number(e.target.value))}
                    className='flex-1 border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100 text-center'
                  />
                  <button
                    type="button"
                    onClick={() => setEditedSets(editedSets + 1)}
                    className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* Progressive Weight Toggle */}
              <div className='mb-4'>
                <label className='flex items-center gap-2 text-gray-700 dark:text-gray-300 font-bold cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={editedUsesProgressiveWeight}
                    onChange={(e) => {
                      setEditedUsesProgressiveWeight(e.target.checked)
                      if (e.target.checked && editedProgressiveSets.length === 0) {
                        // Initialize with current values
                        setEditedProgressiveSets(
                          Array.from({ length: editedSets }, () => ({
                            reps: editedReps,
                            weight: editedWeight
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
              {editedUsesProgressiveWeight && editedProgressiveSets.length > 0 && (
                <div className='mb-4 p-4 border border-gray-300 dark:border-[#404040] rounded bg-gray-50 dark:bg-[#1a1a1a]'>
                  <p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>
                    Configure cada série individualmente:
                  </p>
                  {editedProgressiveSets.map((set, index) => (
                    <div key={index} className='flex items-center gap-2 mb-2'>
                      <span className='text-gray-700 dark:text-gray-300 text-sm font-bold w-16'>
                        Série {index + 1}:
                      </span>
                      <input
                        type='number'
                        value={set.reps}
                        onChange={(e) => {
                          const newSets = [...editedProgressiveSets]
                          newSets[index].reps = Number(e.target.value)
                          setEditedProgressiveSets(newSets)
                        }}
                        className='w-16 border dark:border-[#404040] rounded px-2 py-1 dark:bg-[#2d2d2d] dark:text-gray-100 text-center text-sm'
                        placeholder='Reps'
                      />
                      <span className='text-gray-600 dark:text-gray-400 text-sm'>reps ×</span>
                      <input
                        type='number'
                        value={set.weight}
                        onChange={(e) => {
                          const newSets = [...editedProgressiveSets]
                          newSets[index].weight = Number(e.target.value)
                          setEditedProgressiveSets(newSets)
                        }}
                        className='w-16 border dark:border-[#404040] rounded px-2 py-1 dark:bg-[#2d2d2d] dark:text-gray-100 text-center text-sm'
                        placeholder='Peso'
                      />
                      <span className='text-gray-600 dark:text-gray-400 text-sm'>kg</span>
                    </div>
                  ))}
                </div>
              )}

              {!editedUsesProgressiveWeight && (
                <>
              <div className='mb-4'>
                <label className='block text-gray-700 dark:text-gray-300 font-bold mb-2'>Repetições:</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditedReps(Math.max(0, editedReps - 1))}
                    className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type='number'
                    value={editedReps}
                    onChange={(e) => setEditedReps(Number(e.target.value))}
                    className='flex-1 border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100 text-center'
                  />
                  <button
                    type="button"
                    onClick={() => setEditedReps(editedReps + 1)}
                    className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className='mb-4'>
                <label className='block text-gray-700 dark:text-gray-300 font-bold mb-2'>Peso (kg):</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditedWeight(Math.max(0, editedWeight - 1))}
                    className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type='number'
                    value={editedWeight}
                    onChange={(e) => setEditedWeight(Number(e.target.value))}
                    className='flex-1 border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100 text-center'
                  />
                  <button
                    type="button"
                    onClick={() => setEditedWeight(editedWeight + 1)}
                    className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
                </>
              )}
              <div className='mb-4'>
                <label className='block text-gray-700 dark:text-gray-300 font-bold mb-2'>Tempo de Descanso (MM:SS):</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustBreakTime(-10)}
                    className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type='text'
                    value={editedBreakTime}
                    onChange={(e) => handleBreakTimeChange(e.target.value)}
                    className='flex-1 border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100 text-center'
                    placeholder='00:00'
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
              <div className='flex justify-end'>
                <Button
                  type='button'
                  className='bg-red-500 hover:bg-red-600 mr-2'
                  onClick={() => setIsDeleteModalOpen(true)} // Abre o modal de exclusão
                >
                  <Trash2 />
                </Button>
                <Button
                  type='button'
                  buttonTextColor='text-gray-800 dark:text-gray-300'
                  className='bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 mr-2'
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type='button'
                  onClick={handleSaveChanges}
                >
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className='fixed inset-0 z-20 bg-[rgba(0,0,0,0.5)] dark:bg-[rgba(0,0,0,0.7)] flex items-center justify-center px-4'>
          <div className='bg-white dark:bg-[#2d2d2d] dark:border dark:border-[#404040] rounded-lg p-6 w-80'>
            <h2 className='text-xl font-bold mb-4 dark:text-gray-100'>Confirmar Exclusão</h2>
            <p className='text-gray-700 dark:text-gray-300 mb-6'>Tem certeza de que deseja excluir este exercício?</p>
            <div className='flex justify-end'>
              <Button
                type='button'
                buttonTextColor='text-gray-800 dark:text-gray-300'
                className='bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 mr-2'
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type='button'
                className='bg-red-500 hover:bg-red-600'
                onClick={handleDeleteExercise}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      <AddNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleSaveNote}
        currentNote={nota}
        exerciseTitle={title}
      />
      
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

export const TrainingCardSkeleton = () => {
  return (
    <div className='animate-pulse shadow-md relative rounded-lg p-6 my-4 mx-2 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#404040] min-h-[500px] flex flex-col'>
      <div className='absolute top-4 right-4 h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded-full'></div>
      <div className='h-8 w-48 bg-gray-300 dark:bg-gray-600 rounded mb-6 mr-7'></div>

      <div className='space-y-3 mb-auto'>
        <div className='h-5 w-56 bg-gray-300 dark:bg-gray-600 rounded'></div>
        <div className='h-5 w-40 bg-gray-300 dark:bg-gray-600 rounded'></div>
        <div className='h-5 w-48 bg-gray-300 dark:bg-gray-600 rounded'></div>
        <div className='h-5 w-60 bg-gray-300 dark:bg-gray-600 rounded'></div>
      </div>

      <div className='h-14 w-full bg-gray-300 dark:bg-gray-600 rounded mt-4'></div>
    </div>
  )
}