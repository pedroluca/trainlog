import { Outlet } from 'react-router-dom'
import { Header } from '../components/header'
import { BottomBar } from '../components/bottom-bar'
import { Footer } from '../components/footer'

export function LayoutWithBottomBar() {
  return (
    <>
      <Header />
      <Outlet /> {/* Renderiza a página correspondente */}
      <Footer />
      <BottomBar />
    </>
  )
}