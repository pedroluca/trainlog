import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from './button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) {
      return
    }

    // Check if user already dismissed the prompt
    const isDismissed = localStorage.getItem('pwa-install-dismissed')
    if (isDismissed) {
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after 30 seconds of usage
      setTimeout(() => {
        setShowPrompt(true)
      }, 15000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-up">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-[#27AE60] rounded-lg flex items-center justify-center">
            <Download size={20} className="text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm mb-1">
              Instalar TrainLog
            </h3>
            <p className="text-gray-400 text-xs mb-3">
              Adicione o app à sua tela inicial para acesso rápido e experiência offline
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                className="flex-1 bg-[#27AE60] hover:bg-[#219150] text-white text-sm py-2"
              >
                Instalar
              </Button>
              <Button
                onClick={handleDismiss}
                className="px-3 bg-gray-700 hover:bg-gray-600 text-gray-300"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
