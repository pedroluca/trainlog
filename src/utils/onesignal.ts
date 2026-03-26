type OneSignalSDK = {
  init: (options: Record<string, unknown>) => Promise<void>
  login: (externalId: string) => Promise<void>
  logout: () => Promise<void>
  Notifications: {
    requestPermission: () => Promise<void>
  }
  User?: {
    PushSubscription?: {
      id?: string | null
    }
  }
}

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalSDK) => void | Promise<void>>
    OneSignal?: OneSignalSDK | unknown
  }
}

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID
const ONESIGNAL_SDK_SRC = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
let initialized = false
let initPromise: Promise<void> | null = null
let sdkScriptPromise: Promise<void> | null = null

const isOneSignalSdk = (value: unknown): value is OneSignalSDK => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<OneSignalSDK>
  return typeof candidate.init === 'function' && typeof candidate.login === 'function'
}

const getPermission = (): NotificationPermission | 'unsupported' => {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported'
  }
  return Notification.permission
}

const withOneSignal = async (): Promise<OneSignalSDK | null> => {
  if (typeof window === 'undefined') return null

  if (isOneSignalSdk(window.OneSignal)) {
    return window.OneSignal
  }

  const ensureSdkScriptLoaded = async (): Promise<void> => {
    if (sdkScriptPromise) {
      await sdkScriptPromise
      return
    }

    sdkScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${ONESIGNAL_SDK_SRC}"]`)
      if (existing?.dataset.loaded === 'true') {
        resolve()
        return
      }

      const script = existing || document.createElement('script')
      script.src = ONESIGNAL_SDK_SRC
      script.async = true
      script.defer = true

      const onLoad = () => {
        script.dataset.loaded = 'true'
        resolve()
      }

      const onError = () => {
        reject(new Error('Falha ao carregar script da OneSignal CDN.'))
      }

      script.addEventListener('load', onLoad, { once: true })
      script.addEventListener('error', onError, { once: true })

      if (!existing) {
        document.head.appendChild(script)
      }
    }).finally(() => {
      sdkScriptPromise = null
    })

    await sdkScriptPromise
  }

  try {
    await ensureSdkScriptLoaded()
  } catch {
    return null
  }

  if (isOneSignalSdk(window.OneSignal)) {
    return window.OneSignal
  }

  return await new Promise<OneSignalSDK | null>((resolve) => {
    const deferred = window.OneSignalDeferred = window.OneSignalDeferred || []
    let done = false

    const timeout = window.setTimeout(() => {
      if (!done) {
        done = true
        resolve(null)
      }
    }, 15000)

    deferred.push((oneSignal) => {
      if (done) return
      done = true
      window.clearTimeout(timeout)
      resolve(isOneSignalSdk(oneSignal) ? oneSignal : null)
    })
  })
}

const ensureInitialized = async (oneSignal: OneSignalSDK) => {
  if (initialized) return
  if (!ONESIGNAL_APP_ID) {
    throw new Error('VITE_ONESIGNAL_APP_ID não configurado')
  }

  if (!initPromise) {
    initPromise = oneSignal.init({
      appId: ONESIGNAL_APP_ID,
      serviceWorkerPath: '/OneSignalSDKWorker.js',
      serviceWorkerUpdaterPath: '/OneSignalSDKUpdaterWorker.js',
      notifyButton: { enable: false }
    }).then(() => {
      initialized = true
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      if (/already initialized/i.test(message)) {
        initialized = true
        return
      }
      throw error
    }).finally(() => {
      initPromise = null
    })
  }

  await initPromise
}

const getSubscriptionId = (oneSignal: OneSignalSDK): string | null => {
  return oneSignal.User?.PushSubscription?.id ?? null
}

export type OneSignalSyncResult = {
  success: boolean
  permission: NotificationPermission | 'unsupported'
  subscriptionId: string | null
  errorMessage?: string
}

export const syncOneSignalUser = async (externalId: string): Promise<OneSignalSyncResult> => {
  const permission = getPermission()
  if (permission === 'unsupported') {
    return { success: false, permission, subscriptionId: null, errorMessage: 'Navegador sem suporte a notificações.' }
  }

  const oneSignal = await withOneSignal()
  if (!oneSignal) {
    return { success: false, permission, subscriptionId: null, errorMessage: 'SDK OneSignal não carregou.' }
  }

  try {
    await ensureInitialized(oneSignal)
    await oneSignal.login(externalId)
    return {
      success: true,
      permission: getPermission(),
      subscriptionId: getSubscriptionId(oneSignal)
    }
  } catch (error) {
    return {
      success: false,
      permission: getPermission(),
      subscriptionId: null,
      errorMessage: error instanceof Error ? error.message : 'Erro ao sincronizar usuário no OneSignal.'
    }
  }
}

export const requestOneSignalPermission = async (externalId: string): Promise<OneSignalSyncResult> => {
  const permission = getPermission()
  if (permission === 'unsupported') {
    return { success: false, permission, subscriptionId: null, errorMessage: 'Navegador sem suporte a notificações.' }
  }

  const oneSignal = await withOneSignal()
  if (!oneSignal) {
    return { success: false, permission, subscriptionId: null, errorMessage: 'SDK OneSignal não carregou.' }
  }

  try {
    await ensureInitialized(oneSignal)
    await oneSignal.login(externalId)
    await oneSignal.Notifications.requestPermission()

    return {
      success: getPermission() === 'granted',
      permission: getPermission(),
      subscriptionId: getSubscriptionId(oneSignal)
    }
  } catch (error) {
    return {
      success: false,
      permission: getPermission(),
      subscriptionId: null,
      errorMessage: error instanceof Error ? error.message : 'Erro ao solicitar permissão no OneSignal.'
    }
  }
}

export const logoutOneSignalUser = async (): Promise<void> => {
  const oneSignal = await withOneSignal()
  if (!oneSignal) return

  try {
    await ensureInitialized(oneSignal)
    await oneSignal.logout()
  } catch {
    // no-op
  }
}
