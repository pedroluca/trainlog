import { Dumbbell, FileText, UserRound, TrendingUp } from 'lucide-react'
import { BottomBarItem } from './bottom-bar-item'

export function BottomBar() {
  const usuarioID = localStorage.getItem('usuarioId')
  const isLogged = usuarioID ? true : false

  return (
    <nav
      className={`${
        isLogged ? 'fixed' : 'hidden'
      } bottom-6 left-0 right-0 flex items-center justify-center px-4 z-10`}
    >
      {/* Liquid glass pill-style dock container */}
      <div className='bg-[#1a4d2e]/80 backdrop-blur-2xl rounded-[32px] px-8 py-1 shadow-[0_8px_32px_rgba(26,77,46,0.4)] border border-white/20 flex items-center justify-center gap-12 relative overflow-hidden'>
        {/* Subtle gradient overlay for glass effect */}
        <div className='absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-[32px]'></div>
        
        {/* Content */}
        <div className='relative flex items-center gap-8'>
          <BottomBarItem to='/log'>
            <FileText size={28} />
          </BottomBarItem>
          <BottomBarItem to='/train'>
            <Dumbbell size={28} />
          </BottomBarItem>
          <BottomBarItem to='/progress'>
            <TrendingUp size={28} />
          </BottomBarItem>
          <BottomBarItem to='/profile'>
            <UserRound size={28} />
          </BottomBarItem>
        </div>
      </div>
    </nav>
  )
}
