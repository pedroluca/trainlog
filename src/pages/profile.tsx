import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebaseConfig'
import { doc, getDoc, collection, getDocs, deleteDoc, query, where, updateDoc, addDoc } from 'firebase/firestore'
import { Button } from '../components/button'
import { EditWorkoutModal } from '../components/edit-workout-modal'
import { getUserWorkouts, Treino } from '../data/get-user-workouts'
import { Pencil, Share2, Trash2, Camera, Settings, Activity, Plus } from 'lucide-react'
import { ShareWorkoutModal } from '../components/share-workout-modal'
import { getVersionWithPrefix } from '../version'
import { updateScheduledDays } from '../data/streak-utils'
import { PremiumUpgradeModal } from '../components/premium-upgrade-modal'
import { Toast, ToastState } from '../components/toast'

export function Profile() {
  const navigate = useNavigate()
  const usuarioID = localStorage.getItem('usuarioId')
  const [nome, setNome] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [telefone, setTelefone] = useState<string | null>(null)
  const [photoURL, setPhotoURL] = useState<string | null>(null)
  const [altura, setAltura] = useState<number>(0) // cm
  const [peso, setPeso] = useState<number>(0) // kg
  const [isPremium, setIsPremium] = useState<boolean>(false)
  const [isEditingMetrics, setIsEditingMetrics] = useState(false)
  const [editedAltura, setEditedAltura] = useState<string>('')
  const [editedPeso, setEditedPeso] = useState<string>('')
  const [workouts, setWorkouts] = useState<Treino[]>([])
  const [selectedWorkout, setSelectedWorkout] = useState<Treino | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [disabledDays, setDisabledDays] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success'
  })

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
            setTelefone(userData.telefone || null)
            setPhotoURL(userData.photoURL || null)
            setAltura(userData.altura || 0)
            setPeso(userData.peso || 0)
            setIsPremium(userData.isPremium || false)
            setEditedAltura(userData.altura ? (userData.altura / 100).toFixed(2) : '')
            setEditedPeso(userData.peso ? userData.peso.toFixed(1) : '')
            setCurrentStreak(userData.currentStreak || 0)
            setLongestStreak(userData.longestStreak || 0)
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
          
          // Update scheduled days based on user's workouts
          await updateScheduledDays(usuarioID)
        } catch (err) {
          console.error('Erro ao buscar treinos:', err)
        } finally {
          setLoading(false)
        }
      }

      fetchUserData()
      fetchWorkouts()
      
      // Listen for streak updates
      const handleStreakUpdate = (event: CustomEvent) => {
        setCurrentStreak(event.detail.newStreak)
        // Also update longest streak if needed
        if (event.detail.newStreak > longestStreak) {
          setLongestStreak(event.detail.newStreak)
        }
      }
      
      window.addEventListener('streakUpdated', handleStreakUpdate as EventListener)
      
      return () => {
        window.removeEventListener('streakUpdated', handleStreakUpdate as EventListener)
      }
    }
  }, [usuarioID, navigate, daysOrder, longestStreak])

  const handleLogout = () => {
    auth.signOut()
    localStorage.clear()
    navigate('/login')
  }

  const calculateIMC = (peso: number, altura: number) => {
    if (!peso || !altura) return 0
    const alturaMetros = altura / 100
    return peso / (alturaMetros * alturaMetros)
  }

  const getIMCStatus = (imc: number) => {
    if (imc === 0) return { label: 'N/A', color: 'text-gray-500' }
    if (imc < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-600' }
    if (imc < 25) return { label: 'Normal', color: 'text-green-600' }
    if (imc < 30) return { label: 'Sobrepeso', color: 'text-yellow-600' }
    return { label: 'Obesidade', color: 'text-red-600' }
  }

  const handleSaveMetrics = async () => {
    if (!usuarioID) return
    
    try {
      const alturaEmCm = parseFloat(editedAltura) * 100
      const pesoEmKg = parseFloat(editedPeso)
      
      if (!alturaEmCm || !pesoEmKg || alturaEmCm < 50 || alturaEmCm > 300 || pesoEmKg < 20 || pesoEmKg > 500) {
        setToast({ show: true, message: 'Por favor, insira valores válidos (Altura: 0.50-3.00m, Peso: 20-500kg)', type: 'error' })
        return
      }

      const imc = calculateIMC(pesoEmKg, alturaEmCm)

      // Update user document
      await updateDoc(doc(db, 'usuarios', usuarioID), {
        altura: alturaEmCm,
        peso: pesoEmKg
      })

      // Add to body measurements collection (first measurement or update)
      const measurementsRef = collection(db, 'medicoescorporais')
      await addDoc(measurementsRef, {
        usuarioID: usuarioID,
        data: new Date().toISOString(),
        peso: pesoEmKg,
        altura: alturaEmCm,
        imc: parseFloat(imc.toFixed(1))
      })

      setAltura(alturaEmCm)
      setPeso(pesoEmKg)
      setIsEditingMetrics(false)
      
      setToast({ show: true, message: 'Métricas atualizadas com sucesso!', type: 'success' })
    } catch (err) {
      console.error('Erro ao salvar métricas:', err)
      setToast({ show: true, message: 'Erro ao salvar métricas. Tente novamente.', type: 'error' })
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !usuarioID) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setToast({ show: true, message: 'Por favor, selecione uma imagem válida', type: 'error' })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({ show: true, message: 'A imagem deve ter no máximo 5MB', type: 'error' })
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
      
      setToast({ show: true, message: 'Foto de perfil atualizada com sucesso!', type: 'success' })
    } catch (err) {
      console.error('Erro ao fazer upload da imagem:', err)
      setToast({ show: true, message: 'Erro ao atualizar foto de perfil. Tente novamente.', type: 'error' })
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
      setToast({ show: true, message: 'Erro ao excluir treino.', type: 'error' })
    }
  }

  const handleOpenUpgradeModal = () => {
    setIsUpgradeModalOpen(true)
  }

  const handleCloseUpgradeModal = () => {
    setIsUpgradeModalOpen(false)
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-11rem)] bg-gray-100 dark:bg-[#1a1a1a] p-4 pb-24">
      {/* Profile Card */}
      <div className="bg-white dark:bg-[#2d2d2d] shadow-lg rounded-xl p-8 w-full max-w-lg border border-gray-200 dark:border-[#404040]">
        <div className="flex flex-col items-center mb-6 relative">
          {/* Plan Badge */}
          {isPremium ? (
            <div className="absolute -top-4 -right-4 bg-gradient-to-br from-amber-400 to-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center">
              <span className="w-full text-center">PREMIUM</span>
            </div>
          ) : (
            <div className="absolute -top-4 -right-4 bg-gradient-to-br from-gray-400 to-gray-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center" onClick={() => handleOpenUpgradeModal()}>
              <span className="w-full text-center">FREE</span>
            </div>
          )}

          {/* Avatar Circle with Image Upload */}
          <div className="relative mb-4">
            <div className={`w-20 h-20 bg-gradient-to-br from-[#27AE60] to-[#219150] rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden ${
              isPremium ? 'ring-4 ring-amber-400 dark:ring-amber-500 shadow-lg shadow-amber-400/50' : ''
            }`}>
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
              className="absolute bottom-1 -right-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1.5 cursor-pointer shadow-lg transition-colors"
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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-3">Perfil</h1>
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
        
        {/* Workout Streak Section */}
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20 rounded-lg p-4 border border-orange-500/30 dark:border-orange-500/40 mb-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-3">
            <span className="text-2xl">🔥</span>
            Sequência de Treinos
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-200 dark:border-[#404040]">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sequência Atual</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{currentStreak}</p>
            </div>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-200 dark:border-[#404040]">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Melhor Sequência</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{longestStreak}</p>
            </div>
          </div>
          
          {isPremium ? (
            <button
              onClick={() => navigate('/streak-calendar')}
              className="w-full mt-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              📅 Ver Calendário Completo
            </button>
          ) : (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 text-center">
              Complete seus treinos programados para manter a sequência!
            </p>
          )}
        </div>
        
        {/* Body Metrics Section */}
        <div className="bg-gradient-to-br from-[#27AE60]/10 to-[#219150]/10 dark:from-[#27AE60]/20 dark:to-[#219150]/20 rounded-lg p-4 border border-[#27AE60]/30 dark:border-[#27AE60]/40 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Activity size={20} className="text-[#27AE60]" />
              Métricas Corporais
            </h3>
            {!isEditingMetrics && altura > 0 && peso > 0 && (
              <button
                onClick={() => setIsEditingMetrics(true)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Editar
              </button>
            )}
          </div>

          {!isEditingMetrics ? (
            <>
              {altura > 0 && peso > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-200 dark:border-[#404040]">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Altura</p>
                      <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{(altura / 100).toFixed(2)}m</p>
                    </div>
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-200 dark:border-[#404040]">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Peso</p>
                      <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{peso.toFixed(1)}kg</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-200 dark:border-[#404040] mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">IMC</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{calculateIMC(peso, altura).toFixed(1)}</p>
                      <p className={`text-sm font-medium ${getIMCStatus(calculateIMC(peso, altura)).color}`}>
                        {getIMCStatus(calculateIMC(peso, altura)).label}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditingMetrics(true)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Nova Medição
                    </button>
                    {isPremium && (
                      <button
                        onClick={() => navigate('/body-metrics')}
                        className="flex-1 bg-[#27AE60] hover:bg-[#219150] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
                      >
                        Ver Histórico
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">Configure suas métricas corporais</p>
                  <button
                    onClick={() => setIsEditingMetrics(true)}
                    className="bg-[#27AE60] hover:bg-[#219150] text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    Adicionar Altura e Peso
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Altura (metros)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditedAltura((prev) => Math.max(0.5, parseFloat(prev || '0') - 0.01).toFixed(2))}
                    className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    value={editedAltura}
                    onChange={(e) => setEditedAltura(e.target.value)}
                    className="flex-1 border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100 text-center"
                    placeholder="1.75"
                  />
                  <button
                    type="button"
                    onClick={() => setEditedAltura((prev) => Math.min(3, parseFloat(prev || '0') + 0.01).toFixed(2))}
                    className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Peso (kg)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditedPeso((prev) => Math.max(20, parseFloat(prev || '0') - 0.1).toFixed(1))}
                    className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    value={editedPeso}
                    onChange={(e) => setEditedPeso(e.target.value)}
                    className="flex-1 border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100 text-center"
                    placeholder="75.0"
                  />
                  <button
                    type="button"
                    onClick={() => setEditedPeso((prev) => Math.min(500, parseFloat(prev || '0') + 0.1).toFixed(1))}
                    className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsEditingMetrics(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveMetrics}
                  className="flex-1 bg-[#27AE60] hover:bg-[#219150] text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={() => navigate('/settings')}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md mt-3 flex items-center justify-center gap-2"
        >
          <Settings size={20} />
          Configurações
        </button>
      </div>

      {/* Workouts Section */}
      <div className="bg-white dark:bg-[#2d2d2d] shadow-lg rounded-xl py-6 px-4 w-full max-w-lg mt-8 border border-gray-200 dark:border-[#404040]">
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

      {/* Logout Section */}
      <div className="bg-white dark:bg-[#2d2d2d] shadow-lg rounded-xl p-8 w-full max-w-lg mt-8 border border-gray-200 dark:border-[#404040]">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md"
        >
          Sair da Conta
        </button>
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

      {isUpgradeModalOpen && (
        <PremiumUpgradeModal  
          isOpen={isUpgradeModalOpen}
          onClose={handleCloseUpgradeModal}
          userEmail={email || ''}
          userName={nome || ''}
          userId={usuarioID || ''}
          userPhone={telefone || ''}
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
            href='https://pedroluca.dev.br' 
            target='_blank' 
            rel='noopener noreferrer' 
            className='text-[#27AE60] hover:text-[#219150] font-medium transition-colors'
          >
            Pedro Luca Prates
          </a>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{getVersionWithPrefix()}</p>
      </div>
      
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
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