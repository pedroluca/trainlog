import { Trophy, Sparkles, X } from 'lucide-react'
import { Button } from './button'
import { useEffect, useState } from 'react'

interface WorkoutCompleteModalProps {
  isOpen: boolean
  onClose: () => void
  workoutName: string
}

export function WorkoutCompleteModal({ isOpen, onClose, workoutName }: WorkoutCompleteModalProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Small delay for animation
      setTimeout(() => setShow(true), 10)
    } else {
      setShow(false)
    }
  }, [isOpen])

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
        className={`bg-gradient-to-br from-[#27AE60] to-[#219150] rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all duration-300 ${
          show ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* Trophy icon with animation */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Trophy size={80} className="text-yellow-300 animate-bounce" />
            <Sparkles 
              size={24} 
              className="absolute -top-2 -right-2 text-yellow-200 animate-pulse" 
            />
            <Sparkles 
              size={20} 
              className="absolute -bottom-1 -left-1 text-yellow-200 animate-pulse" 
              style={{ animationDelay: '0.5s' }}
            />
          </div>
        </div>

        {/* Celebration message */}
        <h2 className="text-3xl font-bold text-white text-center mb-2">
          {randomMessage}
        </h2>
        
        <p className="text-white/90 text-center text-lg mb-4">
          Você completou todos os exercícios de
        </p>

        <div className="bg-white/20 rounded-lg p-3 mb-6">
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
          className="w-full bg-white hover:bg-gray-100 font-bold py-4 text-lg shadow-lg"
          buttonTextColor="text-[#27AE60] hover:text-[#219150]"
        >
          Obrigado! 💪
        </Button>
      </div>
    </div>
  )
}
