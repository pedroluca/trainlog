import { useCallback, useEffect, useState } from 'react'
import { Button } from './button'
import { EllipsisVertical } from 'lucide-react'
import { addDoc, collection, doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import beepSound from '../assets/beep.mp3'
import { Toast, ToastState } from './toast'
import { ContextMenu } from './context-menu'
import { AddNoteModal } from './add-note-modal'
import { EditExerciseModal } from './edit-exercise-modal'

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
  disableExecution?: boolean
}

export function TrainingCard(props: TrainingCardProps) {
  const { id, workoutId, title, sets, reps, weight, breakTime, isFeito, reset, onEdit, onComplete, nota, usesProgressiveWeight, progressiveSets, disableExecution } = props
  const [isBreakTime, setIsBreakTime] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [setsDone, setSetsDone] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success'
  })

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

  const isFinished = isFeito
  const isExecutionLocked = !!disableExecution

  useEffect(() => {
    if (reset) {
      setSetsDone(0)
    }
  }, [reset])

  const handleStartSet = () => {
    setIsBreakTime(true)
    setTimeLeft(breakTime)
  }

  const handleFinishSet = useCallback(() => {
    const exerciseRef = doc(db, 'treinos', workoutId, 'exercicios', id)
    updateDoc(exerciseRef, { isFeito: true, lastDoneDate: new Date().toISOString() })
      .catch(err => console.error('Erro ao marcar exercício como concluído:', err))
    
    // Add exercise to log when completed
    const usuarioId = localStorage.getItem('usuarioId')
    
    if (usuarioId) {
      const logsRef = collection(db, 'logs')
      addDoc(logsRef, {
        usuarioID: usuarioId,
        titulo: title,
        series: sets,
        repeticoes: reps,
        peso: weight,
        usesProgressiveWeight: usesProgressiveWeight || false,
        progressiveSets: usesProgressiveWeight ? progressiveSets || [] : [],
        data: new Date().toISOString(),
      }).catch(logErr => console.error('Erro ao adicionar exercício ao log:', logErr))
    } else {
      console.error('No user ID found in localStorage')
    }
    
    // Call onComplete callback to move to next exercise
    if (onComplete) {
      onComplete()
    } else {
      onEdit()
    }
  }, [workoutId, id, onEdit, onComplete, title, sets, reps, weight])

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

  const handleUndoSet = useCallback(() => {
    if (setsDone > 0) {
      setSetsDone(prev => prev - 1)
      setIsBreakTime(false)
      setTimeLeft(0)
      if (isFeito) {
        const exerciseRef = doc(db, 'treinos', workoutId, 'exercicios', id)
        updateDoc(exerciseRef, { isFeito: false }).catch(err => console.error('Erro ao desmarcar conclusão:', err))
        onEdit() // Trigger parent rebuild to drop finished status visually
      }
    }
  }, [setsDone, isFeito, workoutId, id, onEdit])

  const handleResetExercise = useCallback(() => {
    setSetsDone(0)
    setIsBreakTime(false)
    setTimeLeft(0)
    if (isFeito) {
      const exerciseRef = doc(db, 'treinos', workoutId, 'exercicios', id)
      updateDoc(exerciseRef, { isFeito: false }).catch(err => console.error('Erro ao resetar conclusão:', err))
      onEdit() // Trigger parent rebuild
    }
  }, [isFeito, workoutId, id, onEdit])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleSaveNote = (noteText: string) => {
    const exerciseRef = doc(db, 'treinos', workoutId, 'exercicios', id)
    updateDoc(exerciseRef, {
      nota: noteText
    }).catch(err => {
      console.error('Erro ao salvar nota:', err)
      setToast({ show: true, message: 'Erro ao salvar nota.', type: 'error' })
    })
    setToast({ show: true, message: 'Nota computada (salva na fila offline ou sincronizada)!', type: 'success' })
    onEdit()
  }

  return (
    <div
      className={`shadow-lg lg:shadow-xl w-full max-w-sm md:max-w-xl lg:max-w-2xl relative rounded-2xl overflow-hidden p-6 md:p-8 mx-auto transition-all duration-300 min-h-[375px] max-h-[500px] md:max-h-[600px] lg:max-h-[450px] flex flex-col ${
        isFinished 
          ? 'bg-gradient-to-br from-primary to-primary-dark border-primary shadow-primary/20' 
          : 'bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-[#2a2a2a] shadow-black/5 dark:shadow-black/20'
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
        onUndoSet={setsDone > 0 ? handleUndoSet : undefined}
        onResetExercise={setsDone > 0 ? handleResetExercise : undefined}
      />

      <h2 className={`text-3xl md:text-4xl lg:text-2xl font-bold mb-6 mr-7 ${isFinished ? 'text-[#f4f4f4]' : 'text-gray-800 dark:text-gray-100'}`}>{title}</h2>
      
      {!isBreakTime ? (
        <>
          <div className='mb-auto'>
            {usesProgressiveWeight && progressiveSets ? (
              // Progressive weight display
              <>
                <p className={`text-lg md:text-2xl lg:text-xl mb-3 font-bold ${isFinished ? 'text-[#f4f4f4]' : 'text-gray-700 dark:text-gray-300'}`}>
                  Peso Progressivo:
                </p>
                <div className="flex gap-3 overflow-x-auto pb-4 pt-2 px-2 -mx-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {progressiveSets.map((set, index) => {
                    const isCurrentSet = index === setsDone
                    const isCompleted = index < setsDone
                    
                    return (
                      <div 
                        key={index} 
                        className={`min-w-[140px] p-3 rounded-xl snap-center flex-shrink-0 transition-all border ${
                          isFinished
                            ? 'bg-white/10 border-white/20 text-[#f4f4f4]'
                            : isCurrentSet
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-500 shadow-sm transform scale-105 my-1'
                            : isCompleted
                            ? 'bg-gray-100 dark:bg-[#252525] border-gray-200 dark:border-[#404040] opacity-60'
                            : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#404040]'
                        }`}
                      >
                        <h4 className={`text-sm font-bold mb-1 ${
                          isFinished ? 'text-white/80' : isCurrentSet ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          Série {index + 1} {isCompleted && '✓'}
                        </h4>
                        <p className={`text-lg font-black ${
                          isFinished ? 'text-white' : isCurrentSet ? 'text-green-800 dark:text-green-300' : 'text-gray-800 dark:text-gray-100'
                        }`}>
                          {set.reps}<span className="text-sm font-normal mx-1">×</span>{set.weight}kg
                        </p>
                      </div>
                    )
                  })}
                </div>
                <p className={`text-lg md:text-2xl lg:text-xl mb-3 mt-1 ${isFinished ? 'text-[#f4f4f4]' : 'text-gray-700 dark:text-gray-300'}`}>
                  <strong>Descanso:</strong> {formatTime(breakTime)} min
                </p>
              </>
            ) : (
              // Normal display
              <>
                <p className={`text-lg md:text-2xl lg:text-xl mb-3 ${isFinished ? 'text-[#f4f4f4]' : 'text-gray-700 dark:text-gray-300'}`}>
                  <strong>Repetição:</strong> {sets} x {reps}
                </p>
                <p className={`text-lg md:text-2xl lg:text-xl mb-3 ${isFinished ? 'text-[#f4f4f4]' : 'text-gray-700 dark:text-gray-300'}`}>
                  <strong>Carga:</strong> {weight} kg
                </p>
                <p className={`text-lg md:text-2xl lg:text-xl mb-3 ${isFinished ? 'text-[#f4f4f4]' : 'text-gray-700 dark:text-gray-300'}`}>
                  <strong>Descanso:</strong> {formatTime(breakTime)} min
                </p>
              </>
            )}
            {!isExecutionLocked ? (
              <p className={`text-lg md:text-2xl lg:text-xl mb-3 ${isFinished ? 'text-[#f4f4f4]' : 'text-gray-700 dark:text-gray-300'}`}>
                <strong>Você fez:</strong> {isFinished ? sets : setsDone} séries de {sets}
              </p>
            ) : (
              <p className={`text-lg md:text-2xl lg:text-xl mb-3 ${isFinished ? 'text-[#f4f4f4]' : 'text-gray-700 dark:text-gray-300'}`}>
                <strong>Modo:</strong> Planejamento do aluno
              </p>
            )}
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
            disabled={isFinished || isExecutionLocked} 
            bgColor={'bg-primary hover:bg-primary-dark disabled:bg-primary-dark'}
            className='w-full py-4 text-lg md:text-2xl lg:text-xl font-bold mt-4'
          >
            {isExecutionLocked ? 'Execução desativada' : isFinished ? 'Concluído' : ('Finalizar ' + (setsDone + 1) + 'ª série')}
          </Button>
        </>
      ) : (
        <>
          <div className='mb-auto flex flex-col items-center justify-center flex-1'>
            {usesProgressiveWeight && progressiveSets ? (
              <p className='text-xl md:text-3xl lg:text-2xl mb-6 text-gray-700 dark:text-gray-300 text-center'>
                <strong>Séries feitas:</strong> {setsDone + 1} de {sets}<br />
                <span className='text-base'>({progressiveSets[setsDone]?.reps || reps} reps × {progressiveSets[setsDone]?.weight || weight} kg)</span>
              </p>
            ) : (
              <p className='text-xl md:text-3xl lg:text-2xl mb-4 text-gray-700 dark:text-gray-300 text-center'>
                <strong>Séries feitas:</strong> {setsDone + 1} de {sets} com {reps} repetições cada
              </p>
            )}
            {/* <h2 className='text-2xl md:text-4xl font-bold mb-4 text-gray-500 dark:text-gray-400'>Intervalo de descanso:</h2> */}
            <p className='text-gray-700 dark:text-gray-300 text-6xl md:text-8xl lg:text-6xl font-mono mb-4'>{formatTime(timeLeft)}</p>
          </div>
          <Button
            className='w-full bg-red-400 hover:bg-red-500 py-4 text-lg md:text-2xl lg:text-xl rounded text-white font-bold mt-4'
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
        <EditExerciseModal
          workoutId={workoutId}
          exerciseId={id}
          initialData={{
            title,
            sets,
            reps,
            weight,
            breakTime,
            usesProgressiveWeight: usesProgressiveWeight || false,
            progressiveSets: progressiveSets || []
          }}
          onClose={() => setIsModalOpen(false)}
          onEdit={onEdit}
        />
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