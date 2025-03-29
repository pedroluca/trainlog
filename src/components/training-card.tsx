import { useEffect, useState } from 'react'
import { Button } from './button'
import { Pencil } from 'lucide-react'

type TrainingCardProps = {
  title: string
  sets: number
  reps: number
  weight: number
  breakTime: number
}

export function TrainingCard(props: TrainingCardProps) {
  const { title, sets, reps, weight, breakTime } = props
  const [isBreakTime, setIsBreakTime] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [setsDone, setSetsDone] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

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
        setIsFinished(true)
        return
      }
    }
  }, [timeLeft, isBreakTime, sets, setsDone])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleFinishSet = () => {
    setIsBreakTime(true)
    setTimeLeft(breakTime * 60)
  }

  return (
    <div
      className={`shadow-md relative rounded-lg p-6 m-4 w-full max-w-sm transition-all ${
        isFinished ? 'bg-green-100 border-green-400' : 'bg-white'
      }`}
    >
      <button
        className='absolute top-4 right-4 cursor-pointer hover:bg-gray-300 text-gray-700 rounded-full p-2'
        onClick={() => setIsModalOpen(true)}
      >
        <Pencil />
      </button>

      <h2 className='text-2xl font-bold mb-4 text-gray-800'>{title}</h2>
      {!isBreakTime ? (
        <>
          <div className='mb-4'>
            <p className='text-gray-700'>
              <strong>Repetição:</strong> {sets} x {reps}
            </p>
            <p className='text-gray-700'>
              <strong>PR:</strong> {weight} kg
            </p>
            <p className='text-gray-700'>
              <strong>Descanso:</strong> {breakTime} min
            </p>
            <p className='text-gray-700'>
              <strong>Sets feitos:</strong> {setsDone}/{sets}
            </p>
          </div>
          <Button onClick={handleFinishSet} disabled={isFinished}>
            {isFinished ? 'Feito' : 'Intervalo'}
          </Button>
        </>
      ) : (
        <>
          <h2 className='text-xl font-bold mb-4 text-gray-500'>Intervalo de descanso:</h2>
          <p className='text-gray-700 text-3xl font-mono mb-4'>{formatTime(timeLeft)}</p>
          <Button
            className='bg-red-400 hover:bg-red-500 px-4 py-2 rounded text-white font-bold'
            onClick={() => {
              setIsBreakTime(false)
              setTimeLeft(0)
              setSetsDone((prev) => prev + 1)
              if (setsDone + 1 === sets) {
                setIsFinished(true)
                return
              }
            }}
          >
            Pular
          </Button>
        </>
      )}

      {isModalOpen && (
        <div className='fixed inset-0 z-10 bg-[rgba(0,0,0,0.5)] flex items-center justify-center px-4'>
          <div className='bg-white rounded-lg p-6 w-96'>
            <h2 className='text-xl font-bold mb-4'>Editar Exercício</h2>
            <form>
              <div className='mb-4'>
                <label className='block text-gray-700 font-bold mb-2'>Sets:</label>
                <input
                  type='number'
                  defaultValue={sets}
                  className='w-full border rounded px-3 py-2'
                />
              </div>
              <div className='mb-4'>
                <label className='block text-gray-700 font-bold mb-2'>Reps:</label>
                <input
                  type='number'
                  defaultValue={reps}
                  className='w-full border rounded px-3 py-2'
                />
              </div>
              <div className='mb-4'>
                <label className='block text-gray-700 font-bold mb-2'>Peso (kg):</label>
                <input
                  type='number'
                  defaultValue={weight}
                  className='w-full border rounded px-3 py-2'
                />
              </div>
              <div className='mb-4'>
                <label className='block text-gray-700 font-bold mb-2'>Tempo de Descanso (min):</label>
                <input
                  type='number'
                  defaultValue={breakTime}
                  className='w-full border rounded px-3 py-2'
                />
              </div>
              <div className='flex justify-end'>
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
                  onClick={() => setIsModalOpen(false)}
                >
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}