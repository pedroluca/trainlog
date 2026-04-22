import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { db } from '../firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import { BookUser, Dumbbell, TrendingUp, UsersRound, UserRound } from 'lucide-react'

export function Header() {
  const [streak, setStreak] = useState(0)
  const [treinouHoje, setTreinouHoje] = useState(false)
  const [photoURL, setPhotoURL] = useState<string | null>(null)
  const [nome, setNome] = useState<string>('')
  const [isFounder, setIsFounder] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const usuarioID = localStorage.getItem('usuarioId')
  const location = useLocation()

  useEffect(() => {
    const fetchUser = async () => {
      if (!usuarioID) return
      try {
        const userDoc = await getDoc(doc(db, 'usuarios', usuarioID))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setStreak(data.currentStreak || 0)
          setPhotoURL(data.photoURL || null)
          setNome(data.nome || '')
          setIsFounder(!!data.isFounder)
          setIsPremium(!!data.isPremium)
          if (data.lastWorkoutDate) {
            const todayStr = new Date().toLocaleDateString('en-CA')
            setTreinouHoje(data.lastWorkoutDate === todayStr)
          }
        }
      } catch (err) {
        console.error('Erro ao buscar dados do header:', err)
      }
    }
    fetchUser()

    const handleStreakUpdate = (event: CustomEvent) => {
      setStreak(event.detail.newStreak)
      if (event.detail.lastWorkoutDate) {
        const todayStr = new Date().toLocaleDateString('en-CA')
        setTreinouHoje(event.detail.lastWorkoutDate === todayStr)
      }
    }
    window.addEventListener('streakUpdated', handleStreakUpdate as EventListener)
    return () => window.removeEventListener('streakUpdated', handleStreakUpdate as EventListener)
  }, [usuarioID])

  // Borda do avatar: founder > premium > padrão
  const avatarRing = isFounder
    ? 'ring-2 ring-offset-1 ring-offset-[#27AE60] ring-purple-400'
    : isPremium
      ? 'ring-2 ring-offset-1 ring-offset-[#27AE60] ring-yellow-400'
      : 'ring-2 ring-offset-1 ring-offset-[#27AE60] ring-white/40'

  const firstName = nome.split(' ')[0]
  const lastName = nome.split(' ')[1]

  return (
    <header className={`bg-[#27AE60] text-white shadow-lg fixed top-0 left-0 right-0 z-20`}>
      <main className='relative py-2.5 px-4 flex items-center justify-between border-b border-white/10'>

        {/* ── Esquerda: avatar + nome (logado) ou logo (deslogado) ── */}
        {usuarioID ? (
          <Link
            to='/profile'
            className='flex items-center gap-2.5 group z-10 rounded-4xl pr-1'
            title='Meu perfil'
          >
            {/* Avatar */}
            {photoURL ? (
              <img
                src={photoURL}
                alt={nome}
                className={`w-11 h-11 rounded-full object-cover ${avatarRing} transition-all shadow-md`}
              />
            ) : (
              <div className={`w-11 h-11 rounded-full bg-white/20 group-hover:bg-white/30 ${avatarRing} group-hover:ring-white/80 flex items-center justify-center transition-all shadow-md`}>
                <UserRound size={20} className='text-white' />
              </div>
            )}

            {/* Nome */}
            <span className='text-base font-semibold text-white/90 group-hover:text-white transition-colors max-w-[200px] truncate'>
              {firstName} {lastName}
            </span>
          </Link>
        ) : (
          <Link
            to='/'
            className='text-3xl md:text-4xl font-bold tracking-tight hover:scale-105 transition-transform duration-200 z-10'
          >
            TrainLog
          </Link>
        )}

        {/* ── Centro: nav desktop ── */}
        {usuarioID && (
          <nav className='hidden lg:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2'>
            <Link to='/train' className={`flex items-center gap-2 transition-colors font-semibold text-base ${location.pathname.startsWith('/train') ? 'text-white' : 'text-white/60 hover:text-white/80'}`}>
              <Dumbbell size={20} /> Treino
            </Link>
            <Link to='/friends' className={`flex items-center gap-2 transition-colors font-semibold text-base ${location.pathname.startsWith('/friends') ? 'text-white' : 'text-white/60 hover:text-white/80'}`}>
              <BookUser size={20} /> Amigos
            </Link>
            <Link to='/profile/connections' className={`flex items-center gap-2 transition-colors font-semibold text-base ${location.pathname.startsWith('/profile/connections') ? 'text-white' : 'text-white/60 hover:text-white/80'}`}>
              <UsersRound size={20} /> Treinador/Aluno
            </Link>
            <Link to='/progress' className={`flex items-center gap-2 transition-colors font-semibold text-base ${location.pathname.startsWith('/progress') ? 'text-white' : 'text-white/60 hover:text-white/80'}`}>
              <TrendingUp size={20} /> Progresso
            </Link>
          </nav>
        )}

        {/* ── Direita: streak ── */}
        {usuarioID && (
          <Link
            to={`${isPremium ? '/profile/streak-calendar' : '/profile'}`}
            className={`flex items-center gap-2 ${treinouHoje ? 'bg-orange-400/50 hover:bg-orange-500/50' : 'bg-white/10 hover:bg-white/20'} pr-4 pl-3 py-2 rounded-full transition-colors z-10`}
            title='Seu streak de treinos'
          >
            <span className='text-xl md:text-2xl' style={{ filter: treinouHoje ? 'none' : 'grayscale(1)' }}>🔥</span>
            <span className='text-xl md:text-2xl font-bold'>{streak}</span>
          </Link>
        )}
      </main>
    </header>
  )
}