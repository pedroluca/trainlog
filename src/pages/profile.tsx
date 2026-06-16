import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebaseConfig'
import { doc, getDoc, collection, getDocs, deleteDoc, query, where, updateDoc, addDoc, deleteField } from 'firebase/firestore'
import { Button } from '../components/button'
import { EditWorkoutModal } from '../components/edit-workout-modal'
import { getUserWorkouts, Treino } from '../data/get-user-workouts'
import { Pencil, Share2, Trash2, Camera, Settings, Activity, Plus, FileText, X, CalendarDays, Minus, UsersRound, Crown, Instagram, ChartPie, LogOut, Mail, BookUser } from 'lucide-react'
import { ShareWorkoutModal } from '../components/share-workout-modal'
import { getVersionWithPrefix } from '../version'
import { updateScheduledDays } from '../data/streak-utils'
import { PremiumUpgradeModal } from '../components/premium-upgrade-modal'
import { Toast, ToastState } from '../components/toast'
import { WhatsNewModal } from '../components/whats-new-modal'
import { BadgeList } from '../components/badge-chip'
import { resolveUserBadges, resolveAvatarRing, type BadgeDefinition } from '../data/badges'
import { addBadgesToUser, removeBadgesFromUser } from '../utils/badge-utils'
import { Spinner } from '../components/spinner'

type BirthdayBalloonMode = 'none' | 'compact' | 'burst'

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const isBirthdayToday = (birthDate: string, referenceDate = new Date()) => {
  const [year, month, day] = birthDate.split('-')

  if (!year || !month || !day) return false

  return (
    Number(month) === referenceDate.getMonth() + 1 &&
    Number(day) === referenceDate.getDate()
  )
}

const getBirthdayCelebrationStorageKey = (userId: string, dateKey: string) =>
  `birthdayCelebration:${userId}:${dateKey}`

export function Profile() {
  const navigate = useNavigate()
  const usuarioID = localStorage.getItem('usuarioId')
  const [nome, setNome] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [telefone, setTelefone] = useState<string | null>(null)
  const [photoURL, setPhotoURL] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [dataNascimento, setDataNascimento] = useState<string | null>(null)
  const [instagram, setInstagram] = useState<string | null>(null)
  const [altura, setAltura] = useState<number>(0) // cm
  const [peso, setPeso] = useState<number>(0) // kg
  const [username, setUsername] = useState<string | null>(null)
  const [isTrainer, setIsTrainer] = useState(false)
  const [cref, setCref] = useState('')
  const [isPremium, setIsPremium] = useState<boolean>(false)
  const [rawBadgeIds, setRawBadgeIds] = useState<string[]>([])
  const [userBadges, setUserBadges] = useState<BadgeDefinition[]>([])
  const [avatarRing, setAvatarRing] = useState('ring-4 ring-white dark:ring-[#1e1e1e]')
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
  const [freezeCount, setFreezeCount] = useState(0)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [friendsCount, setFriendsCount] = useState(0)
  const [isWhatsNewModalOpen, setIsWhatsNewModalOpen] = useState(false)
  const [birthdayBalloonMode, setBirthdayBalloonMode] = useState<BirthdayBalloonMode>('none')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editedNome, setEditedNome] = useState('')
  const [editedUsername, setEditedUsername] = useState('')
  const [editedBio, setEditedBio] = useState('')
  const [editedDataNascimento, setEditedDataNascimento] = useState('')
  const [editedInstagram, setEditedInstagram] = useState('')
  const [editedIsTrainer, setEditedIsTrainer] = useState(false)
  const [editedCref, setEditedCref] = useState('')
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success'
  })
  const profileImageInputRef = useRef<HTMLInputElement>(null)

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
            setBio(userData.bio || '')
            setDataNascimento(userData.dataNascimento || null)
            setInstagram(userData.instagram || null)
            setAltura(userData.altura || 0)
            setPeso(userData.peso || 0)
            setUsername(userData.username || null)
            setIsTrainer(userData.isTrainer || false)
            setCref(userData.cref || '')
            setIsPremium(userData.isPremium || false)
            setEditedAltura(userData.altura ? (userData.altura / 100).toFixed(2) : '')
            setEditedPeso(userData.peso ? userData.peso.toFixed(1) : '')
            // Resolve badges — store the raw IDs so we can mutate them later without losing special ones
            const ids: string[] = userData.badges || []
            setRawBadgeIds(ids)
            const badges = resolveUserBadges(userData)
            setUserBadges(badges)
            setAvatarRing(resolveAvatarRing(badges))
            setCurrentStreak(userData.currentStreak || 0)
            setLongestStreak(userData.longestStreak || 0)
            setFreezeCount(userData.freezeCount || 0)

            const birthDate = typeof userData.dataNascimento === 'string' ? userData.dataNascimento : ''
            if (birthDate && isBirthdayToday(birthDate)) {
              const todayKey = getLocalDateKey()
              const birthdayStorageKey = getBirthdayCelebrationStorageKey(usuarioID, todayKey)
              const alreadyCelebrated =
                localStorage.getItem(birthdayStorageKey) === 'seen' ||
                userData.lastBirthdayCelebrationDate === todayKey

              setBirthdayBalloonMode(alreadyCelebrated ? 'compact' : 'burst')
            } else {
              setBirthdayBalloonMode('none')
            }
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

      const fetchFriendsCount = async () => {
        try {
          const q = query(
            collection(db, 'amizades'),
            where('participantes', 'array-contains', usuarioID),
            where('status', '==', 'aceito')
          )
          const snap = await getDocs(q)
          setFriendsCount(snap.size)
        } catch (err) {
          console.error('Erro ao buscar quantidade de amigos:', err)
        }
      }

      fetchUserData()
      fetchWorkouts()
      fetchFriendsCount()
      
      // Listen for streak updates
      const handleStreakUpdate = (event: CustomEvent) => {
        setCurrentStreak(event.detail.newStreak)
        if (typeof event.detail.longestStreak === 'number') {
          setLongestStreak(event.detail.longestStreak)
        }
        if (typeof event.detail.freezeCount === 'number') {
          setFreezeCount(event.detail.freezeCount)
        }
      }
      
      window.addEventListener('streakUpdated', handleStreakUpdate as EventListener)
      
      return () => {
        window.removeEventListener('streakUpdated', handleStreakUpdate as EventListener)
      }
    }
  }, [usuarioID, navigate, daysOrder])

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

  const handleRemovePhoto = async () => {
    if (!usuarioID) return
    try {
      await updateDoc(doc(db, 'usuarios', usuarioID), {
        photoURL: deleteField()
      })
      setPhotoURL(null)
      setToast({ show: true, message: 'Foto de perfil removida.', type: 'success' })
    } catch (err) {
      console.error('Erro ao remover foto:', err)
      setToast({ show: true, message: 'Erro ao remover foto. Tente novamente.', type: 'error' })
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
          if (usuarioID) await updateScheduledDays(usuarioID)
        } catch (err) {
          console.error('Erro ao buscar treinos:', err)
        }
      }
      fetchWorkouts()
      fetchDisabledDays()
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
    setEditedBio(bio || '')
    setEditedDataNascimento(dataNascimento || '')
    setEditedInstagram(instagram?.replace(/^@/, '') || '')
    setEditedIsTrainer(isTrainer)
    setEditedCref(cref || '')
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
        bio: editedBio.trim(),
        dataNascimento: editedDataNascimento,
        instagram: editedInstagram.replace(/^@/, '').trim(),
        isTrainer: editedIsTrainer,
        cref: editedIsTrainer ? editedCref.trim().toUpperCase() : '',
      })

      // Sync trainer badge
      if (editedIsTrainer !== isTrainer) {
        let newIds: string[]
        if (editedIsTrainer) {
          await addBadgesToUser(usuarioID, ['trainer'])
          newIds = rawBadgeIds.includes('trainer') ? rawBadgeIds : [...rawBadgeIds, 'trainer']
        } else {
          await removeBadgesFromUser(usuarioID, ['trainer'])
          newIds = rawBadgeIds.filter(id => id !== 'trainer')
        }
        setRawBadgeIds(newIds)
        const freshBadges = resolveUserBadges({ badges: newIds })
        setUserBadges(freshBadges)
        setAvatarRing(resolveAvatarRing(freshBadges))
      }
      setNome(editedNome.trim())
      setUsername(trimmedUsername)
      setBio(editedBio.trim())
      setDataNascimento(editedDataNascimento)
      setInstagram(editedInstagram.replace(/^@/, '').trim())
      setIsTrainer(editedIsTrainer)
      setCref(editedIsTrainer ? editedCref.trim().toUpperCase() : '')
      setIsEditingProfile(false)
      setToast({ show: true, message: 'Perfil atualizado com sucesso!', type: 'success' })
    } catch (err) {
      console.error('Erro ao salvar perfil:', err)
      setToast({ show: true, message: 'Erro ao salvar. Tente novamente.', type: 'error' })
    }
  }

  return (
    <main className="flex flex-col items-center justify-start min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[#121212] p-4 pb-24 md:py-8">
      <BirthdayCelebrationBalloons mode={birthdayBalloonMode} />

      {/* Profile Card */}
      <div className="relative grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-4 bg-white dark:bg-[#1e1e1e] shadow-xl shadow-black/5 dark:shadow-black/20 rounded-2xl p-4 pt-10 md:pt-6 w-full max-w-lg md:max-w-3xl lg:max-w-4xl border border-gray-100 dark:border-[#2a2a2a] transition-all">
        {/* Edit Profile Button */}
        <button
          onClick={handleOpenEditProfile}
          className="cursor-pointer absolute top-2 right-11.5 p-2 rounded-full bg-gray-50 dark:bg-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#333] text-gray-500 dark:text-gray-300 transition-colors shadow-sm"
          title="Editar perfil"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => navigate('/profile/settings')}
          className="cursor-pointer absolute top-2 right-2 p-2 rounded-full bg-gray-50 dark:bg-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#333] text-gray-500 dark:text-gray-300 transition-colors shadow-sm"
          title="Configurações"
        >
          <Settings size={16} />
        </button>
        <div className="md:col-span-1 lg:col-span-4 flex flex-col items-center relative">
          {/* Avatar Circle with Image Upload */}
          <div className="relative mb-3 md:mt-6 w-max mx-auto">
            {birthdayBalloonMode === 'compact' && (
              <>
                <div className="absolute -left-8 top-8 flex flex-col items-center gap-1 animate-bounce" style={{ animationDuration: '2.4s' }}>
                  <div className="h-10 w-8 rounded-full bg-rose-400 shadow-lg shadow-rose-500/30 relative">
                    <div className="absolute left-1/2 top-full h-8 w-px -translate-x-1/2 bg-rose-300" />
                  </div>
                </div>
                <div className="absolute -right-8 top-6 flex flex-col items-center gap-1 animate-bounce" style={{ animationDuration: '2.8s', animationDelay: '0.2s' }}>
                  <div className="h-10 w-8 rounded-full bg-sky-400 shadow-lg shadow-sky-500/30 relative">
                    <div className="absolute left-1/2 top-full h-8 w-px -translate-x-1/2 bg-sky-300" />
                  </div>
                </div>
              </>
            )}
            <div className={`w-24 md:w-32 lg:w-40 h-24 md:h-32 lg:h-40 bg-gradient-to-br from-[#27AE60] to-[#1E8449] rounded-full flex items-center justify-center text-white text-4xl lg:text-5xl font-bold overflow-hidden shadow-inner relative z-0 ${avatarRing}`}>
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
                <Spinner size={16} thickness={2} color="white" />
              ) : (
                <Camera size={18} />
              )}
            </label>
            <input
              ref={profileImageInputRef}
              id="profile-image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploadingImage}
            />
          </div>

          <h1 className="text-2xl lg:text-3xl text-center font-extrabold text-gray-900 dark:text-white tracking-tight">{nome || 'Carregando...'}</h1>
          <p className="text-sm md:text-base font-bold text-gray-500 dark:text-gray-400">{username ? '@' + username : ''}</p>

          {/* Badges */}
          <BadgeList onUpgrade={handleOpenUpgradeModal} badges={userBadges} userIsPremium={isPremium} />
        </div>
        
        {/* Personal Info Fields */}
        <div className="md:col-span-3 lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className="col-span-2 md:col-span-full flex items-center gap-2 bg-gray-50 dark:bg-[#252525] rounded-xl p-2 md:px-2.5 border border-gray-100 dark:border-[#333] transition-colors">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {bio ? bio : <span className="text-gray-400 dark:text-gray-500 font-normal text-sm">Não informado</span>}
            </p>
          </div>
          <div className="col-span-2 md:col-span-full flex items-center gap-2 bg-gray-50 dark:bg-[#252525] rounded-xl p-2 md:px-2.5 border border-gray-100 dark:border-[#333] transition-colors">
            <Mail size={16} className="shrink-0 text-blue-500" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {email ? email : <span className="text-gray-400 dark:text-gray-500 font-normal text-sm">Não informado</span>}
            </p>
          </div>
          <div className="col-span-2 md:col-span-full flex items-center gap-2 bg-gray-50 dark:bg-[#252525] rounded-xl p-2 md:px-2.5 border border-gray-100 dark:border-[#333] transition-colors">
            <Instagram size={16} className="shrink-0 text-pink-500" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {instagram ? (
                <span className="text-gray-800 dark:text-gray-100 hover:underline cursor-pointer">{instagram.replace(/^@/, '')}</span>
              ) : (
                <span className="text-gray-400 dark:text-gray-500 font-normal text-sm">Não informado</span>
              )}
            </p>
          </div>
          {isTrainer && (
            <div className="col-span-2 md:col-span-full bg-blue-50 dark:bg-blue-900/10 rounded-xl p-2 md:px-2.5 border border-blue-100 dark:border-blue-900/30 transition-colors">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 truncate">
                {cref ? cref : <span className="text-blue-400/70 font-normal">Nao informado</span>}
              </p>
            </div>
          )}

          {/* Body Metrics as info fields */}
          <div className="col-span-full grid grid-cols-4 gap-2">
            <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-2 md:px-2.5 border border-emerald-100 dark:border-emerald-800/30">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide font-bold">Altura</p>
              <p className="text-base font-medium text-emerald-900 dark:text-emerald-300">
                {altura > 0 ? `${(altura / 100).toFixed(2)}m` : <span className="text-emerald-400/50 font-normal text-sm">—</span>}
              </p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-2 md:px-2.5 border border-emerald-100 dark:border-emerald-800/30">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide font-bold">Peso</p>
              <p className="text-base font-medium text-emerald-900 dark:text-emerald-300">
                {peso > 0 ? `${peso.toFixed(1)}kg` : <span className="text-emerald-400/50 font-normal text-sm">—</span>}
              </p>
            </div>
            <div className="col-span-2 flex flex-col justify-between bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-2 md:px-2.5 border border-emerald-100 dark:border-emerald-800/30">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide font-bold">IMC</p>
              {altura > 0 && peso > 0 ? (
                <div className='flex gap-2 items-end'>
                  <p className="text-base font-medium text-emerald-900 dark:text-emerald-300 leading-tight">{calculateIMC(peso, altura).toFixed(1)}</p>
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
                  className="cursor-pointer flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  {altura > 0 && peso > 0 ? 'Nova Medição' : 'Adicionar Métricas'}
                </button>
                {altura > 0 && peso > 0 && (
                  <button
                    onClick={() => {
                      if (isPremium) {
                        navigate('/profile/body-metrics')
                      } else {
                        setIsUpgradeModalOpen(true)
                      }
                    }}
                    className="cursor-pointer flex-1 bg-[#27AE60] hover:bg-[#219150] text-white font-semibold py-3 px-4 rounded-lg transition-all text-sm flex items-center justify-center gap-2 relative overflow-hidden group"
                  >
                    {!isPremium && (
                      <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-amber-400 to-amber-600 rounded-bl-full flex items-start justify-end p-1 z-10 opacity-90 transition-transform group-hover:scale-110">
                         <Crown size={12} className="text-white mt-0.5 mr-0.5" />
                      </div>
                    )}
                    <Activity size={16} />
                    Ver Histórico
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Altura (metros)</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditedAltura((prev) => Math.max(0.5, parseFloat(prev || '0') - 0.01).toFixed(2))}
                      className="cursor-pointer bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-1/5 h-10 rounded flex items-center justify-center"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      step="0.01"
                      value={editedAltura}
                      onChange={(e) => setEditedAltura(e.target.value)}
                      className="w-3/5 border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100 text-center"
                      placeholder="1.75"
                    />
                    <button
                      type="button"
                      onClick={() => setEditedAltura((prev) => Math.min(3, parseFloat(prev || '0') + 0.01).toFixed(2))}
                      className="cursor-pointer bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-1/5 h-10 rounded flex items-center justify-center"
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
                      className="cursor-pointer bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-1/5 h-10 rounded flex items-center justify-center"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      step="0.1"
                      value={editedPeso}
                      onChange={(e) => setEditedPeso(e.target.value)}
                      className="w-3/5 border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100 text-center"
                      placeholder="75.0"
                    />
                    <button
                      type="button"
                      onClick={() => setEditedPeso((prev) => Math.min(500, parseFloat(prev || '0') + 0.1).toFixed(1))}
                      className="cursor-pointer bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-1/5 h-10 rounded flex items-center justify-center"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsEditingMetrics(false)}
                    className="cursor-pointer flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 font-semibold py-3 px-4 rounded-lg transition-colors text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveMetrics}
                    className="cursor-pointer flex-1 bg-[#27AE60] hover:bg-[#219150] text-white font-semibold py-3 px-4 rounded-lg transition-colors text-base"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-4 lg:col-span-8 md:order-3 flex flex-col justify-center md:justify-start gap-3 md:gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 uppercase tracking-wide">
              <ChartPie className="text-orange-500" size={20} />
              Estatísticas
            </h3>
            <button
              onClick={() => {
                if (isPremium) {
                  navigate('/profile/streak-calendar')
                } else {
                  setIsUpgradeModalOpen(true)
                }
              }}
              className={`cursor-pointer bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 ${isPremium ? 'text-orange-600 dark:text-orange-400' : 'text-amber-600 dark:text-amber-500'} font-bold py-1.5 px-3 rounded-lg text-xs md:text-sm flex items-center gap-1.5 transition-all outline outline-orange-500/20 relative group overflow-hidden ${!isPremium ? 'pr-7' : ''}`}
            >
              <CalendarDays size={14} /> Calendário
              {!isPremium && <Crown size={12} className="text-amber-500 absolute top-1.5 right-2 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2 md:gap-3">
            <div className="bg-orange-60 dark:bg-orange-500/10 rounded-xl p-2 md:px-2.5 border border-orange-500/20 dark:border-orange-500/30 backdrop-blur-sm">
              <p className="text-[10px] md:text-xs uppercase tracking-wider font-bold text-orange-600 dark:text-orange-400 mb-1">
                <span className="hidden md:inline">Sequência</span>
                <span className="md:hidden">Seq.</span>
              </p>
              <p className="text-xl md:text-2xl lg:text-3xl font-black text-orange-600 dark:text-orange-400 truncate">{currentStreak}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-500/10 rounded-xl p-2 md:px-2.5 border border-yellow-500/20 dark:border-yellow-500/30 backdrop-blur-sm">
              <p className="text-[10px] md:text-xs uppercase tracking-wider font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                <span className="hidden md:inline">Recorde Seq.</span>
                <span className="md:hidden">RP Seq.</span>
              </p>
              <p className="text-xl md:text-2xl lg:text-3xl font-black text-yellow-600 dark:text-yellow-400 truncate">{longestStreak}</p>
            </div>
            <div className="bg-cyan-50 dark:bg-cyan-500/10 rounded-xl p-2 md:px-2.5 border border-cyan-500/20 dark:border-cyan-500/30 backdrop-blur-sm">
              <p className="text-[10px] md:text-xs uppercase tracking-wider font-bold text-cyan-600 dark:text-cyan-400 mb-1 flex items-center gap-1">
                <span className="">Freezes</span>
              </p>
              <p className="text-xl md:text-2xl lg:text-3xl font-black text-cyan-600 dark:text-cyan-400 truncate">
                {freezeCount}
              </p>
            </div>
            <div 
              onClick={() => navigate('/friends')}
              className="cursor-pointer bg-blue-50 dark:bg-blue-500/10 rounded-xl p-2 md:px-2.5 border border-blue-500/20 dark:border-blue-500/30 backdrop-blur-sm hover:bg-blue-500/30 dark:hover:bg-blue-500/30 transition-colors"
            >
              <p className="text-[10px] md:text-xs uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                <span className="">Amigos</span>
              </p>
              <p className="text-xl md:text-2xl lg:text-3xl font-black text-blue-600 dark:text-blue-400 truncate">{friendsCount}</p>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-4 md:order-2 flex flex-col md:flex-row lg:flex-col gap-3">
          <button
            onClick={() => navigate('/profile/connections')}
            className="cursor-pointer flex-1 bg-white dark:bg-[#252525] hover:bg-gray-50 dark:hover:bg-[#333] border border-gray-200 dark:border-[#333] text-gray-800 dark:text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 group"
          >
            <UsersRound size={20} className="text-gray-500 group-hover:scale-110 transition-transform" />
            Treinadores e Alunos
          </button>

          <button
            onClick={() => navigate('/profile/settings')}
            className="cursor-pointer flex-1 bg-white dark:bg-[#252525] hover:bg-gray-50 dark:hover:bg-[#333] border border-gray-200 dark:border-[#333] text-gray-800 dark:text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 group"
          >
            <Settings size={20} className="text-gray-500 group-hover:rotate-45 transition-transform" />
            Configurações
          </button>
          
          <button
            onClick={() => navigate('/profile/log')}
            className="cursor-pointer flex-1 bg-white dark:bg-[#252525] hover:bg-gray-50 dark:hover:bg-[#333] border border-gray-200 dark:border-[#333] text-gray-800 dark:text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 group"
          >
            <FileText size={20} className="text-gray-500 group-hover:-rotate-12 transition-transform" />
            Log atividades
          </button>
        </div>
      </div>

      {/* Workouts Section */}
      <div className="bg-white dark:bg-[#1e1e1e] shadow-xl shadow-black/5 dark:shadow-black/20 rounded-2xl p-4 md:p-5 w-full max-w-lg md:max-w-3xl lg:max-w-4xl mt-6 border border-gray-100 dark:border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-3 md:mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Meus Treinos</h2>
          <span className="text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#2a2a2a] px-4 py-1.5 rounded-full border border-gray-200 dark:border-[#333]">
            {workouts.length} {workouts.length === 1 ? 'treino' : 'treinos'}
          </span>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
            <WorkoutCardSkeleton />
            <WorkoutCardSkeleton />
            <WorkoutCardSkeleton />
          </div>
        ) : workouts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">Você ainda não tem treinos cadastrados</p>
            <Button
              onClick={() => navigate('/train')}
              className="bg-primary hover:bg-[#219150] text-white px-6 py-2"
            >
              Criar Primeiro Treino
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
            {workouts.map((workout) => (
              <div
                key={workout.id}
                className="bg-gray-50 dark:bg-[#252525] border border-gray-100 dark:border-[#333] hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-2.5 md:px-3 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
              >
                {/* Info Section */}
                <div className="mb-1.5">
                  <p className="text-xs tracking-wide text-gray-600 dark:text-gray-400">
                    {workout.dia}
                  </p>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {workout.musculo}
                  </h3>
                </div>
                
                {/* Actions Section */}
                <div className="grid grid-cols-3 md:grid-cols-3 gap-2">
                  <Button
                    className=" text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all"
                    bgColor='bg-[#F1C40F] hover:bg-[#D4AC0D]'
                    onClick={() => handleShareWorkout(workout)}
                    title="Compartilhar treino"
                  >
                    <Share2 size={20} className="shrink-0" />
                  </Button>
                  <Button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all"
                    onClick={() => handleEditWorkout(workout)}
                    title="Editar treino"
                  >
                    <Pencil size={20} className="shrink-0" />
                  </Button>
                  <Button
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all"
                    onClick={() => handleDeleteWorkout(workout)}
                    title="Excluir treino"
                  >
                    <Trash2 size={20} className="shrink-0" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout Section */}
      <div className="flex justify-center w-full max-w-lg md:max-w-3xl lg:max-w-4xl mt-6 mb-2">
        <button
          onClick={handleLogout}
          className="cursor-pointer w-full md:w-auto md:min-w-[250px] bg-white dark:bg-[#1e1e1e] hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/30 font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm hover:shadow text-lg tracking-wide flex justify-center items-center gap-2"
        >
          <LogOut size={20} />
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
                
                if (usuarioID) {
                  await updateScheduledDays(usuarioID)
                }
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
              {/* Photo */}
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 shrink-0 bg-gradient-to-br from-[#27AE60] to-[#1E8449] rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden ${avatarRing}`}>
                  {photoURL ? (
                    <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    nome ? nome.charAt(0).toUpperCase() : '?'
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => profileImageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="cursor-pointer text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 text-left"
                  >
                    {uploadingImage ? 'Enviando...' : photoURL ? 'Alterar foto' : 'Adicionar foto'}
                  </button>
                  {photoURL && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="cursor-pointer text-xs font-semibold text-red-500 dark:text-red-400 hover:underline text-left"
                    >
                      Remover foto
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nome</label>
                <input
                  type="text"
                  value={editedNome}
                  onChange={(e) => setEditedNome(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full border border-gray-200 dark:border-[#404040] rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Username</label>
                <input
                  type="text"
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value)}
                  placeholder="seu_username"
                  className="w-full border border-gray-200 dark:border-[#404040] rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  value={editedDataNascimento}
                  onChange={(e) => setEditedDataNascimento(e.target.value)}
                  className="w-full border border-gray-200 dark:border-[#404040] rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Instagram</label>
                <div className="flex items-center border border-gray-200 dark:border-[#404040] rounded-lg overflow-hidden bg-gray-50 dark:bg-[#1a1a1a] focus-within:ring-2 focus-within:ring-primary/50">
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
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Bio</label>
                <textarea
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  placeholder="Conte um pouco sobre você..."
                  maxLength={160}
                  rows={3}
                  className="w-full border border-gray-200 dark:border-[#404040] rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
                <p className="text-[10px] text-gray-400 dark:text-gray-500 text-right mt-0.5">{editedBio.length}/160</p>
              </div>
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Perfil de Treinador
                  <input
                    type="checkbox"
                    checked={editedIsTrainer}
                    onChange={(e) => setEditedIsTrainer(e.target.checked)}
                    className="w-4 h-4 accent-[#27AE60]"
                  />
                </label>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Ative para exibir seu perfil como treinador.</p>
              </div>
              {editedIsTrainer && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">CREF (opcional)</label>
                  <input
                    type="text"
                    value={editedCref}
                    onChange={(e) => setEditedCref(e.target.value.toUpperCase())}
                    placeholder="Ex: CREF 123456-G/SP"
                    maxLength={30}
                    className="w-full border border-gray-200 dark:border-[#404040] rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="cursor-pointer flex-1 bg-gray-100 dark:bg-[#404040] hover:bg-gray-200 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-200 font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProfile}
                className="cursor-pointer flex-1 bg-[#27AE60] hover:bg-[#219150] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info Section */}
      <div className="mt-6 text-center space-y-2 pb-8 md:pb-30 lg:pb-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Tractus. Todos os direitos reservados.
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Desenvolvido por{' '}
          <a 
            href='https://pedroluca.dev.br' 
            target='_blank' 
            rel='noopener noreferrer' 
            className='text-primary hover:text-[#219150] font-medium transition-colors'
          >
            Pedro Luca Prates
          </a>
        </p>
        <button
          onClick={() => setIsWhatsNewModalOpen(true)}
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary transition-colors cursor-pointer underline"
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

function BirthdayCelebrationBalloons({ mode }: { mode: BirthdayBalloonMode }) {
  if (mode === 'none') return null

  if (mode === 'burst') {
    return (
      <div className="fixed inset-0 pointer-events-none z-[65] overflow-hidden">
        <div className="absolute left-[6%] top-[14%] animate-bounce" style={{ animationDuration: '3s' }}>
          <div className="h-14 w-11 rounded-full bg-rose-400 shadow-xl shadow-rose-500/30 relative">
            <div className="absolute left-1/2 top-full h-10 w-px -translate-x-1/2 bg-rose-300" />
          </div>
        </div>
        <div className="absolute left-[16%] top-[28%] animate-bounce" style={{ animationDuration: '2.6s', animationDelay: '0.2s' }}>
          <div className="h-12 w-9 rounded-full bg-amber-400 shadow-xl shadow-amber-500/30 relative">
            <div className="absolute left-1/2 top-full h-9 w-px -translate-x-1/2 bg-amber-300" />
          </div>
        </div>
        <div className="absolute right-[12%] top-[18%] animate-bounce" style={{ animationDuration: '2.9s', animationDelay: '0.35s' }}>
          <div className="h-14 w-11 rounded-full bg-sky-400 shadow-xl shadow-sky-500/30 relative">
            <div className="absolute left-1/2 top-full h-10 w-px -translate-x-1/2 bg-sky-300" />
          </div>
        </div>
        <div className="absolute right-[8%] top-[38%] animate-bounce" style={{ animationDuration: '3.1s', animationDelay: '0.15s' }}>
          <div className="h-12 w-9 rounded-full bg-emerald-400 shadow-xl shadow-emerald-500/30 relative">
            <div className="absolute left-1/2 top-full h-9 w-px -translate-x-1/2 bg-emerald-300" />
          </div>
        </div>
        <div className="absolute left-[26%] bottom-[18%] animate-bounce" style={{ animationDuration: '2.7s', animationDelay: '0.4s' }}>
          <div className="h-12 w-10 rounded-full bg-fuchsia-400 shadow-xl shadow-fuchsia-500/30 relative">
            <div className="absolute left-1/2 top-full h-10 w-px -translate-x-1/2 bg-fuchsia-300" />
          </div>
        </div>
        <div className="absolute right-[24%] bottom-[16%] animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.05s' }}>
          <div className="h-12 w-10 rounded-full bg-yellow-400 shadow-xl shadow-yellow-500/30 relative">
            <div className="absolute left-1/2 top-full h-10 w-px -translate-x-1/2 bg-yellow-300" />
          </div>
        </div>
      </div>
    )
  }

  return null
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