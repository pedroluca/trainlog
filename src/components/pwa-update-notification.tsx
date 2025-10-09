import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from './button'
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
      console.log('✅ SW Registered:', r)
      
      // Store current version on registration
      const currentVersion = getVersion()
      localStorage.setItem('app-version', currentVersion)
      console.log('💾 Stored current version:', currentVersion)
      
      // Set up periodic update check every 60 seconds
      if (r) {
        setInterval(() => {
          console.log('🔄 Checking for updates...')
          r.update().then(() => {
            console.log('✅ Update check completed')
          }).catch((err) => {
            console.error('❌ Update check failed:', err)
          })
        }, 60000) // Check every 60 seconds
      }
    },
    onRegisterError(error) {
      console.error('❌ SW registration error:', error)
    },
    onNeedRefresh() {
      console.log('🔔 New version available!')
    }
  })

  const [show, setShow] = useState(false)
  const [currentVersion] = useState(getVersion())
  const [updateType, setUpdateType] = useState<'major' | 'minor' | null>(null)

  useEffect(() => {
    if (needRefresh) {
      const detectedUpdateType = getUpdateType()
      
      console.log('📱 Current installed version:', currentVersion)
      console.log('🆕 Update available - Type:', detectedUpdateType)
      
      if (detectedUpdateType === 'patch') {
        // Auto-update patch versions silently
        console.log('🔧 Patch update detected - auto-updating...')
        updateServiceWorker(true) // Auto-reload for patches
        setNeedRefresh(false)
      } else if (detectedUpdateType === 'minor' || detectedUpdateType === 'major') {
        // Show prompt for minor/major updates
        console.log('🎯 Minor/Major update detected - showing notification')
        setUpdateType(detectedUpdateType)
        setShow(true)
      } else {
        // Unknown update type, show prompt to be safe
        console.log('⚠️ Unknown update type - showing notification')
        setUpdateType(null)
        setShow(true)
      }
    }
  }, [needRefresh, currentVersion, updateServiceWorker, setNeedRefresh])

  const handleUpdate = () => {
    console.log('🔄 User clicked update - reloading app...')
    updateServiceWorker(true)
    setShow(false)
  }

  const handleDismiss = () => {
    console.log('⏭️ User dismissed update notification')
    setShow(false)
    setNeedRefresh(false)
  }

  if (!show) {
    return null
  }

  // Customize message based on update type
  const getUpdateMessage = () => {
    if (updateType === 'major') {
      return {
        title: 'Grande Atualização Disponível! 🚀',
        description: 'Uma versão principal do TrainLog está pronta com mudanças importantes. Clique em "Atualizar" para obter as novas funcionalidades.',
        badge: 'MAJOR',
        badgeColor: 'bg-red-500'
      }
    }
    
    if (updateType === 'minor') {
      return {
        title: 'Nova Versão Disponível! 🎉',
        description: 'Novas funcionalidades foram adicionadas ao TrainLog. Clique em "Atualizar" para acessá-las.',
        badge: 'MINOR',
        badgeColor: 'bg-blue-500'
      }
    }
    
    // Default message
    return {
      title: 'Atualização Disponível! ✨',
      description: 'Uma atualização do TrainLog está pronta. Clique em "Atualizar" para obter as últimas melhorias.',
      badge: null,
      badgeColor: ''
    }
  }

  const message = getUpdateMessage()

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-65 animate-slide-down">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <RefreshCw size={20} className="text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-semibold text-sm">
                {message.title}
              </h3>
              {message.badge && (
                <span className={`${message.badgeColor} text-white text-[9px] font-bold px-1.5 py-0.5 rounded`}>
                  {message.badge}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-xs mb-1">
              {message.description}
            </p>
            <p className="text-gray-500 text-[10px] mb-3">
              Versão atual: v{currentVersion}
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={handleUpdate}
                className={`flex-1 ${updateType === 'major' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white text-sm py-2 font-semibold`}
              >
                ✨ Atualizar Agora
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
