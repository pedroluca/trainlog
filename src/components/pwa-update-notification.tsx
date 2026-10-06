import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { APP_VERSION, getVersion } from '../version'

// Detect update type by comparing versions
function getUpdateType(): 'major' | 'minor' | 'patch' | null {
  // Get stored version from localStorage (last installed version)
  const storedVersion = localStorage.getItem('app-version')
  
  if (!storedVersion) {
    // First install, no update type
    return null
  }

  const [storedMajor, storedMinor, storedPatch] = storedVersion.split('.').map(Number)
  const currentMajor = APP_VERSION.major
  const currentMinor = APP_VERSION.minor
  const currentPatch = APP_VERSION.patch

  console.log('📊 Version comparison:', {
    stored: `${storedMajor}.${storedMinor}.${storedPatch}`,
    current: `${currentMajor}.${currentMinor}.${currentPatch}`
  })

  // Compare versions
  if (currentMajor > storedMajor) {
    return 'major'
  }
  
  if (currentMinor > storedMinor) {
    return 'minor'
  }
  
  if (currentPatch > storedPatch) {
    return 'patch'
  }

  return null
}

export function PWAUpdateNotification() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      const currentVersion = getVersion()
      localStorage.setItem('app-version', currentVersion)
      
      // Set up periodic update check every 60 seconds
      if (r) {
        setInterval(() => {
          r.update().then(() => {
          }).catch((err) => {
            console.error('❌ Update check failed:', err)
          })
        }, 60000) // Check every 60 seconds
      }
    },
    onRegisterError(error) {
      console.error('❌ SW registration error:', error)
    }
  })

  const [show, setShow] = useState(false)
  const [currentVersion] = useState(getVersion())
  const [updateType, setUpdateType] = useState<'major' | 'minor' | null>(null)

  useEffect(() => {
    if (needRefresh) {
      const detectedUpdateType = getUpdateType()
      
      
      if (detectedUpdateType === 'patch') {
        updateServiceWorker(true) // Auto-reload for patches
        setNeedRefresh(false)
      } else if (detectedUpdateType === 'minor' || detectedUpdateType === 'major') {
        setUpdateType(detectedUpdateType)
        setShow(true)
      } else {
        setUpdateType(null)
        setShow(true)
      }
    }
  }, [needRefresh, currentVersion, updateServiceWorker, setNeedRefresh])

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

  const title = updateType === 'major' ? 'Grande atualização disponível' : updateType === 'minor' ? 'Nova versão disponível' : 'Atualização disponível'
  const description = updateType === 'major'
    ? 'Uma versão nova do Tractus está pronta, com mudanças importantes.'
    : updateType === 'minor'
      ? 'Novas funcionalidades foram adicionadas ao Tractus.'
      : 'Uma atualização do Tractus está pronta com as últimas melhorias.'

  return (
    <div
      role="status"
      className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)_+_12px)] z-[60] animate-toast-in sm:left-auto sm:w-96 lg:right-6"
    >
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-lg">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-info/12 text-info">
          <RefreshCw size={20} aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs leading-4 text-muted">{description}</p>
          <p className="text-[11px] text-subtle">Versão atual: v{currentVersion}</p>
          <div className="mt-2 flex gap-2">
            <Button label="Atualizar agora" size="sm" onClick={handleUpdate} />
            <Button label="Depois" size="sm" variant="secondary" onClick={handleDismiss} />
          </div>
        </div>
      </div>
    </div>
  )
}
