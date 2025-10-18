import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import { Flame } from 'lucide-react'

type HeaderProps = {
  hideDate?: boolean
}

export function Header({ hideDate = false }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState('')
  const [streak, setStreak] = useState(0)
  const [treinouHoje, setTreinouHoje] = useState(false)
  const usuarioID = localStorage.getItem('usuarioId')

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }
      setCurrentTime(now.toLocaleString('pt-BR', options))
    }

    updateDateTime() 
    const interval = setInterval(updateDateTime, 1000) 

    return () => clearInterval(interval) 
  }, [])

  useEffect(() => {
    const fetchStreak = async () => {
      if (!usuarioID) return
      try {
        const userDocRef = doc(db, 'usuarios', usuarioID)
        const userDoc = await getDoc(userDocRef)
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setStreak(userData.currentStreak || 0)
          const lastWorkoutDate = userData.lastWorkoutDate
          if (lastWorkoutDate) {
            const today = new Date()
            const todayStr = today.toISOString().slice(0, 10)
            setTreinouHoje(lastWorkoutDate === todayStr)
          } else {
            setTreinouHoje(false)
          }
        }
      } catch (err) {
        console.error('Erro ao buscar streak:', err)
      }
    }
    fetchStreak()
    const handleStreakUpdate = (event: CustomEvent) => {
      setStreak(event.detail.newStreak)
      if (event.detail.lastWorkoutDate) {
        const today = new Date()
        const todayStr = today.toISOString().slice(0, 10)
        setTreinouHoje(event.detail.lastWorkoutDate === todayStr)
      }
    }
    window.addEventListener('streakUpdated', handleStreakUpdate as EventListener)
    return () => {
      window.removeEventListener('streakUpdated', handleStreakUpdate as EventListener)
    }
  }, [usuarioID])

  return (
    <header className='bg-gradient-to-r from-[#27AE60] to-[#229954] text-white shadow-lg'>
      <main className={`${hideDate ? 'py-6' : 'py-4'} px-4 flex items-center justify-between border-b border-white/10`}>
        <Link 
          to='/' 
          className='text-3xl font-bold tracking-tight hover:scale-105 transition-transform duration-200'
        >
          TrainLog
        </Link>
        
        {usuarioID && (
          <Link
            to='/profile'
            className='flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-colors'
            title='Seu streak de treinos'
          >
            <Flame size={20} className={treinouHoje ? 'text-orange-400' : 'text-gray-400'} />
            <span className='text-lg font-bold'>{streak}</span>
          </Link>
        )}
      </main>
      <section className={`py-2 px-4 flex items-center justify-center ${hideDate ? 'hidden' : ''}`}>
        <p className='text-sm text-white/90 font-medium'>{currentTime}</p>
      </section>
    </header>
  )
}