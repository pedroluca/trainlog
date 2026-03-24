import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, disableNetwork, enableNetwork } from 'firebase/firestore'
import { getAnalytics, logEvent as firebaseLogEvent, isSupported, Analytics } from 'firebase/analytics'
import { getMessaging, getToken, onMessage, MessagePayload, deleteToken } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// Habilita a persistência offline do Firestore (cache no navegador com suporte a múltiplas abas)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
})

// Gerencia a rede do Firestore dinamicamente para evitar timeouts de 10s quando offline
if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => {
    console.log('App is offline, disabling Firestore network to use cache instantly...')
    disableNetwork(db).catch(console.error)
  })
  window.addEventListener('online', () => {
    console.log('App is online, enabling Firestore network...')
    enableNetwork(db).catch(console.error)
  })
  // Se já estiver offline na inicialização
  if (!navigator.onLine) {
    disableNetwork(db).catch(console.error)
  }
}

// Initialize Analytics (only in browser environment)
let analytics: Analytics | null = null
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app)
        console.log('📊 Google Analytics initialized successfully')
      } catch (error) {
        console.warn('⚠️ Google Analytics not available:', error)
        console.warn('💡 To enable Analytics: Go to Firebase Console → Analytics → Enable')
      }
    } else {
      console.warn('⚠️ Google Analytics not supported in this environment')
    }
  }).catch((error) => {
    console.warn('⚠️ Failed to check Analytics support:', error)
  })
}

// Helper function to safely log events
export const logEvent = (eventName: string, eventParams?: Record<string, string | number | boolean>) => {
  if (analytics) {
    try {
      firebaseLogEvent(analytics, eventName, eventParams)
      console.log(`📊 Analytics event: ${eventName}`, eventParams)
    } catch (error) {
      console.error('❌ Failed to log analytics event:', error)
    }
  } else {
    // Analytics not available - events will be logged to console only
    console.log(`📊 Analytics event (not tracked): ${eventName}`, eventParams)
  }
}

// Secondary app for admin operations (creating users without affecting current auth)
import { initializeApp as initializeAppSecondary } from 'firebase/app'
export const secondaryApp = initializeAppSecondary(firebaseConfig, 'Secondary')
export const secondaryAuth = getAuth(secondaryApp)

// Firebase Cloud Messaging
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null

type NotificationRequestErrorCode =
  | 'unsupported'
  | 'insecure-context'
  | 'missing-vapid'
  | 'permission-denied'
  | 'token-unavailable'
  | 'token-error'

export type NotificationRequestResult = {
  success: boolean
  token: string | null
  permission: NotificationPermission | 'unsupported'
  errorCode?: NotificationRequestErrorCode
  errorMessage?: string
}

const getMessagingServiceWorkerRegistration = async () => {
  if (!('serviceWorker' in navigator)) {
    return null
  }

  const messagingScope = '/firebase-cloud-messaging-push-scope/'
  const desiredScopeUrl = new URL(messagingScope, window.location.origin).href

  const waitForActiveWorker = async (registration: ServiceWorkerRegistration) => {
    if (registration.active) {
      return true
    }

    const candidate = registration.installing || registration.waiting
    if (candidate) {
      await new Promise<void>((resolve) => {
        const onStateChange = () => {
          if (candidate.state === 'activated') {
            candidate.removeEventListener('statechange', onStateChange)
            resolve()
          }
        }
        candidate.addEventListener('statechange', onStateChange)
      })
    }

    // Fallback: aguarda alguns ciclos curtos até o registro ficar ativo.
    for (let i = 0; i < 10 && !registration.active; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      await registration.update().catch(() => undefined)
    }

    return Boolean(registration.active)
  }

  try {
    // Remove registros antigos do firebase-messaging-sw.js em escopos diferentes
    // para evitar notificações duplicadas.
    const allRegistrations = await navigator.serviceWorker.getRegistrations()
    for (const reg of allRegistrations) {
      const scriptUrl = reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || ''
      const isFirebaseMessagingSw = scriptUrl.includes('/firebase-messaging-sw.js')
      if (isFirebaseMessagingSw && reg.scope !== desiredScopeUrl) {
        await reg.unregister()
      }
    }

    // Escopo dedicado para evitar conflito com o SW do vite-plugin-pwa (/sw.js)
    const existing = await navigator.serviceWorker.getRegistration(messagingScope)
    const registration = existing || await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: messagingScope
    })

    const active = await waitForActiveWorker(registration)
    if (!active) {
      return null
    }

    return registration
  } catch (error) {
    console.error('🔔 Falha ao registrar firebase-messaging-sw.js:', error)
    return null
  }
}

const resetMessagingWorkerAndSubscription = async (registration: ServiceWorkerRegistration | null) => {
  if (!registration) return

  try {
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
    }
  } catch (error) {
    console.warn('🔔 Não foi possível remover inscrição push antiga:', error)
  }

  try {
    await registration.unregister()
  } catch (error) {
    console.warn('🔔 Não foi possível remover service worker antigo:', error)
  }
}

// Solicitar permissão e retornar o resultado completo do FCM
export const requestNotificationPermission = async (): Promise<NotificationRequestResult> => {
  if (typeof window === 'undefined' || typeof Notification === 'undefined' || !messaging) {
    return {
      success: false,
      token: null,
      permission: 'unsupported',
      errorCode: 'unsupported',
      errorMessage: 'Este ambiente não suporta notificações web.'
    }
  }

  if (!window.isSecureContext) {
    return {
      success: false,
      token: null,
      permission: Notification.permission,
      errorCode: 'insecure-context',
      errorMessage: 'Notificações exigem HTTPS.'
    }
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!vapidKey) {
    return {
      success: false,
      token: null,
      permission: Notification.permission,
      errorCode: 'missing-vapid',
      errorMessage: 'VAPID key ausente na build (VITE_FIREBASE_VAPID_KEY).'
    }
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('🔔 Permissão de notificação negada pelo usuário.')
      return {
        success: false,
        token: null,
        permission,
        errorCode: 'permission-denied',
        errorMessage: 'Permissão de notificação negada pelo navegador.'
      }
    }

    const serviceWorkerRegistration = await getMessagingServiceWorkerRegistration()
    if (!serviceWorkerRegistration) {
      return {
        success: false,
        token: null,
        permission,
        errorCode: 'token-error',
        errorMessage: 'Falha ao registrar service worker do FCM.'
      }
    }

    let token: string | null = null

    try {
      token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration
      })
    } catch (firstError) {
      const firstMessage = firstError instanceof Error ? firstError.message : String(firstError)
      const shouldRetry = /push service error|registration failed|subscribe/i.test(firstMessage)

      if (!shouldRetry) {
        throw firstError
      }

      console.warn('🔔 Erro de registro push detectado. Tentando recuperação automática...', firstError)

      try {
        await deleteToken(messaging)
      } catch {
        // Ignore cleanup failure and continue recovery.
      }

      await resetMessagingWorkerAndSubscription(serviceWorkerRegistration)

      const freshRegistration = await getMessagingServiceWorkerRegistration()
      if (!freshRegistration) {
        throw firstError
      }

      token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: freshRegistration
      })
    }

    if (token) {
      console.log('🔔 FCM Token obtido com sucesso:', token)
      return {
        success: true,
        token,
        permission
      }
    }

    return {
      success: false,
      token: null,
      permission,
      errorCode: 'token-unavailable',
      errorMessage: 'Permissão concedida, mas o FCM não retornou token.'
    }
  } catch (error) {
    console.error('🔔 Erro ao obter token FCM:', error)
    return {
      success: false,
      token: null,
      permission: Notification.permission,
      errorCode: 'token-error',
      errorMessage: error instanceof Error ? error.message : 'Erro desconhecido ao obter token FCM.'
    }
  }
}

// Receber mensagens em foreground (app aberto)
export const onForegroundMessage = (callback: (payload: MessagePayload) => void) => {
  if (!messaging) return
  return onMessage(messaging, callback)
}