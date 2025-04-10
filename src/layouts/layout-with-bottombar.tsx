import { Outlet } from 'react-router-dom'
import { Header } from '../components/header'
import { BottomBar } from '../components/bottom-bar'
import { Footer } from '../components/footer'

export function LayoutWithBottomBar() {
  return (
    <main>
      <Header />
      <Outlet />
      <Footer />
      <BottomBar />
    </main>
  )
}