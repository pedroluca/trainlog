import { Flame } from 'lucide-react'
import { Button } from './button'
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import './workout-complete-modal.css'

interface WorkoutCompleteModalProps {
  isOpen: boolean
  onClose: () => void
  workoutName: string
}

export function WorkoutCompleteModal({ isOpen, onClose, workoutName }: WorkoutCompleteModalProps) {
  const [show, setShow] = useState(false)
  const [streak, setStreak] = useState(0)
  const [isNewStreak, setIsNewStreak] = useState(false)
  const [animateStreak, setAnimateStreak] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const usuarioID = localStorage.getItem('usuarioId')

  useEffect(() => {
    if (isOpen) {
      // Small delay for animation
      setTimeout(() => setShow(true), 10)
    } else {
      setShow(false)
    }
  }, [isOpen])

  useEffect(() => {
    const fetchStreak = async () => {
      if (!usuarioID) return
      try {
        const userDocRef = doc(db, 'usuarios', usuarioID)
        const userDoc = await getDoc(userDocRef)
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setStreak(userData.currentStreak > 0 ? userData.currentStreak - 1 : 0)
          setTimeout(() => {
            setStreak(userData.currentStreak || 0)
            setIsNewStreak(true)
            setAnimateStreak(true)
            setTimeout(() => setAnimateStreak(false), 1200)
            setTimeout(() => setShowContent(true), 400)
          }, 1000)
        }
      } catch (err) {
        console.error('Erro ao buscar streak:', err)
      }
    }
    fetchStreak()
  }, [usuarioID])

  if (!isOpen) return null

  const celebrationMessages = [
    "Arrasou! 💪",
    "Incrível! 🔥",
    "Parabéns! 🎉",
    "Mandou bem! ⚡",
    "Você é fera! 🦁"
  ]

  const randomMessage = celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]

  return (
    <div className="fixed inset-0 z-67 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 animate-fade-in">
      <div 
        className={`bg-gradient-to-br from-[#27AE60] to-[#219150] dark:from-[#1f8b4a] dark:to-[#186a39] rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all duration-300 ${
          show ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
      >
        {/* Trophy icon with animation */}
        <div className="flex justify-center mb-6">
          {isNewStreak ? (
            <div className={`flex items-center justify-center text-yellow-300 dark:text-yellow-200 ${animateStreak ? 'duo-bounce-glow' : ''}`}>
              <Flame size={showContent ? 80 : 120} className={animateStreak ? 'scale-125 drop-shadow-lg transition-transform duration-500' : ''} />
              <span className={`text-center w-1/2 ${showContent ? 'text-3xl' : 'text-5xl'} font-semibold ${animateStreak ? 'scale-110 transition-transform duration-500' : ''}`}>{streak}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center text-gray-400 dark:text-gray-300">
              <Flame size={showContent ? 80 : 120} className="" />
              <span className={`text-center w-1/2 ${showContent ? 'text-3xl' : 'text-5xl'} font-semibold`}>{streak}</span>
            </div>
          )}
        </div>

        {isNewStreak && showContent && (
          <div className="slide-down-content">
            {/* Celebration message */}
            <h2 className="text-3xl font-bold text-white text-center mb-2">
              {randomMessage}
            </h2>
            <p className="text-white/90 text-center text-lg mb-4">
              Você completou todos os exercícios de
            </p>
            <div className="bg-white/20 dark:bg-white/15 rounded-lg p-3 mb-6">
              <p className="text-white font-bold text-center text-xl">
                {workoutName}
              </p>
            </div>
            <p className="text-white/80 text-center text-sm mb-8">
              Continue assim e você vai alcançar seus objetivos! 🚀
            </p>
            {/* Button */}
            <Button
              onClick={onClose}
              className="w-full bg-white dark:bg-gray-200 hover:bg-gray-100 dark:hover:bg-gray-300 font-bold py-4 text-lg shadow-lg"
              buttonTextColor="text-[#27AE60] hover:text-[#219150]"
            >
              Obrigado! 💪
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
