import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { db } from '../firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import { Dumbbell, TrendingUp, UsersRound, UserRound } from 'lucide-react'

export function Header() {
  const [streak, setStreak] = useState(0)
  const [treinouHoje, setTreinouHoje] = useState(false)
  const [photoURL, setPhotoURL] = useState<string | null>(null)
  const [nome, setNome] = useState<string>('')
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
          if (data.lastWorkoutDate) {
            const todayStr = new Date().toISOString().slice(0, 10)
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
        const todayStr = new Date().toISOString().slice(0, 10)
        setTreinouHoje(event.detail.lastWorkoutDate === todayStr)
      }
    }
    window.addEventListener('streakUpdated', handleStreakUpdate as EventListener)
    return () => window.removeEventListener('streakUpdated', handleStreakUpdate as EventListener)
  }, [usuarioID])

  // const initials = nome
  //   ? nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  //   : '?'

  return (
    <header className='bg-[#27AE60] text-white shadow-lg'>
      <main className='relative py-3 md:py-5 lg:py-2 px-4 flex items-center justify-between border-b border-white/10'>

        {/* ── Esquerda: avatar (logado) ou logo (deslogado) ── */}
        {usuarioID ? (
          <Link
            to='/profile'
            className='flex items-center gap-2.5 group z-10'
            title='Meu perfil'
          >
            <div className='relative'>
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={nome}
                  className='w-9 h-9 md:w-10 md:h-10 rounded-full object-cover border-2 border-white/40 group-hover:border-white/80 transition-all shadow-md'
                />
              ) : (
                <div className='w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/20 group-hover:bg-white/30 border-2 border-white/40 group-hover:border-white/80 flex items-center justify-center transition-all shadow-md'>
                  <UserRound size={18} className='text-white' />
                </div>
              )}
              {/* online dot */}
              <span className='absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-300 border-2 border-[#27AE60] rounded-full' />
            </div>
            <span className='hidden md:block lg:hidden text-sm font-semibold text-white/90 group-hover:text-white transition-colors max-w-[120px] truncate'>
              {nome.split(' ')[0]}
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
              <UsersRound size={20} /> Amigos
            </Link>
            <Link to='/progress' className={`flex items-center gap-2 transition-colors font-semibold text-base ${location.pathname.startsWith('/progress') ? 'text-white' : 'text-white/60 hover:text-white/80'}`}>
              <TrendingUp size={20} /> Progresso
            </Link>
          </nav>
        )}

        {/* ── Direita: streak ── */}
        {usuarioID && (
          <Link
            to='/profile'
            className={`flex items-center gap-2 ${treinouHoje ? 'bg-orange-400/50 hover:bg-orange-500/50' : 'bg-white/10 hover:bg-white/20'} pr-4 pl-3 py-2 rounded-full transition-colors z-10`}
            title='Seu streak de treinos'
          >
            <span className='text-xl md:text-3xl' style={{ filter: treinouHoje ? 'none' : 'grayscale(1)' }}>🔥</span>
            <span className='text-xl md:text-3xl font-bold'>{streak}</span>
          </Link>
        )}
      </main>
    </header>
  )
}