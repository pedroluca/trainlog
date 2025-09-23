import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LayoutWithBottomBar } from './layouts/layout-with-bottombar'
import { LayoutWithoutBottomBar } from './layouts/layout-without-bottombar'
import { Home } from './pages/home'
import { Training } from './pages/training'
import { Login } from './pages/login'
import { Cadastro } from './pages/register'
import { Profile } from './pages/profile'
import { LogPage } from './pages/log'

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

        {/* Rotas com a BottomBar */}
        <Route element={<LayoutWithBottomBar />}>
          <Route path='/log' element={<LogPage />} />
          <Route path='/train' element={<Training />} />
          <Route path='/profile' element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}