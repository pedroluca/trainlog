import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import { LayoutWithBottomBar } from './layouts/layout-with-bottombar'
import { LayoutWithoutBottomBar } from './layouts/layout-without-bottombar'
import { Home } from './pages/home'
import { Training } from './pages/training'
import { Login } from './pages/login'
import { Cadastro } from './pages/register'
import { Profile } from './pages/profile'

const Settings = lazy(() => import('./pages/settings').then(m => ({ default: m.Settings })))
const LogPage = lazy(() => import('./pages/log').then(m => ({ default: m.LogPage })))
const Progress = lazy(() => import('./pages/progress').then(m => ({ default: m.Progress })))
const BodyMetrics = lazy(() => import('./pages/body-metrics').then(m => ({ default: m.BodyMetrics })))
const StreakCalendar = lazy(() => import('./pages/streak-calendar').then(m => ({ default: m.StreakCalendar })))

const AdminLogin = lazy(() => import('./pages/admin-login').then(m => ({ default: m.AdminLogin })))
const AdminLayout = lazy(() => import('./layouts/admin-layout').then(m => ({ default: m.AdminLayout })))
const AdminOverview = lazy(() => import('./pages/admin/overview').then(m => ({ default: m.AdminOverview })))
const AdminUsers = lazy(() => import('./pages/admin/users').then(m => ({ default: m.AdminUsers })))
const AdminActivities = lazy(() => import('./pages/admin/activities').then(m => ({ default: m.AdminActivities })))
const AdminBugs = lazy(() => import('./pages/admin/bugs').then(m => ({ default: m.AdminBugs })))
const AdminNotifications = lazy(() => import('./pages/admin/notifications').then(m => ({ default: m.AdminNotifications })))
const TrainerConnections = lazy(() => import('./pages/trainer-connections').then(m => ({ default: m.TrainerConnections })))

import { PWAInstallPrompt } from './components/pwa-install-prompt'
import { PWAUpdateNotification } from './components/pwa-update-notification'
import { WhatsNewModal } from './components/whats-new-modal'
import { ThemeProvider } from './contexts/theme-context'
import { getVersion } from './version'
import { currentRelease } from './data/whats-new'
import { checkAndResetStreakIfMissed, resetPreviousDaysExercises } from './data/streak-utils'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, auth } from './firebaseConfig'
import { onAuthStateChanged } from 'firebase/auth'
import { logoutOneSignalUser, syncOneSignalUser } from './utils/onesignal'
import { Friends } from './pages/friends'
import { FriendProfile } from './pages/friend-profile'
import { FriendFriends } from './pages/friend-friends'
import { NotFound } from './pages/not-found'
import { ResetPassword } from './pages/reset-password'

const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900">
    <div className="w-12 h-12 border-4 border-[#27AE60] border-t-transparent rounded-full animate-spin"></div>
  </div>
)
// import { Teste } from './pages/teste'

type AndroidBridge = {
  onUserLogged?: (userId: string) => void
}

type AndroidAppBridge = {
  appReady?: () => void
}

declare global {
  interface Window {
    __playerId?: string
    onReceivePlayerId?: (playerId: string) => void
  }
}

let lastSaved: { userId: string; playerId: string } | null = null

function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

const notifyAndroidUserLogged = (userId: string) => {
  if (typeof window === 'undefined') return

  const bridge = (window as Window & { Android?: AndroidBridge }).Android
  if (!bridge || typeof bridge.onUserLogged !== 'function') return

  try {
    bridge.onUserLogged(userId)
  } catch (error) {
    console.error('Erro ao chamar window.Android.onUserLogged:', error)
  }
}

async function salvarPlayerIdSeLogado() {
  if (typeof window === 'undefined') return

  const user = auth.currentUser
  const playerId = window.__playerId

  if (!user || !playerId) return

  if (
    lastSaved &&
    lastSaved.playerId === playerId &&
    lastSaved.userId === user.uid
  ) return

  lastSaved = { userId: user.uid, playerId }

  try {
    await setDoc(doc(db, 'usuarios', user.uid), {
      player_id: playerId,
      updated_at: Date.now()
    }, { merge: true })
  } catch (error) {
    if (lastSaved && lastSaved.playerId === playerId) {
      lastSaved = null
    }
    throw error
  }
}

export function App() {
  const [showWhatsNew, setShowWhatsNew] = useState(false)
  const [forceUpdateVersion, setForceUpdateVersion] = useState<string | null>(null)

  useEffect(() => {
    const isLocalEnv =
      import.meta.env.DEV ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'

    const checkVersion = async () => {
      const usuarioID = localStorage.getItem('usuarioId')
      if (!usuarioID) return
      
      try {
        const sistemaDoc = await getDoc(doc(db, 'sistema', 'info'))
        const lastVersion = sistemaDoc.data()?.lastVersion
        if (!lastVersion) return
        
        const userDoc = await getDoc(doc(db, 'usuarios', usuarioID))
        const firestoreVersion = userDoc.data()?.lastSeenVersion

        // Do not lock developers/QA in local environment when backend version is ahead.
        if (isLocalEnv) {
          setForceUpdateVersion(null)
          return
        }
        
        if (firestoreVersion !== lastVersion) {
          if (getVersion() === lastVersion || currentRelease.version === lastVersion) {
            setShowWhatsNew(true)
            setForceUpdateVersion(null)
          } else {
            setForceUpdateVersion(lastVersion)
          }
        } else {
          if (localStorage.getItem('lastSeenVersion') !== lastVersion) {
            localStorage.setItem('lastSeenVersion', lastVersion)
          }
        }
      } catch (error) {
        console.error('Error checking version:', error)
      }
    }

    const timer = setTimeout(checkVersion, 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const initializeStreakChecks = async () => {
      const usuarioID = localStorage.getItem('usuarioId')
      if (!usuarioID) return

      try {
        await resetPreviousDaysExercises(usuarioID)
        
        await checkAndResetStreakIfMissed(usuarioID)
      } catch (error) {
        console.error('❌ Error in streak initialization:', error)
      }
    }

    const timer = setTimeout(initializeStreakChecks, 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.onReceivePlayerId = (playerId: string) => {
      if (!playerId) return

      window.__playerId = playerId
      salvarPlayerIdSeLogado().catch((error) => {
        console.error('Erro ao salvar player_id no Firestore:', error)
      })
    }

    return () => {
      delete window.onReceivePlayerId
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user?.uid) {
        localStorage.setItem('usuarioId', user.uid)
        notifyAndroidUserLogged(user.uid)
      }


      // Notify Android that the app is ready
      if (typeof window !== 'undefined') {
        const androidApp = (window as Window & { AndroidApp?: AndroidAppBridge }).AndroidApp
        if (androidApp && typeof androidApp.appReady === 'function') {
          try {
            androidApp.appReady()
          } catch (error) {
            console.error('Erro ao chamar window.AndroidApp.appReady:', error)
          }
        }
      }

      // Background tasks
      if (user?.uid) {
        salvarPlayerIdSeLogado().catch(console.error)
        syncOneSignalUser(user.uid).then(async (result) => {
          if (result.success) {
            await setDoc(doc(db, 'usuarios', user.uid), {
              pushProvider: 'onesignal',
              oneSignalExternalId: user.uid,
              oneSignalSubscriptionId: result.subscriptionId || ''
            }, { merge: true })
          }
        }).catch(console.error)
      } else {
        const localUid = localStorage.getItem('usuarioId')
        if (localUid) {
          syncOneSignalUser(localUid).catch(console.error)
        } else {
          logoutOneSignalUser().catch(console.error)
        }
      }
    })

    return () => unsubscribe()
  }, [])


  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTopOnRouteChange />
        <PWAUpdateNotification />
        <PWAInstallPrompt />
        <WhatsNewModal 
          isOpen={showWhatsNew || !!forceUpdateVersion} 
          onClose={() => setShowWhatsNew(false)} 
          forceUpdateVersion={forceUpdateVersion}
          systemVersion={forceUpdateVersion || getVersion()}
        />
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route element={<LayoutWithoutBottomBar />}>
              <Route path='/' element={<Home />} />
              <Route path='/login' element={<Login />} />
              <Route path='/cadastro' element={<Cadastro />} />
            </Route>

            <Route path='/reset-password' element={<ResetPassword />} />

            <Route element={<LayoutWithBottomBar />}>
              {/* <Route path='/teste' element={<Teste />} /> */}
              <Route path='/train' element={<Training />} />
              {/* Rotas de Amigos */}
              <Route path="/friends" element={<Friends />} />
              <Route path="/friend/:id" element={<FriendProfile />} />
              <Route path="/friend/:id/friends" element={<FriendFriends />} />
              <Route path='/progress' element={<Progress />} />
              <Route path='/profile'>
                <Route index element={<Profile />} />
                <Route path='settings' element={<Settings />} />
                <Route path='body-metrics' element={<BodyMetrics />} />
                <Route path='streak-calendar' element={<StreakCalendar />} />
                <Route path='log' element={<LogPage />} />
                <Route path='connections' element={<TrainerConnections />} />
              </Route>
            </Route>

            <Route path='/admin' element={<AdminLogin />} />
            <Route path='/admin/dashboard' element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path='users' element={<AdminUsers />} />
              <Route path='activities' element={<AdminActivities />} />
              <Route path='bugs' element={<AdminBugs />} />
              <Route path='notifications' element={<AdminNotifications />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  )
}