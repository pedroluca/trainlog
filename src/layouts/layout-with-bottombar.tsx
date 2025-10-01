import { Outlet } from 'react-router-dom'
import { Header } from '../components/header'
import { BottomBar } from '../components/bottom-bar'

export function LayoutWithBottomBar() {
  return (
    <main>
      <Header />
      <Outlet />
      <BottomBar />
    </main>
  )
}