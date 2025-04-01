import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebaseConfig'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { Button } from '../components/button'
import { EditWorkoutModal } from '../components/edit-workout-modal'
import { Treino } from '../data/get-user-workouts'

export function Profile() {
  const navigate = useNavigate()
  const usuarioID = localStorage.getItem('usuarioId')
  const [nome, setNome] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [workouts, setWorkouts] = useState<Treino[]>([])
  const [selectedWorkout, setSelectedWorkout] = useState<Treino | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Ordem dos dias da semana
  const daysOrder = useMemo(() => ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'], [])

  // Verifica se o usuário está logado
  useEffect(() => {
    if (!usuarioID) {
      navigate('/login') // Redireciona para a página de login se não estiver logado
    } else {
      // Busca os dados do usuário no Firestore
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

      // Busca os treinos do usuário
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

  const handleEditWorkout = (workout: Treino) => {
    setSelectedWorkout(workout)
    setIsEditModalOpen(true)
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
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
                    onClick={() => handleEditWorkout(workout)}
                  >
                    Editar
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
            // Atualiza a lista de treinos após salvar
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
    </main>
  )
}