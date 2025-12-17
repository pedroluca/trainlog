import { Dumbbell, UserRound, TrendingUp } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { BottomBarItem } from './bottom-bar-item'

const navItems = [
  { to: '/progress', index: 0 },
  { to: '/train', index: 1 },
  { to: '/profile', index: 2 },
]

export function BottomBar() {
  const usuarioID = localStorage.getItem('usuarioId')
  const isLogged = usuarioID ? true : false
  const location = useLocation()

  const activeIndex = navItems.find(item => location.pathname === item.to)?.index ?? 1

  const itemWidth = 60 // p-4 (16px * 2) + icon (28px)
  const gap = 32
  const translateX = activeIndex * (itemWidth + gap)

  return (
    <nav
      className={`${
        isLogged ? 'fixed' : 'hidden'
      } bottom-6 left-0 right-0 flex items-center justify-center px-4 z-10`}
    >
      <div className='bg-[#1a4d2e]/80 backdrop-blur-2xl rounded-4xl px-8 py-1 shadow-[0_8px_32px_rgba(26,77,46,0.4)] border border-white/20 flex items-center justify-center gap-12 relative overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-4xl'></div>
        
        <div className='relative flex items-center gap-8'>
          <div
            className='absolute rounded-full transition-all duration-500 ease-out pointer-events-none'
            style={{
              width: `${itemWidth + 12}px`,
              height: `${itemWidth}px`,
              transform: `translateX(${translateX}px)`,
              left: -6,
              top: '50%',
              marginTop: `-${itemWidth / 2}px`,
            }}
          >
            <div className='absolute inset-0 rounded-4xl bg-gradient-to-br from-white/40 to-white/10 blur-[1px] p-[2px]'>
              <div className='w-full h-full rounded-4xl bg-gradient-to-br from-[#1a4d2e]/90 to-[#1a4d2e]/70'></div>
            </div>
            <div className='absolute inset-[2px] rounded-4xl bg-gradient-to-br from-[#2d7a4f] to-[#1a4d2e] shadow-[0_0_20px_rgba(45,122,79,0.6)]'></div>
          </div>

          <BottomBarItem to='/progress'>
            <TrendingUp size={28} />
          </BottomBarItem>
          <BottomBarItem to='/train'>
            <Dumbbell size={28} />
          </BottomBarItem>
          <BottomBarItem to='/profile'>
            <UserRound size={28} />
          </BottomBarItem>
        </div>
      </div>
    </nav>
  )
}
