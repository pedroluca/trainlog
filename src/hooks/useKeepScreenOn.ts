import { useEffect } from 'react'

type KeepScreenOnBridge = {
  setKeepScreenOn?: (enabled: boolean) => void
}

const getAndroidBridge = () => (window as Window & { Android?: KeepScreenOnBridge }).Android

/**
 * Mantém a tela ligada enquanto `active` for true.
 * No app Android usa a bridge nativa (FLAG_KEEP_SCREEN_ON), já que o WebView não suporta a Wake Lock API.
 * No navegador cai para a Screen Wake Lock API, quando disponível.
 */
export function useKeepScreenOn(active: boolean) {
  useEffect(() => {
    const bridge = getAndroidBridge()

    if (bridge && typeof bridge.setKeepScreenOn === 'function') {
      try {
        bridge.setKeepScreenOn(active)
      } catch (error) {
        console.error('Erro ao chamar window.Android.setKeepScreenOn:', error)
      }

      return () => {
        try {
          bridge.setKeepScreenOn?.(false)
        } catch (error) {
          console.error('Erro ao chamar window.Android.setKeepScreenOn:', error)
        }
      }
    }

    if (!active || !('wakeLock' in navigator)) return

    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const requestWakeLock = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (cancelled) {
          lock.release()
          return
        }
        sentinel = lock
      } catch {
        // Pode falhar se a aba não estiver visível ou o navegador negar; não é crítico
      }
    }

    // O navegador libera o wake lock quando a aba fica oculta, então pede de novo ao voltar
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') requestWakeLock()
    }

    requestWakeLock()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      sentinel?.release()
    }
  }, [active])
}
