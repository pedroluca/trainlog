import { useState } from 'react'
import { TrainingCard } from '../components/training-card'
import { trainingData } from '../data/training-days'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

export function Training() {
  const todayIndex = new Date().getDay()
  const [currentDayIndex, setCurrentDayIndex] = useState(todayIndex)

  const currentDay = daysOfWeek[currentDayIndex]
  const trainings = trainingData[currentDay as keyof typeof trainingData]

  const handlePreviousDay = () => {
    setCurrentDayIndex((prevIndex) => (prevIndex === 0 ? 6 : prevIndex - 1))
  }

  const handleNextDay = () => {
    setCurrentDayIndex((prevIndex) => (prevIndex === 6 ? 0 : prevIndex + 1))
  }

  const hasTrainings = trainings && 'exercizes' in trainings && trainings.exercizes.length > 0

  return (
    <main className="flex flex-col items-center min-h-[calc(100vh-11rem)] bg-gray-100 p-4 mb-16">
      <div className="flex items-center justify-center w-full max-w-md mb-4">
        <button className='cursor-pointer' onClick={handlePreviousDay}>
          <ChevronLeft />
        </button>
        <h2 className="text-xl w-[60%] text-center font-bold capitalize">{currentDay}</h2>
        <button className='cursor-pointer' onClick={handleNextDay}>
          <ChevronRight />
        </button>
      </div>

      {trainings && 'muscles' in trainings && (
        <>
          <h3 className="text-lg self-start font-semibold mb-2">Dia de: {trainings.muscles}</h3>
          <h3 className="text-lg self-start font-semibold mb-2">Exercícios:</h3>
        </>
      )}

      {hasTrainings ? (
        trainings.exercizes.map((training, index) => (
          <TrainingCard
            key={index}
            title={training.title}
            sets={training.sets}
            reps={training.reps}
            weight={training.weight}
            breakTime={training.breakTime}
          />
        ))
      ) : (
        <p className="text-gray-700">Desculpe, você não tem treinos registrados para este dia!</p>
      )}
    </main>
  )
}