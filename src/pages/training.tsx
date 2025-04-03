import { useCallback, useEffect, useState } from 'react'
import { TrainingCard } from '../components/training-card'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getUserWorkouts, Treino } from '../data/get-user-workouts'
import { getWorkoutExercises, Exercicio } from '../data/get-workout-exercises'
import { Button } from '../components/button'
import { AddWorkoutModal } from '../components/add-workout-modal'
import { AddExerciseModal } from '../components/add-exercise-modal'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'

const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

export function Training() {
  const todayIndex = new Date().getDay()
  const [currentDayIndex, setCurrentDayIndex] = useState(todayIndex)
  const [workouts, setWorkouts] = useState<Treino[]>([])
  const [exercises, setExercises] = useState<Exercicio[]>([])
  const [loading, setLoading] = useState(true)
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false)
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState<Treino | null>(null)
  const usuarioID = localStorage.getItem('usuarioId')
  const navigate = useNavigate()
  const [reset, setReset] = useState(false)

  if (!usuarioID) {
    navigate('/login')
  }

  const fetchWorkouts = useCallback(async () => {
    try {
      if (!usuarioID) {
        console.error('Error: usuarioID is null')
        setLoading(false)
        return
      }
      const data = await getUserWorkouts(usuarioID)
      setWorkouts(data)
    } catch (err) {
      console.error('Error fetching workouts:', err)
    } finally {
      setLoading(false)
    }
  }, [usuarioID])

  const fetchExercisesForDay = useCallback(async () => {
    const selectedDay = daysOfWeek[currentDayIndex]
    const workoutForDay = workouts.find(
      (workout) => workout.dia.toLowerCase() === selectedDay.toLowerCase()
    )

    setSelectedWorkout(workoutForDay || null)

    if (workoutForDay) {
      try {
        const exercisesData = await getWorkoutExercises(workoutForDay.id)
        setExercises(exercisesData)
      } catch (err) {
        console.error('Erro ao buscar exercícios para o dia selecionado:', err)
      }
    } else {
      setExercises([])
    }
  }, [workouts, currentDayIndex])

  useEffect(() => {
    fetchWorkouts()
    setReset(false)
  }, [fetchWorkouts])

  useEffect(() => {
    if (workouts.length > 0) {
      fetchExercisesForDay()
    }
  }, [workouts, fetchExercisesForDay])

  const handlePreviousDay = () => {
    setCurrentDayIndex((prevIndex) => (prevIndex === 0 ? 6 : prevIndex - 1))
  }

  const handleNextDay = () => {
    setCurrentDayIndex((prevIndex) => (prevIndex === 6 ? 0 : prevIndex + 1))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <div className="animate-spin w-16 h-16 text-gray-500" />
      </div>
    )
  }

  return (
    <main className="flex flex-col items-center min-h-[calc(100vh-11rem)] bg-gray-100 p-4 mb-16 lg:px-64">
      <div className="flex items-center justify-center w-full max-w-md mb-4">
        <button className="cursor-pointer" onClick={handlePreviousDay}>
          <ChevronLeft />
        </button>
        <h2 className="text-xl w-[60%] text-center font-bold capitalize">{daysOfWeek[currentDayIndex]}</h2>
        <button className="cursor-pointer" onClick={handleNextDay}>
          <ChevronRight />
        </button>
      </div>

      {selectedWorkout ? (
        <>
          <h3 className="text-lg self-start font-semibold mb-2">Dia de: {selectedWorkout.musculo}</h3>
          <h3 className="text-lg self-start font-semibold mb-2">Exercícios:</h3>
          <Button
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded mt-4"
            onClick={async () => {
              if (selectedWorkout) {
                try {
                  const exercisesRef = collection(db, 'treinos', selectedWorkout.id, 'exercicios')
                  const querySnapshot = await getDocs(exercisesRef)
                  const resetPromises = querySnapshot.docs.map((doc) =>
                    updateDoc(doc.ref, { isFeito: false })
                  )
                  await Promise.all(resetPromises)
                  setReset(true)
                  fetchExercisesForDay() // Atualiza a lista de exercícios
                  alert('Todos os exercícios foram resetados!')
                } catch (err) {
                  console.error('Erro ao resetar exercícios:', err)
                  alert('Erro ao resetar exercícios.')
                }
              }
            }}
          >
            Resetar Exercícios
          </Button>
          <Button
            className="bg-gray-200 border-1 border-gray-400 hover:bg-gray-400 mt-4"
            buttonTextColor="text-gray-500 hover:text-white"
            onClick={() => setIsExerciseModalOpen(true)}
          >
            Adicionar exercício
          </Button>
          {exercises.length > 0 ? (
            <section className='w-full grid grid-cols-1 sm:grid-cols-2'>
              {exercises.map((exercise) => (
                <TrainingCard
                  key={exercise.id}
                  id={exercise.id} // Passa o ID do exercício
                  workoutId={selectedWorkout.id} // Passa o ID do treino
                  title={exercise.titulo}
                  sets={exercise.series}
                  reps={exercise.repeticoes}
                  weight={exercise.peso}
                  breakTime={exercise.tempoIntervalo}
                  isFeito={exercise.isFeito}
                  reset={reset}
                  onEdit={() => fetchExercisesForDay()} // Atualiza a lista após edição
                />
              ))}
            </section>
          ) : (
            <>
              <p className="text-gray-700 mt-4 text-center">Desculpe, você ainda não tem exercícios registrados para este treino!</p>
            </>
          )}
        </>
      ) : (
        <>
          <p className="text-gray-700">Desculpe, você não tem treinos registrados para este dia!</p>
          <Button
            className="bg-gray-200 border-1 border-gray-400 hover:bg-gray-400 mt-4"
            buttonTextColor="text-gray-500 hover:text-white"
            onClick={() => setIsWorkoutModalOpen(true)}
          >
            Adicionar treino
          </Button>
        </>
      )}

      {isWorkoutModalOpen && (
        <AddWorkoutModal
          onClose={() => {
            setIsWorkoutModalOpen(false)
            fetchWorkouts()
          }}
          currentDay={daysOfWeek[currentDayIndex]}
          usuarioID={usuarioID}
        />
      )}

      {isExerciseModalOpen && selectedWorkout && (
        <AddExerciseModal
          onClose={() => {
            setIsExerciseModalOpen(false)
            fetchExercisesForDay()
          }}
          workoutId={selectedWorkout.id}
        />
      )}
    </main>
  )
}