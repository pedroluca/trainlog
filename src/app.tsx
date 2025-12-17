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
import { AdminDashboard } from './pages/admin-dashboard'
import { StreakCalendar } from './pages/streak-calendar'
import { PWAInstallPrompt } from './components/pwa-install-prompt'
import { PWAUpdateNotification } from './components/pwa-update-notification'
import { WhatsNewModal } from './components/whats-new-modal'
import { ThemeProvider } from './contexts/theme-context'
import { currentRelease } from './data/whats-new'
import { checkAndResetStreakIfMissed, resetPreviousDaysExercises } from './data/streak-utils'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebaseConfig'
// import { Teste } from './pages/teste'

export function App() {
  const [showWhatsNew, setShowWhatsNew] = useState(false)

  useEffect(() => {
    const checkVersion = async () => {
      const usuarioID = localStorage.getItem('usuarioId')
      if (!usuarioID) return

      const lastSeenVersion = localStorage.getItem('lastSeenVersion')
      
      if (lastSeenVersion !== currentRelease.version) {
        try {
          const userDoc = await getDoc(doc(db, 'usuarios', usuarioID))
          const firestoreVersion = userDoc.data()?.lastSeenVersion
          
          if (firestoreVersion !== currentRelease.version) {
            setShowWhatsNew(true)
          } else {
            localStorage.setItem('lastSeenVersion', currentRelease.version)
          }
        } catch (error) {
          console.error('Error checking version:', error)
          setShowWhatsNew(true)
        }
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
        
        console.log('✅ Streak checks completed')
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
        <WhatsNewModal isOpen={showWhatsNew} onClose={() => setShowWhatsNew(false)} />
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
          <Route path='/admin/dashboard' element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}