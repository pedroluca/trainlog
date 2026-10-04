import { Flame } from 'lucide-react'
import { Button } from './button'
import { useEffect, useState } from 'react'
import type { StreakUpdateResult } from '../data/streak-utils'
import './workout-complete-modal.css'

interface WorkoutCompleteModalProps {
  isOpen: boolean
  onClose: () => void
  workoutName: string
  streakResult: StreakUpdateResult | null
}

export function WorkoutCompleteModal({ isOpen, onClose, workoutName, streakResult }: WorkoutCompleteModalProps) {
  const [show, setShow] = useState(false)
  const [streak, setStreak] = useState(0)
  const [isFlameLit, setIsFlameLit] = useState(false)
  const [animateStreak, setAnimateStreak] = useState(false)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Small delay for animation
      setTimeout(() => setShow(true), 10)
    } else {
      setShow(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    // Garante que o conteúdo aparece mesmo se a atualização da streak falhar
    const fallbackTimer = setTimeout(() => setShowContent(true), 3000)
    return () => clearTimeout(fallbackTimer)
  }, [isOpen])

  useEffect(() => {
    if (!streakResult) return

    const { currentStreak, streakIncremented } = streakResult
    // Só anima o +1 no primeiro treino da semana
    setStreak(streakIncremented && currentStreak > 0 ? currentStreak - 1 : currentStreak)

    const timer = setTimeout(() => {
      setStreak(currentStreak)
      setIsFlameLit(true)
      if (streakIncremented) {
        setAnimateStreak(true)
        setTimeout(() => setAnimateStreak(false), 1200)
      }
      setTimeout(() => setShowContent(true), 400)
    }, streakIncremented ? 1000 : 400)

    return () => clearTimeout(timer)
  }, [streakResult])

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
        className={`bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all duration-300 ${
          show ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
      >
        {/* Trophy icon with animation */}
        <div className="flex justify-center mb-6">
          {isFlameLit ? (
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

        {showContent && (
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
              {!!streakResult?.totalWorkouts && (
                <p className="text-white/80 text-center text-sm mt-1">
                  Treino nº {streakResult.totalWorkouts}
                </p>
              )}
            </div>
            {streakResult && (
              <p className="text-white font-semibold text-center mb-2">
                {streakResult.streakIncremented ? 'Mais uma semana na sequência! 🔥' : 'Semana garantida! 🔥'}
              </p>
            )}
            <p className="text-white/80 text-center text-sm mb-8">
              Continue assim e você vai alcançar seus objetivos! 🚀
            </p>
            {/* Button */}
            <Button
              onClick={onClose}
              className="w-full bg-white dark:bg-gray-200 hover:bg-gray-100 dark:hover:bg-gray-300 font-bold py-4 text-lg shadow-lg"
              buttonTextColor="text-primary hover:text-primary-dark"
            >
              Obrigado! 💪
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
