import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { Flame, Award, Lock, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

type DayStatus = 'completed' | 'missed' | 'scheduled' | 'not-scheduled'

type CalendarDay = {
  date: Date
  status: DayStatus
  isToday: boolean
  dayOfMonth: number
}

export function StreakCalendar() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [scheduledDays, setScheduledDays] = useState<number[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([])
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set())

  const usuarioID = localStorage.getItem('usuarioId')

  const loadCompletedWorkouts = useCallback(async () => {
    if (!usuarioID) return

    try {
      const logsRef = collection(db, 'logs')
      const q = query(logsRef, where('usuarioID', '==', usuarioID))
      const logsSnapshot = await getDocs(q)

      const completed = new Set<string>()
      logsSnapshot.docs.forEach((docSnap) => {
        const logData = docSnap.data()
        if (logData.data) {
          let date: Date
          
          // Handle both Firestore Timestamp and ISO string formats
          if (typeof logData.data === 'string') {
            // ISO string format (from training-card.tsx)
            date = new Date(logData.data)
          } else if (logData.data.seconds) {
            // Firestore Timestamp format
            date = new Date(logData.data.seconds * 1000)
          } else {
            return // Skip invalid data
          }
          
          const dateStr = date.toDateString()
          completed.add(dateStr)
        }
      })

      setCompletedDates(completed)
    } catch (error) {
      console.error('Error loading workouts:', error)
    }
  }, [usuarioID])

  const generateMonthCalendar = useCallback((month: Date, scheduled: number[], completed: Set<string>) => {
    const calendar: CalendarDay[] = []
    const year = month.getFullYear()
    const monthIndex = month.getMonth()
    
    // First day of the month
    const firstDay = new Date(year, monthIndex, 1)
    const lastDay = new Date(year, monthIndex + 1, 0)
    
    // Add empty days for alignment (start from Sunday)
    const firstDayOfWeek = firstDay.getDay()
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendar.push({
        date: new Date(0), // dummy date
        status: 'not-scheduled',
        isToday: false,
        dayOfMonth: 0
      })
    }
    
    // Add all days of the month
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Streak counting starts October 8, 2025
    const streakStartDate = new Date(2025, 9, 8) // Month is 0-indexed
    streakStartDate.setHours(0, 0, 0, 0)
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, monthIndex, day)
      date.setHours(0, 0, 0, 0)
      
      const dayOfWeek = date.getDay()
      const isScheduled = scheduled.includes(dayOfWeek)
      const isCompleted = completed.has(date.toDateString())
      const isToday = date.toDateString() === today.toDateString()
      
      let status: DayStatus = 'not-scheduled'
      
      // Priority: completed workouts first (even if not scheduled)
      if (isCompleted) {
        status = 'completed'
      } else if (isScheduled) {
        if (date < streakStartDate) {
          // Before streak counting started - don't mark as missed
          status = 'not-scheduled'
        } else if (date < today) {
          // After streak start but before today - mark as missed
          status = 'missed'
        } else {
          // Today or future
          status = 'scheduled'
        }
      }
      
      calendar.push({
        date,
        status,
        isToday,
        dayOfMonth: day
      })
    }
    
    return calendar
  }, [])

  const loadUserData = useCallback(async () => {
    if (!usuarioID) return

    try {
      const userDoc = await getDoc(doc(db, 'usuarios', usuarioID))
      if (!userDoc.exists()) {
        navigate('/login')
        return
      }

      const userData = userDoc.data()
      const premium = userData.isPremium || false
      
      if (!premium) {
        navigate('/profile')
        return
      }

      setIsPremium(premium)
      setCurrentStreak(userData.currentStreak || 0)
      setLongestStreak(userData.longestStreak || 0)
      setScheduledDays(userData.scheduledDays || [])

      await loadCompletedWorkouts()
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading user data:', error)
      setLoading(false)
    }
  }, [usuarioID, navigate, loadCompletedWorkouts])

  useEffect(() => {
    if (!usuarioID) {
      navigate('/login')
      return
    }

    loadUserData()
  }, [usuarioID, navigate, loadUserData])

  useEffect(() => {
    if (scheduledDays.length > 0 && completedDates.size >= 0) {
      const calendar = generateMonthCalendar(currentMonth, scheduledDays, completedDates)
      setCalendarData(calendar)
    }
  }, [currentMonth, scheduledDays, completedDates, generateMonthCalendar])

  const previousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date())
  }

  const getStatusColor = (status: DayStatus, isToday: boolean, date: Date) => {
    // Streak feature started October 8, 2025
    const streakStartDate = new Date(2025, 9, 8)
    streakStartDate.setHours(0, 0, 0, 0)
    const isBeforeStreakFeature = date < streakStartDate
    
    // If completed
    if (status === 'completed') {
      if (isBeforeStreakFeature) {
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/30'
      }
      return 'bg-gradient-to-br from-orange-400 to-orange-500 text-white font-bold shadow-md shadow-orange-500/25 border-none'
    }

    // If today and scheduled
    if (isToday && status === 'scheduled') {
      return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold border-2 border-emerald-400 dark:border-emerald-500/50 shadow-inner'
    }
    
    // Missed workout
    if (status === 'missed') {
      return 'bg-red-50 dark:bg-red-900/10 text-red-400 dark:text-red-500/70 border border-red-100 dark:border-red-900/20'
    }

    // Just today (not scheduled)
    if (isToday) {
      return 'bg-gray-50 dark:bg-[#252525] text-gray-900 dark:text-white font-bold border-2 border-gray-200 dark:border-[#444]'
    }

    // Not scheduled / Default
    return 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] border border-transparent'
  }

  const monthYearLabel = currentMonth.toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  })

  const isCurrentMonth = currentMonth.getMonth() === new Date().getMonth() && 
                         currentMonth.getFullYear() === new Date().getFullYear()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#121212]">
        <div className="w-12 h-12 border-4 border-[#27AE60] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-[#121212] px-4">
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-200/50 dark:border-amber-700/30 backdrop-blur-md p-8 md:p-12 rounded-[2rem] flex flex-col items-center max-w-md text-center shadow-2xl shadow-amber-900/5">
          <div className="w-24 h-24 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-orange-500/30 animate-pulse">
            <Lock size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
            Recurso Premium
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 leading-relaxed font-medium px-2">
            O calendário detalhado de streaks e seu histórico mensal são exclusivos. Desbloqueie todo o potencial do seu treino.
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="cursor-pointer w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-orange-500/25 px-6 py-4 rounded-2xl font-bold text-lg transition-all hover:-translate-y-1 active:scale-95"
          >
            Voltar ao Perfil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] pb-24 font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-[#1e1e1e] border-b border-gray-100 dark:border-[#2a2a2a] px-4 py-6 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/profile')}
            className="cursor-pointer flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ChevronLeft size={16} /> Voltar ao Perfil
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl shadow-inner border border-amber-200/50 dark:border-amber-800/30">
              <CalendarDays size={26} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Calendário
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base font-medium">
            Histórico mensal de consistência
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-8 max-w-4xl mx-auto grid grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-[#1e1e1e] dark:to-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] shadow-sm hover:shadow-md transition-shadow rounded-3xl p-5 md:p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-28 h-28 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-500"></div>
          <div className="flex flex-col gap-3 relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-xl">
                <Flame size={20} className="text-orange-500 dark:text-orange-400" />
              </div>
              <span className="text-xs md:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Atual</span>
            </div>
            <p className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">{currentStreak}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-[#1e1e1e] dark:to-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] shadow-sm hover:shadow-md transition-shadow rounded-3xl p-5 md:p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-28 h-28 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
          <div className="flex flex-col gap-3 relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                <Award size={20} className="text-amber-500 dark:text-amber-400" />
              </div>
              <span className="text-xs md:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Maior</span>
            </div>
            <p className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">{longestStreak}</p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="px-4 pb-12 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-[#2a2a2a] shadow-sm rounded-3xl p-5 md:p-8">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={previousMonth}
              className="cursor-pointer p-3 shadow-sm bg-gray-50 border border-gray-200 hover:bg-white dark:border-[#333] dark:bg-[#252525] dark:hover:bg-[#2d2d2d] rounded-2xl transition-all hover:scale-105 active:scale-95"
            >
              <ChevronLeft size={22} className="text-gray-700 dark:text-gray-300" />
            </button>
            
            <div className="text-center flex flex-col items-center">
              <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white capitalize tracking-tight">
                {monthYearLabel}
              </h2>
              {!isCurrentMonth && (
                <button
                  onClick={goToCurrentMonth}
                  className="cursor-pointer text-xs md:text-sm font-bold text-[#27AE60] hover:text-[#219150] dark:text-green-400 dark:hover:text-green-300 mt-1.5 transition-colors uppercase tracking-wider bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full"
                >
                  Hoje
                </button>
              )}
            </div>
            
            <button
              onClick={nextMonth}
              className="cursor-pointer p-3 shadow-sm bg-gray-50 border border-gray-200 hover:bg-white dark:border-[#333] dark:bg-[#252525] dark:hover:bg-[#2d2d2d] rounded-2xl transition-all hover:scale-105 active:scale-95"
            >
              <ChevronRight size={22} className="text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 md:gap-3 mb-3">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="text-center text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 md:gap-3">
            {calendarData.map((day, index) => {
              const colorClasses = day.dayOfMonth === 0 
                ? 'bg-transparent' 
                : getStatusColor(day.status, day.isToday, day.date);
              
              const baseClasses = "aspect-square flex items-center justify-center rounded-2xl text-sm md:text-base transition-all duration-300 transform"
              const interactiveClasses = day.status !== 'not-scheduled' && day.dayOfMonth > 0 
                ? 'cursor-pointer hover:scale-105 hover:shadow-lg hover:z-10' 
                : ''

              return (
                <div
                  key={index}
                  className={`${baseClasses} ${colorClasses} ${interactiveClasses}`}
                >
                  {day.dayOfMonth > 0 && (
                    <span className="font-semibold">{day.dayOfMonth}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
