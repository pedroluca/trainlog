import { useState } from 'react'
import { Button } from './button'

type ShareWorkoutModalProps = {
  workoutId: string
  onClose: () => void
}

export function ShareWorkoutModal({ workoutId, onClose }: ShareWorkoutModalProps) {
  const [copied, setCopied] = useState(false)

  const usuarioID = localStorage.getItem('usuarioId')
  const shareCode = `${workoutId}-${usuarioID}`

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(shareCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000) // 2 segundos
  }

  return (
    <div className="fixed inset-0 z-20 bg-[rgba(0,0,0,0.5)] dark:bg-[rgba(0,0,0,0.7)] flex items-center justify-center px-4">
      <div className="bg-white dark:bg-[#2d2d2d] dark:border dark:border-[#404040] rounded-lg p-6 w-80">
        <h2 className="text-xl font-bold mb-4 dark:text-gray-100">Compartilhar Treino</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">Copie o código de compartilhamento do treino abaixo e mande para quem deseja compartilhar:</p>
        <div className="bg-gray-100 dark:bg-[#1a1a1a] p-2 rounded text-gray-800 dark:text-gray-100 mb-4 relative">
          {shareCode}
        </div>
        {copied && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[70] bg-green-500 dark:bg-green-600 text-white text-sm px-6 py-3 rounded-lg shadow-lg">
            Copiado para a área de transferência!
          </div>
        )}
        <div className="flex justify-end">
          <Button
            type="button"
            className="text-white mr-2"
            bgColor='bg-[#F1C40F] hover:bg-[#D4AC0D]'
            onClick={handleCopyToClipboard}
          >
            Copiar código
          </Button>
          <Button
            type="button"
            className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100"
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}