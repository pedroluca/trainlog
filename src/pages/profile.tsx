import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebaseConfig'
import { doc, getDoc, collection, getDocs, deleteDoc, query, where, updateDoc, addDoc } from 'firebase/firestore'
import { Button } from '../components/button'
import { EditWorkoutModal } from '../components/edit-workout-modal'
import { getUserWorkouts, Treino } from '../data/get-user-workouts'
import { Pencil, Share2, Trash2, Camera, Settings, Activity, Plus, FileText, X, Flame, CalendarDays, Minus } from 'lucide-react'
import { ShareWorkoutModal } from '../components/share-workout-modal'
import { getVersionWithPrefix } from '../version'
import { updateScheduledDays } from '../data/streak-utils'
import { PremiumUpgradeModal } from '../components/premium-upgrade-modal'
import { Toast, ToastState } from '../components/toast'
import { WhatsNewModal } from '../components/whats-new-modal'

export function Profile() {
  const navigate = useNavigate()
  const usuarioID = localStorage.getItem('usuarioId')
  const [nome, setNome] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [telefone, setTelefone] = useState<string | null>(null)
  const [photoURL, setPhotoURL] = useState<string | null>(null)
  const [dataNascimento, setDataNascimento] = useState<string | null>(null)
  const [instagram, setInstagram] = useState<string | null>(null)
  const [altura, setAltura] = useState<number>(0) // cm
  const [peso, setPeso] = useState<number>(0) // kg
  const [username, setUsername] = useState<string | null>(null)
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
  const [isWhatsNewModalOpen, setIsWhatsNewModalOpen] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editedNome, setEditedNome] = useState('')
  const [editedUsername, setEditedUsername] = useState('')
  const [editedDataNascimento, setEditedDataNascimento] = useState('')
  const [editedInstagram, setEditedInstagram] = useState('')
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success'
  })

  const daysOrder = useMemo(() => ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'], [])

  const fetchDisabledDays = useCallback(async () => {
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
  }, [usuarioID])

  useEffect(() => {
    fetchDisabledDays()
  }, [fetchDisabledDays])
  
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
            setDataNascimento(userData.dataNascimento || null)
            setInstagram(userData.instagram || null)
            setAltura(userData.altura || 0)
            setPeso(userData.peso || 0)
            setUsername(userData.username || null)
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

      // Create FormData for API Upload
      const formData = new FormData()
      formData.append('image', file)
      formData.append('userId', usuarioID)

      // Use a variável de ambiente ou substitua essa string diretamente pela URL real do seu PHP na Hostinger
      const apiUrl = import.meta.env.VITE_API_UPLOAD_URL
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Falha no upload da imagem no servidor')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Falha na resposta do servidor')
      }

      const downloadURL = data.imageUrl

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

  const handleOpenEditProfile = () => {
    setEditedNome(nome || '')
    setEditedUsername(username || '')
    setEditedDataNascimento(dataNascimento || '')
    setEditedInstagram(instagram?.replace(/^@/, '') || '')
    setIsEditingProfile(true)
  }

  const handleSaveProfile = async () => {
    if (!usuarioID) return
    try {
      const trimmedUsername = editedUsername.trim()

      // Verifica unicidade do username (apenas se foi alterado)
      if (trimmedUsername && trimmedUsername !== username) {
        const usersRef = collection(db, 'usuarios')
        const usernameQuery = query(usersRef, where('username', '==', trimmedUsername))
        const usernameSnap = await getDocs(usernameQuery)
        const alreadyExists = usernameSnap.docs.some(d => d.id !== usuarioID)
        if (alreadyExists) {
          setToast({ show: true, message: `O username "@${trimmedUsername}" já está em uso.`, type: 'error' })
          return
        }
      }

      await updateDoc(doc(db, 'usuarios', usuarioID), {
        nome: editedNome.trim(),
        username: trimmedUsername,
        dataNascimento: editedDataNascimento,
        instagram: editedInstagram.replace(/^@/, '').trim(),
      })
      setNome(editedNome.trim())
      setUsername(trimmedUsername)
      setDataNascimento(editedDataNascimento)
      setInstagram(editedInstagram.replace(/^@/, '').trim())
      setIsEditingProfile(false)
      setToast({ show: true, message: 'Perfil atualizado com sucesso!', type: 'success' })
    } catch (err) {
      console.error('Erro ao salvar perfil:', err)
      setToast({ show: true, message: 'Erro ao salvar. Tente novamente.', type: 'error' })
    }
  }

  return (
    <main className="flex flex-col items-center justify-start min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[#121212] p-4 pb-24 md:py-8">
      {/* Profile Card */}
      <div className="relative grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-4 bg-white dark:bg-[#1e1e1e] shadow-xl shadow-black/5 dark:shadow-black/20 rounded-2xl p-5 pt-10 md:pt-6 w-full max-w-lg md:max-w-3xl lg:max-w-5xl border border-gray-100 dark:border-[#2a2a2a] transition-all">
        {/* Edit Profile Button */}
        <button
          onClick={handleOpenEditProfile}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-50 dark:bg-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#333] text-gray-500 dark:text-gray-300 transition-colors shadow-sm"
          title="Editar perfil"
        >
          <Pencil size={16} />
        </button>
        {/* Avatar */}
        <div className="md:col-span-1 lg:col-span-4 flex flex-col items-center relative">
          {/* Plan Badge */}
          {isPremium ? (
            <div className="absolute -top-6 md:-top-2 lg:top-0 left-1/2 -translate-x-1/2 md:-translate-x-0 md:left-0 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] uppercase font-black tracking-wider px-3 py-1 rounded-full shadow-lg shadow-amber-500/30 flex items-center z-10 w-max">
              <span>PREMIUM</span>
            </div>
          ) : (
            <div className="absolute -top-6 md:-top-2 lg:top-0 left-1/2 -translate-x-1/2 md:-translate-x-0 md:left-0 bg-gradient-to-r from-gray-400 to-gray-600 text-white text-[10px] uppercase font-black tracking-wider px-3 py-1 rounded-full shadow-lg flex items-center z-10 w-max cursor-pointer hover:scale-105 transition-transform" onClick={() => handleOpenUpgradeModal()}>
              <span>FREE</span>
            </div>
          )}

          {/* Avatar Circle with Image Upload */}
          <div className="relative mb-3 md:mt-6 w-max mx-auto">
            <div className={`w-24 md:w-32 lg:w-40 h-24 md:h-32 lg:h-40 bg-gradient-to-br from-[#27AE60] to-[#1E8449] rounded-full flex items-center justify-center text-white text-4xl lg:text-5xl font-bold overflow-hidden shadow-inner ${
              isPremium ? 'ring-4 ring-amber-400 dark:ring-amber-500 shadow-lg shadow-amber-400/40 relative z-0' : 'ring-4 ring-white dark:ring-[#1e1e1e] relative z-0'
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
              className="absolute bottom-0 right-0 lg:bottom-2 lg:right-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 cursor-pointer shadow-lg shadow-blue-500/30 hover:scale-110 transition-all z-10"
              title="Alterar foto de perfil"
            >
              {uploadingImage ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Camera size={18} />
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
          <h1 className="text-sm md:text-base lg:text-lg font-bold text-gray-800 dark:text-gray-100">{username ? '@' + username : ''}</h1>
        </div>
        
        {/* Personal Info Fields */}
        <div className="md:col-span-3 lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="col-span-full py-1">
            <h1 className="text-2xl lg:text-3xl text-center md:text-left font-extrabold text-gray-900 dark:text-white tracking-tight">{nome || 'Carregando...'}</h1>
          </div>
          <div className="col-span-2 md:col-span-full bg-gray-50 dark:bg-[#252525] rounded-xl px-4 py-3 border border-gray-100 dark:border-[#333] transition-colors">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide font-medium">Email</p>
            <p className="text-base font-semibold text-gray-800 dark:text-gray-100">
              {email ? email : <span className="text-gray-400 dark:text-gray-500 font-normal text-sm">Não informado</span>}
            </p>
          </div>
          <div className="col-span-2 md:col-span-1 bg-gray-50 dark:bg-[#252525] rounded-xl px-4 py-3 border border-gray-100 dark:border-[#333] transition-colors">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide font-medium">Nascimento</p>
            <p className="text-base font-semibold text-gray-800 dark:text-gray-100">
              {dataNascimento ? new Date(dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR') : <span className="text-gray-400 dark:text-gray-500 font-normal text-sm">Não informado</span>}
            </p>
          </div>
          <div className="col-span-2 md:col-span-2 bg-gray-50 dark:bg-[#252525] rounded-xl px-4 py-3 border border-gray-100 dark:border-[#333] transition-colors">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide font-medium">Instagram</p>
            <p className="text-base font-semibold text-gray-800 dark:text-gray-100">
              {instagram ? (
                <span className="text-blue-500 dark:text-blue-400 hover:underline cursor-pointer">@{instagram.replace(/^@/, '')}</span>
              ) : (
                <span className="text-gray-400 dark:text-gray-500 font-normal text-sm">Não informado</span>
              )}
            </p>
          </div>

          {/* Body Metrics as info fields */}
          <div className="col-span-full grid grid-cols-3 gap-3 mt-1">
            <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl px-3 md:px-4 py-3 border border-emerald-100 dark:border-emerald-800/30">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1 uppercase tracking-wide font-bold">Altura</p>
              <p className="text-base md:text-lg font-bold text-emerald-900 dark:text-emerald-300">
                {altura > 0 ? `${(altura / 100).toFixed(2)}m` : <span className="text-emerald-400/50 font-normal text-sm">—</span>}
              </p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl px-3 md:px-4 py-3 border border-emerald-100 dark:border-emerald-800/30">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1 uppercase tracking-wide font-bold">Peso</p>
              <p className="text-base md:text-lg font-bold text-emerald-900 dark:text-emerald-300">
                {peso > 0 ? `${peso.toFixed(1)}kg` : <span className="text-emerald-400/50 font-normal text-sm">—</span>}
              </p>
            </div>
            <div className="flex flex-col justify-between bg-emerald-50 dark:bg-emerald-900/10 rounded-xl px-3 md:px-4 py-3 border border-emerald-100 dark:border-emerald-800/30">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide font-bold">IMC</p>
              {altura > 0 && peso > 0 ? (
                <div className='flex flex-col items-start'>
                  <p className="text-base md:text-lg font-bold text-emerald-900 dark:text-emerald-300 leading-tight">{calculateIMC(peso, altura).toFixed(1)}</p>
                  <p className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${getIMCStatus(calculateIMC(peso, altura)).color}`}>
                    {getIMCStatus(calculateIMC(peso, altura)).label}
                  </p>
                </div>
              ) : (
                <p className="text-emerald-400/50 font-normal text-sm mt-auto">—</p>
              )}
            </div>
          </div>

          {/* Metrics action buttons */}
          <div className="col-span-full flex gap-2">
            {!isEditingMetrics ? (
              <>
                <button
                  onClick={() => setIsEditingMetrics(true)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  {altura > 0 && peso > 0 ? 'Nova Medição' : 'Adicionar Métricas'}
                </button>
                {isPremium && altura > 0 && peso > 0 && (
                  <button
                    onClick={() => navigate('/profile/body-metrics')}
                    className="flex-1 bg-[#27AE60] hover:bg-[#219150] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Activity size={16} />
                    Ver Histórico
                  </button>
                )}
              </>
            ) : (
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Altura (metros)</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditedAltura((prev) => Math.max(0.5, parseFloat(prev || '0') - 0.01).toFixed(2))}
                      className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-14 h-10 rounded flex items-center justify-center"
                    >
                      <Minus size={16} />
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
                      className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-14 h-10 rounded flex items-center justify-center"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Peso (kg)</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditedPeso((prev) => Math.max(20, parseFloat(prev || '0') - 0.1).toFixed(1))}
                      className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-14 h-10 rounded flex items-center justify-center"
                    >
                      <Minus size={16} />
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
                      className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-14 h-10 rounded flex items-center justify-center"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
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
        </div>

        {/* Workout Streak Section */}
        <div className="md:col-span-4 lg:col-span-8 md:order-3 bg-gradient-to-br from-orange-500/10 to-red-500/10 dark:from-orange-500/15 dark:to-red-500/15 rounded-xl p-4 border border-orange-500/20 dark:border-orange-500/30 shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm md:text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 uppercase tracking-wide">
              <Flame className="text-orange-500" size={20} />
              Sequência
            </h3>
            {isPremium && (
            <button
              onClick={() => navigate('/profile/streak-calendar')}
              className="bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 text-orange-600 dark:text-orange-400 font-bold py-1.5 px-3 rounded-lg text-xs md:text-sm flex items-center gap-1.5 transition-all outline outline-orange-500/20"
            >
              <CalendarDays size={14} /> Calendário
            </button>
          )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/60 dark:bg-[#1e1e1e]/60 rounded-xl px-4 py-3 border border-orange-500/10 dark:border-orange-500/20 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider font-bold text-orange-800/60 dark:text-orange-200/50 mb-1">Atual</p>
              <p className="text-2xl lg:text-3xl font-black text-orange-600 dark:text-orange-400">{currentStreak}</p>
            </div>
            <div className="bg-white/60 dark:bg-[#1e1e1e]/60 rounded-xl px-4 py-3 border border-orange-500/10 dark:border-orange-500/20 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1">Recorde</p>
              <p className="text-2xl lg:text-3xl font-black text-gray-800 dark:text-gray-100">{longestStreak}</p>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-4 md:order-2 flex flex-col md:flex-row lg:flex-col gap-3">
          <button
            onClick={() => navigate('/profile/settings')}
            className="flex-1 bg-white dark:bg-[#252525] hover:bg-gray-50 dark:hover:bg-[#333] border border-gray-200 dark:border-[#333] text-gray-800 dark:text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 group"
          >
            <Settings size={20} className="text-gray-500 group-hover:rotate-45 transition-transform" />
            Configurações
          </button>
          
          <button
            onClick={() => navigate('/profile/log')}
            className="flex-1 bg-white dark:bg-[#252525] hover:bg-gray-50 dark:hover:bg-[#333] border border-gray-200 dark:border-[#333] text-gray-800 dark:text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 group"
          >
            <FileText size={20} className="text-gray-500 group-hover:-rotate-12 transition-transform" />
            Log atividades
          </button>
        </div>
      </div>

      {/* Workouts Section */}
      <div className="bg-white dark:bg-[#1e1e1e] shadow-xl shadow-black/5 dark:shadow-black/20 rounded-2xl p-5 md:p-6 w-full max-w-lg md:max-w-3xl lg:max-w-5xl mt-6 border border-gray-100 dark:border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Meus Treinos</h2>
          <span className="text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#2a2a2a] px-4 py-1.5 rounded-full border border-gray-200 dark:border-[#333]">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workouts.map((workout) => (
              <div
                key={workout.id}
                className="bg-gray-50 dark:bg-[#252525] border border-gray-100 dark:border-[#333] hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-5 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
              >
                {/* Info Section */}
                <div className="mb-4">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">
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
      <div className="flex justify-center w-full max-w-lg md:max-w-3xl lg:max-w-5xl mt-6 mb-2">
        <button
          onClick={handleLogout}
          className="w-full md:w-auto md:min-w-[250px] bg-white dark:bg-[#1e1e1e] hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/30 font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm hover:shadow text-lg tracking-wide flex justify-center items-center gap-2"
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
            fetchDisabledDays()
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

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-30 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-[#2d2d2d] rounded-2xl w-full max-w-sm shadow-2xl border border-gray-200 dark:border-[#404040] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#404040]">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Editar Perfil</h2>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#404040] text-gray-400 dark:text-gray-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Fields */}
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nome</label>
                <input
                  type="text"
                  value={editedNome}
                  onChange={(e) => setEditedNome(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full border border-gray-200 dark:border-[#404040] rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#27AE60]/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Username</label>
                <input
                  type="text"
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value)}
                  placeholder="seu_username"
                  className="w-full border border-gray-200 dark:border-[#404040] rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#27AE60]/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  value={editedDataNascimento}
                  onChange={(e) => setEditedDataNascimento(e.target.value)}
                  className="w-full border border-gray-200 dark:border-[#404040] rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#27AE60]/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Instagram</label>
                <div className="flex items-center border border-gray-200 dark:border-[#404040] rounded-lg overflow-hidden bg-gray-50 dark:bg-[#1a1a1a] focus-within:ring-2 focus-within:ring-[#27AE60]/50">
                  <span className="px-3 text-sm text-gray-400 dark:text-gray-500 select-none">@</span>
                  <input
                    type="text"
                    value={editedInstagram}
                    onChange={(e) => setEditedInstagram(e.target.value.replace(/^@/, ''))}
                    placeholder="seu_instagram"
                    className="flex-1 py-2 pr-3 text-sm text-gray-800 dark:text-gray-100 bg-transparent focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 bg-gray-100 dark:bg-[#404040] hover:bg-gray-200 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-200 font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 bg-[#27AE60] hover:bg-[#219150] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
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
        <button
          onClick={() => setIsWhatsNewModalOpen(true)}
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-[#27AE60] dark:hover:text-[#27AE60] transition-colors cursor-pointer underline"
        >
          {getVersionWithPrefix()}
        </button>
      </div>
      
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <WhatsNewModal
        isOpen={isWhatsNewModalOpen}
        onClose={() => setIsWhatsNewModalOpen(false)}
      />
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