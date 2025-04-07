import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebaseConfig'
import { doc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore'
import { Button } from '../components/button'
import { EditWorkoutModal } from '../components/edit-workout-modal'
import { Treino } from '../data/get-user-workouts'
import { Pencil, Share2, Trash2 } from 'lucide-react'
import { ShareWorkoutModal } from '../components/share-workout-modal'

export function Profile() {
  const navigate = useNavigate()
  const usuarioID = localStorage.getItem('usuarioId')
  const [nome, setNome] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [workouts, setWorkouts] = useState<Treino[]>([])
  const [selectedWorkout, setSelectedWorkout] = useState<Treino | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const daysOrder = useMemo(() => ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'], [])

  useEffect(() => {
    if (!usuarioID) {
      navigate('/login')
    } else {
      const fetchUserData = async () => {
        try {
          const userDocRef = doc(db, 'usuarios', usuarioID)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const userData = userDoc.data()
            setNome(userData.nome || 'Não disponível')
            setEmail(userData.email || 'Não disponível')
          } else {
            console.error('Usuário não encontrado no Firestore')
          }
        } catch (err) {
          console.error('Erro ao buscar dados do usuário:', err)
        }
      }

      const fetchWorkouts = async () => {
        try {
          const workoutsRef = collection(db, 'treinos')
          const querySnapshot = await getDocs(workoutsRef)
          const userWorkouts: Treino[] = querySnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as Treino))
            .filter((workout) => workout.usuarioID === usuarioID)
            .sort((a, b) => daysOrder.indexOf(a.dia) - daysOrder.indexOf(b.dia)) // Ordena os treinos pelo dia
          setWorkouts(userWorkouts)
        } catch (err) {
          console.error('Erro ao buscar treinos:', err)
        }
      }

      fetchUserData()
      fetchWorkouts()
    }
  }, [usuarioID, navigate, daysOrder])

  const handleLogout = () => {
    auth.signOut()
    localStorage.clear()
    navigate('/login')
  }

  const handleShareWorkout = (workout: Treino) => {
    setSelectedWorkout(workout)
    setIsShareModalOpen(true)
  }

  const handleEditWorkout = (workout: Treino) => {
    setSelectedWorkout(workout)
    setIsEditModalOpen(true)
  }
  
  const handleDeleteWorkout = (workout: Treino) => {
    setSelectedWorkout(workout)
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteWorkout = async () => {
    if (!selectedWorkout) return
    try {
      const workoutRef = doc(db, 'treinos', selectedWorkout.id)
      await deleteDoc(workoutRef)
      setIsDeleteModalOpen(false)
      setSelectedWorkout(null)
      const fetchWorkouts = async () => {
        try {
          const workoutsRef = collection(db, 'treinos')
          const querySnapshot = await getDocs(workoutsRef)
          const userWorkouts: Treino[] = querySnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as Treino))
            .filter((workout) => workout.usuarioID === usuarioID)
            .sort((a, b) => daysOrder.indexOf(a.dia) - daysOrder.indexOf(b.dia)) // Ordena os treinos pelo dia
          setWorkouts(userWorkouts)
        } catch (err) {
          console.error('Erro ao buscar treinos:', err)
        }
      }
      fetchWorkouts()
    } catch (err) {
      console.error('Erro ao excluir treino:', err)
      alert('Erro ao excluir treino.')
    }
  }
  
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-11rem)] bg-gray-100 p-4 pb-24">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Perfil</h1>
        <div className="space-y-4">
          <div>
            <p className="text-gray-700">
              <strong>Nome:</strong> {nome || 'Carregando...'}
            </p>
          </div>
          <div>
            <p className="text-gray-700">
              <strong>Email:</strong> {email || 'Carregando...'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
        >
          Logout
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg py-6 px-4 w-full max-w-2xl mt-8">
        <h2 className="text-xl font-bold mb-4">Seus Treinos</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="border-b py-2">Dia</th>
              <th className="border-b py-2">Músculo</th>
              <th className="border-b py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {workouts.map((workout) => (
              <tr key={workout.id}>
                <td className="border-b py-2">{workout.dia}</td>
                <td className="border-b py-2">{workout.musculo}</td>
                <td className="border-b py-2">
                  <Button
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded"
                    onClick={() => handleShareWorkout(workout)}
                  >
                    <Share2 />
                  </Button>
                  <Button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded ml-2"
                    onClick={() => handleEditWorkout(workout)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded mt-2 md:mt-0 md:ml-2"
                    onClick={() => handleDeleteWorkout(workout)}
                  >
                    <Trash2 />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isEditModalOpen && selectedWorkout && (
        <EditWorkoutModal
          workout={selectedWorkout}
          onClose={() => setIsEditModalOpen(false)}
          onSave={() => {
            setIsEditModalOpen(false)
            const fetchWorkouts = async () => {
              try {
                const workoutsRef = collection(db, 'treinos')
                const querySnapshot = await getDocs(workoutsRef)
                const userWorkouts: Treino[] = querySnapshot.docs
                  .map((doc) => ({ id: doc.id, ...doc.data() } as Treino))
                  .filter((workout) => workout.usuarioID === usuarioID)
                  .sort((a, b) => daysOrder.indexOf(a.dia) - daysOrder.indexOf(b.dia)) // Ordena os treinos pelo dia
                setWorkouts(userWorkouts)
              } catch (err) {
                console.error('Erro ao buscar treinos:', err)
              }
            }
            fetchWorkouts()
          }}
        />
      )}

      {isDeleteModalOpen && selectedWorkout && (
        <div className="fixed inset-0 z-20 bg-[rgba(0,0,0,0.5)] flex items-center justify-center px-4">
          <div className="bg-white rounded-lg p-6 w-80">
            <h2 className="text-xl font-bold mb-4">Confirmar Exclusão</h2>
            <p className="text-gray-700 mb-6">Tem certeza de que deseja excluir este treino?</p>
            <div className="flex justify-end">
              <Button
                type="button"
                buttonTextColor="text-gray-800"
                className="bg-gray-300 hover:bg-gray-400 mr-2"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="bg-red-500 hover:bg-red-600"
                onClick={confirmDeleteWorkout}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {isShareModalOpen && selectedWorkout && (
        <ShareWorkoutModal
          workoutId={selectedWorkout.id}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      <p className="text-sm text-gray-400 mt-8">
        Desenvolvido com ❤️ por <a href="https://pedroluca.tech" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Pedro Luca Prates</a>.
      </p>
    </main>
  )
}