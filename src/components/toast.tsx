import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

// Exported type for toast state management
export type ToastState = {
  show: boolean
  message: string
  type: ToastType
}

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 dark:bg-green-600'
      case 'error':
        return 'bg-red-500 dark:bg-red-600'
      case 'warning':
        return 'bg-yellow-500 dark:bg-yellow-600'
      case 'info':
        return 'bg-blue-500 dark:bg-blue-600'
      default:
        return 'bg-gray-500 dark:bg-gray-600'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />
      case 'error':
        return <AlertCircle size={20} />
      case 'warning':
        return <AlertTriangle size={20} />
      case 'info':
        return <Info size={20} />
      default:
        return null
    }
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-in-right">
      <div
        className={`${getToastStyles()} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md`}
      >
        <div className="flex-shrink-0">{getIcon()}</div>
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

// Add animation to index.css:
// @keyframes slide-in-right {
//   from {
//     transform: translateX(100%);
//     opacity: 0;
//   }
//   to {
//     transform: translateX(0);
//     opacity: 1;
//   }
// }
// .animate-slide-in-right {
//   animation: slide-in-right 0.3s ease-out;
// }
