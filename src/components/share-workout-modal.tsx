import { useState } from 'react'
import { Button } from './button'

type ShareWorkoutModalProps = {
  workoutId: string
  onClose: () => void
}

export function ShareWorkoutModal({ workoutId, onClose }: ShareWorkoutModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(workoutId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000) // 2 segundos
  }

  return (
    <div className="fixed inset-0 z-20 bg-[rgba(0,0,0,0.5)] flex items-center justify-center px-4">
      <div className="bg-white rounded-lg p-6 w-80">
        <h2 className="text-xl font-bold mb-4">Compartilhar Treino</h2>
        <p className="text-gray-700 mb-4">Copie o código de compartilhamento do treino abaixo e mande para quem deseja compartilhar:</p>
        <div className="bg-gray-100 p-2 rounded text-gray-800 mb-4 relative">
          {workoutId}
          {copied && (
            <div className="absolute bottom-auto bg-green-100 text-green-800 text-sm px-3 py-1 rounded shadow">
              Copiado para a área de transferência!
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            className="text-white mr-2"
            bgColor='bg-[#F1C40F] hover:bg-[#D4AC0D]'
            onClick={handleCopyToClipboard}
          >
            Copiar ID
          </Button>
          <Button
            type="button"
            className="bg-gray-300 hover:bg-gray-400 text-gray-800"
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}