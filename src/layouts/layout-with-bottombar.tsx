import { Outlet, useLocation } from 'react-router-dom'
import { Header } from '../components/header'
import { BottomBar } from '../components/bottom-bar'

export function LayoutWithBottomBar() {
  const url = useLocation()
  
  return (
    <main>
      <Header isFixed={url.pathname.startsWith('/train')} />
      <Outlet />
      <BottomBar />
    </main>
  )
}