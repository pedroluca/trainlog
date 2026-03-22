import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { LayoutWithBottomBar } from './layouts/layout-with-bottombar'
import { LayoutWithoutBottomBar } from './layouts/layout-without-bottombar'
import { Home } from './pages/home'
import { Training } from './pages/training'
import { Login } from './pages/login'
import { Cadastro } from './pages/register'
import { Profile } from './pages/profile'
import { Settings } from './pages/settings'
import { LogPage } from './pages/log'
import { Progress } from './pages/progress'
import { BodyMetrics } from './pages/body-metrics'
import { ResetPassword } from './pages/reset-password'
import { AdminLogin } from './pages/admin-login'
import { AdminLayout } from './layouts/admin-layout'
import { AdminOverview } from './pages/admin/overview'
import { AdminUsers } from './pages/admin/users'
import { AdminActivities } from './pages/admin/activities'
import { AdminBugs } from './pages/admin/bugs'
import { StreakCalendar } from './pages/streak-calendar'
import { PWAInstallPrompt } from './components/pwa-install-prompt'
import { PWAUpdateNotification } from './components/pwa-update-notification'
import { WhatsNewModal } from './components/whats-new-modal'
import { ThemeProvider } from './contexts/theme-context'
import { getVersion } from './version'
import { currentRelease } from './data/whats-new'
import { checkAndResetStreakIfMissed, resetPreviousDaysExercises } from './data/streak-utils'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebaseConfig'
import { Friends } from './pages/friends'
import { FriendProfile } from './pages/friend-profile'
import { FriendFriends } from './pages/friend-friends'
// import { Teste } from './pages/teste'

export function App() {
  const [showWhatsNew, setShowWhatsNew] = useState(false)
  const [forceUpdateVersion, setForceUpdateVersion] = useState<string | null>(null)

  useEffect(() => {
    const checkVersion = async () => {
      const usuarioID = localStorage.getItem('usuarioId')
      if (!usuarioID) return
      
      try {
        const sistemaDoc = await getDoc(doc(db, 'sistema', 'info'))
        const lastVersion = sistemaDoc.data()?.lastVersion
        if (!lastVersion) return
        
        const userDoc = await getDoc(doc(db, 'usuarios', usuarioID))
        const firestoreVersion = userDoc.data()?.lastSeenVersion
        
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

  return (
    <ThemeProvider>
      <BrowserRouter>
        <PWAUpdateNotification />
        <PWAInstallPrompt />
        <WhatsNewModal 
          isOpen={showWhatsNew || !!forceUpdateVersion} 
          onClose={() => setShowWhatsNew(false)} 
          forceUpdateVersion={forceUpdateVersion}
          systemVersion={forceUpdateVersion || getVersion()}
        />
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
            </Route>
          </Route>

          <Route path='/admin' element={<AdminLogin />} />
          <Route path='/admin/dashboard' element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path='users' element={<AdminUsers />} />
            <Route path='activities' element={<AdminActivities />} />
            <Route path='bugs' element={<AdminBugs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}