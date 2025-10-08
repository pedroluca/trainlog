import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { Flame, Calendar, Award, Lock, ChevronLeft, ChevronRight } from 'lucide-react'

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
    
    // Streak counting starts TODAY (October 8, 2025)
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

  const getStatusColor = (status: DayStatus, isToday: boolean, isPast: boolean) => {
    // If completed
    if (status === 'completed') {
      // Historical workouts (before today) - light orange/faded
      if (isPast) {
        return 'bg-orange-200 dark:bg-orange-900/30 text-gray-600 dark:text-gray-400'
      }
      // Current workouts (today onwards) - vibrant orange
      return 'bg-orange-500 dark:bg-orange-600 text-white font-semibold'
    }

    // If today and scheduled (but not completed yet), show blue
    if (isToday && status === 'scheduled') {
      return 'bg-blue-500 dark:bg-blue-400 text-white font-bold ring-2 ring-blue-700 dark:ring-blue-300'
    }
    
    // Missed workout
    if (status === 'missed') {
      return 'bg-red-300 dark:bg-red-800 text-gray-700 dark:text-gray-300'
    }

    // Not scheduled or future scheduled days are transparent
    return 'text-gray-700 dark:text-gray-300'
  }

  const monthYearLabel = currentMonth.toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  })

  const isCurrentMonth = currentMonth.getMonth() === new Date().getMonth() && 
                         currentMonth.getFullYear() === new Date().getFullYear()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#1a1a1a]">
        <div className="text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    )
  }

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-[#1a1a1a] px-4">
        <Lock size={64} className="text-gray-400 dark:text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Recurso Premium
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          O calendário de streaks é exclusivo para usuários premium.
        </p>
        <button
          onClick={() => navigate('/profile')}
          className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-medium"
        >
          Voltar ao Perfil
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-[#2d2d2d] border-b dark:border-[#404040] px-4 py-6">
        <button
          onClick={() => navigate('/profile')}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-4"
        >
          ← Voltar ao Perfil
        </button>
        
        <div className="flex items-center gap-3 mb-2">
          <Calendar size={32} className="text-amber-500" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Calendário de Treinos
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Acompanhe seu histórico mensal de treinos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-6 grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#2d2d2d] dark:border dark:border-[#404040] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={20} className="text-orange-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Streak Atual</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{currentStreak}</p>
        </div>

        <div className="bg-white dark:bg-[#2d2d2d] dark:border dark:border-[#404040] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award size={20} className="text-amber-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Maior Streak</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{longestStreak}</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="px-4 pb-6">
        <div className="bg-white dark:bg-[#2d2d2d] dark:border dark:border-[#404040] rounded-lg p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-600 dark:text-gray-400" />
            </button>
            
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 capitalize">
                {monthYearLabel}
              </h2>
              {!isCurrentMonth && (
                <button
                  onClick={goToCurrentMonth}
                  className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mt-1"
                >
                  Voltar para hoje
                </button>
              )}
            </div>
            
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight size={24} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarData.map((day, index) => {
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const isPast = day.date < today && day.dayOfMonth > 0
              
              return (
                <div
                  key={index}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-all ${
                    day.dayOfMonth === 0 
                      ? '' 
                      : getStatusColor(day.status, day.isToday, isPast)
                  } ${day.status !== 'not-scheduled' && day.dayOfMonth > 0 ? 'cursor-pointer hover:opacity-80' : ''}`}
                >
                  {day.dayOfMonth > 0 && (
                    <span>{day.dayOfMonth}</span>
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
