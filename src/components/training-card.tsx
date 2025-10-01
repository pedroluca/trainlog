import { useCallback, useEffect, useState } from 'react'
import { Button } from './button'
import { EllipsisVertical, Trash2 } from 'lucide-react'
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'

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
}

export function TrainingCard(props: TrainingCardProps) {
  const { id, workoutId, title, sets, reps, weight, breakTime, isFeito, reset, onEdit, onComplete } = props
  const [isBreakTime, setIsBreakTime] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [setsDone, setSetsDone] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const [editedTitle, setEditedTitle] = useState(title)
  const [editedSets, setEditedSets] = useState(sets)
  const [editedReps, setEditedReps] = useState(reps)
  const [editedWeight, setEditedWeight] = useState(weight)
  const [editedBreakTime, setEditedBreakTime] = useState(
    `${String(Math.floor(breakTime / 60)).padStart(2, '0')}:${String(Math.round(breakTime % 60)).padStart(2, '0')}`
  )

  const handleBreakTimeChange = (value: string) => {
    const sanitizedValue = value.replace(/[^0-9:]/g, '').slice(0, 5)
    const formattedValue = sanitizedValue.replace(/^(\d{2})(\d{1,2})?$/, (_, m, s) => (s ? `${m}:${s}` : m))
  
    setEditedBreakTime(formattedValue)
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
      await updateDoc(exerciseRef, { isFeito: true })
      
      // Add exercise to log when completed
      try {
        const usuarioId = localStorage.getItem('usuarioId')
        console.log('User ID from localStorage:', usuarioId)
        console.log('Exercise data:', { title, sets, reps, weight })
        
        if (usuarioId) {
          console.log('Creating log entry for user:', usuarioId)
          
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
      alert('Erro ao excluir exercício.')
    }
  }

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)

      return () => clearInterval(timer)
    } else if (timeLeft === 0 && isBreakTime) {
      setIsBreakTime(false)
      setSetsDone((prev) => prev + 1)
      if (setsDone + 1 === sets) {
        handleFinishSet()
      }
    }
  }, [timeLeft, isBreakTime, sets, setsDone, handleFinishSet])

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
      await updateDoc(exerciseRef, {
        titulo: editedTitle,
        series: editedSets,
        repeticoes: editedReps,
        peso: editedWeight,
        tempoIntervalo: totalBreakTime,
      })
      setIsModalOpen(false)
      onEdit()
    } catch (err) {
      console.error('Erro ao atualizar exercício:', err)
      alert('Erro ao atualizar exercício.')
    }
  }

  return (
    <div
      className={`shadow-md relative rounded-lg overflow-hidden p-6 my-4 mx-2 transition-all min-h-[500px] flex flex-col ${
        isFinished ? 'bg-[#27AE60] border-green-400' : 'bg-white'
      }`}
    >
      <button
        className={`absolute top-4 right-4 cursor-pointer z-10 ${isFinished ? 'text-[#f4f4f4] hover:bg-[#219150]' : 'text-gray-700 hover:bg-gray-100'} rounded-full p-2`}
        onClick={() => setIsModalOpen(true)}
      >
        <EllipsisVertical />
      </button>

      <h2 className={`text-3xl font-bold mb-6 mr-7 ${isFinished ? 'text-[#f4f4f4]' : 'text-gray-800'}`}>{title}</h2>
      
      {!isBreakTime ? (
        <>
          <div className='mb-auto'>
            <p className={`text-lg mb-3 ${isFinished ? 'text-[#f4f4f4]' : 'text-gray-700'}`}>
              <strong>Repetição:</strong> {sets} x {reps}
            </p>
            <p className={`text-lg mb-3 ${isFinished ? 'text-[#f4f4f4]' : 'text-gray-700'}`}>
              <strong>Carga:</strong> {weight} kg
            </p>
            <p className={`text-lg mb-3 ${isFinished ? 'text-[#f4f4f4]' : 'text-gray-700'}`}>
              <strong>Descanso:</strong> {formatTime(breakTime)} min
            </p>
            <p className={`text-lg mb-3 ${isFinished ? 'text-[#f4f4f4]' : 'text-gray-700'}`}>
              <strong>Você fez:</strong> {isFinished ? sets : setsDone} séries de {sets}
            </p>
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
            <p className='text-xl mb-6 text-gray-700 text-center'>
              <strong>Séries feitas:</strong> {setsDone + 1} de {sets} com {reps} repetições cada
            </p>
            <h2 className='text-2xl font-bold mb-4 text-gray-500'>Intervalo de descanso:</h2>
            <p className='text-gray-700 text-6xl font-mono mb-8'>{formatTime(timeLeft)}</p>
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
        <div className='fixed inset-0 z-10 bg-[rgba(0,0,0,0.5)] flex items-center justify-center px-4'>
          <div className='bg-white rounded-lg p-6 w-96'>
            <h2 className='text-xl font-bold mb-4'>Editar Exercício</h2>
            <form>
              <div className='mb-4'>
                <label className='block text-gray-700 font-bold mb-2'>Nome do Exercício:</label>
                <input
                  type='text'
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className='w-full border rounded px-3 py-2'
                />
              </div>
              <div className='mb-4'>
                <label className='block text-gray-700 font-bold mb-2'>Séries:</label>
                <input
                  type='number'
                  value={editedSets}
                  onChange={(e) => setEditedSets(Number(e.target.value))}
                  className='w-full border rounded px-3 py-2'
                />
              </div>
              <div className='mb-4'>
                <label className='block text-gray-700 font-bold mb-2'>Repetições:</label>
                <input
                  type='number'
                  value={editedReps}
                  onChange={(e) => setEditedReps(Number(e.target.value))}
                  className='w-full border rounded px-3 py-2'
                />
              </div>
              <div className='mb-4'>
                <label className='block text-gray-700 font-bold mb-2'>Peso (kg):</label>
                <input
                  type='number'
                  value={editedWeight}
                  onChange={(e) => setEditedWeight(Number(e.target.value))}
                  className='w-full border rounded px-3 py-2'
                />
              </div>
              <div className='mb-4'>
                <label className='block text-gray-700 font-bold mb-2'>Tempo de Descanso (MM:SS):</label>
                <input
                  type='text'
                  value={editedBreakTime}
                  onChange={(e) => handleBreakTimeChange(e.target.value)}
                  className='w-full border rounded px-3 py-2'
                  placeholder='00:00'
                />
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
                  buttonTextColor='text-gray-800'
                  className='bg-gray-300 hover:bg-gray-400 mr-2'
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
        <div className='fixed inset-0 z-20 bg-[rgba(0,0,0,0.5)] flex items-center justify-center px-4'>
          <div className='bg-white rounded-lg p-6 w-80'>
            <h2 className='text-xl font-bold mb-4'>Confirmar Exclusão</h2>
            <p className='text-gray-700 mb-6'>Tem certeza de que deseja excluir este exercício?</p>
            <div className='flex justify-end'>
              <Button
                type='button'
                buttonTextColor='text-gray-800'
                className='bg-gray-300 hover:bg-gray-400 mr-2'
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
    </div>
  )
}

export const TrainingCardSkeleton = () => {
  return (
    <div className='animate-pulse shadow-md relative rounded-lg p-6 my-4 mx-2 bg-gray-100 border border-gray-300 min-h-[500px] flex flex-col'>
      <div className='absolute top-4 right-4 h-6 w-6 bg-gray-300 rounded-full'></div>
      <div className='h-8 w-48 bg-gray-300 rounded mb-6 mr-7'></div>

      <div className='space-y-3 mb-auto'>
        <div className='h-5 w-56 bg-gray-300 rounded'></div>
        <div className='h-5 w-40 bg-gray-300 rounded'></div>
        <div className='h-5 w-48 bg-gray-300 rounded'></div>
        <div className='h-5 w-60 bg-gray-300 rounded'></div>
      </div>

      <div className='h-14 w-full bg-gray-300 rounded mt-4'></div>
    </div>
  )
}