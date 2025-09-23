import { Dumbbell, FileText, UserRound } from 'lucide-react'
import { BottomBarItem } from './bottom-bar-item'

export function BottomBar() {
  const usuarioID = localStorage.getItem('usuarioId')
  const isLogged = usuarioID ? true : false

  return (
    <nav
      className={`${
        isLogged ? 'fixed' : 'hidden'
      } h-16 bg-gray-800 text-gray-400 flex items-center justify-around bottom-0 left-0 right-0`}
    >
      <BottomBarItem to='/log'>
        <FileText />
      </BottomBarItem>
      <BottomBarItem to='/train'>
        <Dumbbell />
      </BottomBarItem>
      <BottomBarItem to='/profile'>
        <UserRound />
      </BottomBarItem>
    </nav>
  )
}
