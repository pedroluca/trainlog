import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from './ui/button'
import { IconButton } from './ui/icon-button'

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
      
      // Show prompt after 15 seconds of usage
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
    await deferredPrompt.userChoice

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
    <div
      role="dialog"
      aria-label="Instalar o Tractus"
      className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)_+_96px)] z-40 animate-toast-in sm:left-auto sm:w-96 lg:bottom-6 lg:right-6"
    >
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-lg">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary">
          <Download size={20} aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-sm font-semibold">Instalar o Tractus</h3>
          <p className="text-xs leading-4 text-muted">Adicione o app à tela inicial para abrir mais rápido e usar offline.</p>
          <Button label="Instalar" size="sm" className="mt-2 self-start" onClick={handleInstall} />
        </div>
        <IconButton icon={X} label="Agora não" size={32} iconSize={16} className="-mr-1 -mt-1" onClick={handleDismiss} />
      </div>
    </div>
  )
}
