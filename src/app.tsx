import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LayoutWithBottomBar } from './layouts/layout-with-bottombar'
import { LayoutWithoutBottomBar } from './layouts/layout-without-bottombar'
import { Home } from './pages/home'
import { Training } from './pages/training'
import { Login } from './pages/login'
import { Cadastro } from './pages/register'
import { Profile } from './pages/profile'
import { LogPage } from './pages/log'
import { Progress } from './pages/progress'
import { ResetPassword } from './pages/reset-password'
import { AdminLogin } from './pages/admin-login'
import { AdminDashboard } from './pages/admin-dashboard'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas sem a BottomBar */}
        <Route element={<LayoutWithoutBottomBar />}>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/cadastro' element={<Cadastro />} />
        </Route>

        {/* Reset Password (no layout) */}
        <Route path='/reset-password' element={<ResetPassword />} />

        {/* Rotas com a BottomBar */}
        <Route element={<LayoutWithBottomBar />}>
          <Route path='/log' element={<LogPage />} />
          <Route path='/train' element={<Training />} />
          <Route path='/progress' element={<Progress />} />
          <Route path='/profile' element={<Profile />} />
        </Route>

        {/* Admin Routes (no layout) */}
        <Route path='/admin' element={<AdminLogin />} />
        <Route path='/admin/dashboard' element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}