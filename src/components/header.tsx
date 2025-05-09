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
    <header className='h-28 bg-[#C0392B] text-[#f4f4f4] flex flex-col items-center justify-center'>
      <main className={`${hideDate ? 'h-full' : 'h-[70%]'} w-full flex flex-col items-center justify-center border-b-1 border-gray-400`}>
        <img />
        <Link to='/' className='text-3xl font-bold'>TrainLog</Link>
      </main>
      <section className={`h-[30%] w-full flex items-center justify-center ${hideDate ? 'hidden' : ''}`}>
        <p>{currentTime}</p>
      </section>
    </header>
  )
}