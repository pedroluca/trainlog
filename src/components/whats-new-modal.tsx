import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ChevronRight } from 'lucide-react'
import { currentRelease } from '../data/whats-new'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'

type WhatsNewModalProps = {
  isOpen: boolean
  onClose: () => void
  forceUpdateVersion?: string | null
  systemVersion?: string | null
}

export function WhatsNewModal({ isOpen, onClose, forceUpdateVersion, systemVersion }: WhatsNewModalProps) {
  const navigate = useNavigate()
  const [show, setShow] = useState(false)

  // Helper function to format date without timezone issues
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR')
  }

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShow(true), 10)
    } else {
      setShow(false)
    }
  }, [isOpen])

  const handleClose = async () => {
    if (forceUpdateVersion) return // Don't let them close naturally if forced update

    const usuarioID = localStorage.getItem('usuarioId')
    const finalVersion = systemVersion || currentRelease.version
    
    // Save dismissed version to localStorage (immediate)
    localStorage.setItem('lastSeenVersion', finalVersion)
    
    // Save to Firestore (persistent across devices)
    if (usuarioID) {
      try {
        await setDoc(
          doc(db, 'usuarios', usuarioID),
          { lastSeenVersion: finalVersion },
          { merge: true }
        )
      } catch (error) {
        console.error('Error saving dismissed version:', error)
      }
    }
    
    onClose()
  }

  const handleForceUpdate = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((reg) => reg.unregister()))
      }

      if ('caches' in window) {
        const cacheKeys = await caches.keys()
        await Promise.all(cacheKeys.map((key) => caches.delete(key)))
      }
    } catch (error) {
      console.error('Error while clearing app caches:', error)
    }

    const url = new URL(window.location.href)
    url.searchParams.set('force-refresh', Date.now().toString())
    window.location.replace(url.toString())
  }

  const handleItemClick = (route?: string) => {
    if (route && !forceUpdateVersion) {
      handleClose()
      navigate(route)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 animate-fade-in">
      <div
        className={`bg-white dark:bg-[#2d2d2d] rounded-2xl p-6 max-w-lg w-full shadow-2xl transform transition-all duration-300 max-h-[85vh] overflow-y-auto ${
          show ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{forceUpdateVersion ? '🔄' : '🎉'}</span>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {forceUpdateVersion ? 'Atualização Necessária' : currentRelease.title}
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {forceUpdateVersion 
                ? `Nova versão disponível: ${forceUpdateVersion}`
                : `Versão ${currentRelease.version} • ${formatDate(currentRelease.date)}`}
            </p>
          </div>
          {!forceUpdateVersion && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1"
              aria-label="Fechar"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Release Items */}
        <div className="space-y-3 mb-6">
          {forceUpdateVersion ? (
            <div className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#404040] rounded-xl p-4 transition-all">
              <div className="flex items-start gap-3">
                <div className="text-3xl flex-shrink-0">🆕</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">
                    Novidades aguardando!
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Nós lançamos a versão <strong>{forceUpdateVersion}</strong> com melhorias para o aplicativo. Atualize agora para carregar as novas funcionalidades e ver o recado completo na próxima tela!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            currentRelease.items.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item.action?.route)}
                className={`bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#404040] rounded-xl p-4 transition-all ${
                  item.action
                    ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-[#252525] hover:border-[#27AE60] dark:hover:border-[#27AE60] hover:shadow-md'
                    : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl flex-shrink-0">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {item.description}
                    </p>
                    {item.action && (
                      <div className="flex items-center gap-1 mt-2 text-[#27AE60] dark:text-[#2ecc71] text-sm font-medium">
                        <span>{item.action.label}</span>
                        <ChevronRight size={16} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-[#404040]">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {forceUpdateVersion ? "Seu aplicativo será recarregado" : "Esta mensagem não será exibida novamente"}
          </p>
          <button
            onClick={forceUpdateVersion ? handleForceUpdate : handleClose}
            className="bg-[#27AE60] hover:bg-[#229954] text-white font-bold px-6 py-2.5 rounded-lg transition-colors shadow-md"
          >
            {forceUpdateVersion ? "Atualizar Aplicativo" : "Entendido"}
          </button>
        </div>
      </div>
    </div>
  )
}
