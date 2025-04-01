import { Outlet } from 'react-router-dom'
import { Header } from '../components/header'

export function LayoutWithoutBottomBar() {
  return (
    <>
      <Header />
      <Outlet /> {/* Renderiza a página correspondente */}
    </>
  )
}