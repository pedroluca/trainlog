import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type HeaderProps = {
  hideDate?: boolean
}

export function Header({ hideDate = false }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState('')

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

  return (
    <header className='bg-gradient-to-r from-[#27AE60] to-[#229954] text-white shadow-lg'>
      <main className={`${hideDate ? 'py-6' : 'py-4'} px-4 flex flex-col items-center justify-center border-b border-white/10`}>
        <Link 
          to='/' 
          className='text-3xl font-bold tracking-tight hover:scale-105 transition-transform duration-200'
        >
          TrainLog
        </Link>
      </main>
      <section className={`py-2 px-4 flex items-center justify-center ${hideDate ? 'hidden' : ''}`}>
        <p className='text-sm text-white/90 font-medium'>{currentTime}</p>
      </section>
    </header>
  )
}