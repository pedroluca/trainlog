import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from './button'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function PWAUpdateNotification() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const [show, setShow] = useState(false)

  useEffect(() => {
    if (needRefresh) {
      setShow(true)
    }
  }, [needRefresh])

  const handleUpdate = () => {
    updateServiceWorker(true)
    setShow(false)
  }

  const handleDismiss = () => {
    setShow(false)
    setNeedRefresh(false)
  }

  if (!show) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-down">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <RefreshCw size={20} className="text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm mb-1">
              Atualização Disponível
            </h3>
            <p className="text-gray-400 text-xs mb-3">
              Uma nova versão do TrainLog está disponível. Atualize para ter acesso às últimas melhorias.
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={handleUpdate}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2"
              >
                Atualizar Agora
              </Button>
              <Button
                onClick={handleDismiss}
                className="px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm"
              >
                Depois
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
