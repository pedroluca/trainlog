import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebaseConfig'
import { doc, getDoc, collection, getDocs, deleteDoc, query, where, updateDoc } from 'firebase/firestore'
import { Button } from '../components/button'
import { EditWorkoutModal } from '../components/edit-workout-modal'
import { getUserWorkouts, Treino } from '../data/get-user-workouts'
import { Pencil, Share2, Trash2, Camera, Settings } from 'lucide-react'
import { ShareWorkoutModal } from '../components/share-workout-modal'
import { getVersionWithPrefix } from '../version'

export function Profile() {
  const navigate = useNavigate()
  const usuarioID = localStorage.getItem('usuarioId')
  const [nome, setNome] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [photoURL, setPhotoURL] = useState<string | null>(null)
  const [workouts, setWorkouts] = useState<Treino[]>([])
  const [selectedWorkout, setSelectedWorkout] = useState<Treino | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [disabledDays, setDisabledDays] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)

  const daysOrder = useMemo(() => ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'], [])

  useEffect(() => {
    const fetchDisabledDays = async () => {
      try {
        const workoutsRef = collection(db, 'treinos')
        const querySnapshot = await getDocs(
          query(workoutsRef, where('usuarioID', '==', usuarioID))
        )
        const days = querySnapshot.docs
          .map((doc) => doc.data().dia as string)
          .filter((day, index, self) => self.indexOf(day) === index)
        setDisabledDays(days)
      } catch (err) {
        console.error('Erro ao buscar dias com treinos cadastrados:', err)
      }
    }

    fetchDisabledDays()
  }, [usuarioID])
  
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
            setPhotoURL(userData.photoURL || null)
          } else {
            console.error('Usuário não encontrado no Firestore')
          }
        } catch (err) {
          console.error('Erro ao buscar dados do usuário:', err)
        }
      }

      const fetchWorkouts = async () => {
        try {
          if (!usuarioID) {
            console.error('Erro: usuarioID é nulo')
            setLoading(false)
            return
          }
      
          const userWorkouts = await getUserWorkouts(usuarioID) // Usa a função que já filtra pelo usuário
          const sortedWorkouts = userWorkouts.sort(
            (a, b) => daysOrder.indexOf(a.dia) - daysOrder.indexOf(b.dia) // Ordena os treinos pelo dia
          )
          setWorkouts(sortedWorkouts)
        } catch (err) {
          console.error('Erro ao buscar treinos:', err)
        } finally {
          setLoading(false)
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !usuarioID) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB')
      return
    }

    try {
      setUploadingImage(true)

      // Create FormData for Cloudinary upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)
      formData.append('folder', 'profile-images')
      formData.append('public_id', usuarioID) // Use userId as filename (overwrites old image)

      // Upload to Cloudinary
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`
      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Falha no upload da imagem')
      }

      const data = await response.json()
      const downloadURL = data.secure_url

      // Update Firestore user document
      await updateDoc(doc(db, 'usuarios', usuarioID), {
        photoURL: downloadURL
      })

      // Update local state
      setPhotoURL(downloadURL)
      
      alert('Foto de perfil atualizada com sucesso!')
    } catch (err) {
      console.error('Erro ao fazer upload da imagem:', err)
      alert('Erro ao atualizar foto de perfil. Tente novamente.')
    } finally {
      setUploadingImage(false)
    }
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
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-11rem)] bg-gray-100 dark:bg-[#1a1a1a] p-4 pb-24">
      {/* Profile Card */}
      <div className="bg-white dark:bg-[#2d2d2d] shadow-lg rounded-xl p-8 w-full max-w-md border border-gray-200 dark:border-[#404040]">
        <div className="flex flex-col items-center mb-6">
          {/* Avatar Circle with Image Upload */}
          <div className="relative mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[#27AE60] to-[#219150] rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {photoURL ? (
                <img 
                  src={photoURL} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                nome ? nome.charAt(0).toUpperCase() : '?'
              )}
            </div>
            
            {/* Edit Icon Button */}
            <label 
              htmlFor="profile-image-upload"
              className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1.5 cursor-pointer shadow-lg transition-colors"
              title="Alterar foto de perfil"
            >
              {uploadingImage ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Camera size={16} />
              )}
            </label>
            <input
              id="profile-image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploadingImage}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Perfil</h1>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#404040]">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Nome</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {nome || 'Carregando...'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#404040]">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {email || 'Carregando...'}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md"
        >
          Sair da Conta
        </button>
        
        <button
          onClick={() => navigate('/settings')}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md mt-3 flex items-center justify-center gap-2"
        >
          <Settings size={20} />
          Configurações
        </button>
      </div>

      {/* Workouts Section */}
      <div className="bg-white dark:bg-[#2d2d2d] shadow-lg rounded-xl py-6 px-4 w-full max-w-2xl mt-8 border border-gray-200 dark:border-[#404040]">
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Seus Treinos</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1a1a1a] px-3 py-1 rounded-full">
            {workouts.length} {workouts.length === 1 ? 'treino' : 'treinos'}
          </span>
        </div>
        
        {loading ? (
          <div className="space-y-3">
            <WorkoutCardSkeleton />
            <WorkoutCardSkeleton />
            <WorkoutCardSkeleton />
          </div>
        ) : workouts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">Você ainda não tem treinos cadastrados</p>
            <Button
              onClick={() => navigate('/train')}
              className="bg-[#27AE60] hover:bg-[#219150] text-white px-6 py-2"
            >
              Criar Primeiro Treino
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {workouts.map((workout) => (
              <div
                key={workout.id}
                className="bg-gray-50 dark:bg-[#1a1a1a] hover:bg-gray-100 dark:hover:bg-[#252525] border border-gray-200 dark:border-[#404040] rounded-lg p-4 transition-colors"
              >
                {/* Info Section */}
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
                    {workout.dia}
                  </h3>
                  <p className="text-base text-gray-600 dark:text-gray-400">
                    {workout.musculo}
                  </p>
                </div>
                
                {/* Actions Section */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    className="text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all"
                    bgColor='bg-[#F1C40F] hover:bg-[#D4AC0D]'
                    onClick={() => handleShareWorkout(workout)}
                    title="Compartilhar treino"
                  >
                    <Share2 size={20} />
                  </Button>
                  <Button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all"
                    onClick={() => handleEditWorkout(workout)}
                    title="Editar treino"
                  >
                    <Pencil size={20} />
                  </Button>
                  <Button
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all"
                    onClick={() => handleDeleteWorkout(workout)}
                    title="Excluir treino"
                  >
                    <Trash2 size={20} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
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
          disabledDays={disabledDays} // Passa os dias desabilitados para o modal
        />
      )}

      {isDeleteModalOpen && selectedWorkout && (
        <div className="fixed inset-0 z-20 bg-[rgba(0,0,0,0.5)] dark:bg-[rgba(0,0,0,0.7)] flex items-center justify-center px-4">
          <div className="bg-white dark:bg-[#2d2d2d] rounded-lg p-6 w-80 border border-gray-200 dark:border-[#404040]">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Confirmar Exclusão</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">Tem certeza de que deseja excluir este treino?</p>
            <div className="flex justify-end">
              <Button
                type="button"
                buttonTextColor="text-gray-800 dark:text-gray-100"
                className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 mr-2"
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

      {/* Footer Info Section */}
      <div className="mt-12 text-center space-y-2 pb-8">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} TrainLog. All rights reserved.
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Desenvolvido por{' '}
          <a 
            href='https://pedroluca.tech' 
            target='_blank' 
            rel='noopener noreferrer' 
            className='text-[#27AE60] hover:text-[#219150] font-medium transition-colors'
          >
            Pedro Luca Prates
          </a>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{getVersionWithPrefix()}</p>
      </div>
    </main>
  )
}

export const WorkoutCardSkeleton = () => {
  return (
    <div className='animate-pulse bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#404040] rounded-lg p-4'>
      <div className='mb-3'>
        <div className='h-6 w-32 bg-gray-300 dark:bg-gray-600 rounded mb-2'></div>
        <div className='h-5 w-40 bg-gray-300 dark:bg-gray-600 rounded'></div>
      </div>
      <div className='flex gap-2'>
        <div className='h-11 w-12 bg-gray-300 dark:bg-gray-600 rounded-lg'></div>
        <div className='h-11 w-12 bg-gray-300 dark:bg-gray-600 rounded-lg'></div>
        <div className='h-11 w-12 bg-gray-300 dark:bg-gray-600 rounded-lg'></div>
      </div>
    </div>
  )
}