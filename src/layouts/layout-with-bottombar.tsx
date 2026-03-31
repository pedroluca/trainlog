import { Outlet } from 'react-router-dom'
import { Header } from '../components/header'
import { BottomBar } from '../components/bottom-bar'

export function LayoutWithBottomBar() {
  // const url = useLocation()
  
  return (
    <main>
      <Header />
      <div className='pt-16'>
        <Outlet />
      </div>
      <BottomBar />
    </main>
  )
}