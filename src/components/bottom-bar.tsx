import { Dumbbell, GraduationCap, TrendingUp, UsersRound } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { BottomBarItem } from './bottom-bar-item'

const navItems = [
  { to: '/train', index: 0 },
  { to: '/friends', index: 1 },
  { to: '/profile/connections', index: 2 },
  { to: '/progress', index: 3 },
]

export function BottomBar() {
  const usuarioID = localStorage.getItem('usuarioId')
  const isLogged = !!usuarioID
  const location = useLocation()

  const activeIndex = navItems.find(item => location.pathname.startsWith(item.to))?.index ?? -1

  const itemWidth = 60 // p-4 (16px * 2) + icon (28px)
  const gap = 24
  const translateX = activeIndex * (itemWidth + gap)

  return (
    <nav
      className={`${
        isLogged ? 'fixed' : 'hidden'
      } bottom-6 md:bottom-12 left-0 right-0 flex items-center justify-center px-6 z-10 lg:hidden`}
    >
      <div className='bg-primary/80 backdrop-blur-2xl rounded-full p-1 shadow-primary-bar border border-white/20 flex items-center justify-center gap-12 relative overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-full' />

        <div className='relative flex items-center gap-6'>
          {/* Sliding active indicator */}
          <div
            className='absolute rounded-full transition-all duration-500 ease-out pointer-events-none'
            style={{
              width: `${itemWidth}px`,
              height: `${itemWidth}px`,
              transform: `translateX(${translateX}px)`,
              left: 0,
              top: '50%',
              marginTop: `-${itemWidth / 2}px`,
            }}
          >
            <div className='absolute inset-0 rounded-4xl bg-gradient-to-br from-white/40 to-white/10 blur-[1px] p-[2px]'>
              <div className='w-full h-full rounded-4xl bg-gradient-to-br from-primary-dark to-primary' />
            </div>
            <div className='absolute inset-[2px] rounded-4xl bg-gradient-to-br from-primary to-primary-dark shadow-primary-glow' />
          </div>

          <BottomBarItem to='/train'>
            <Dumbbell size={28} />
          </BottomBarItem>
          <BottomBarItem to='/friends'>
            <UsersRound size={28} />
          </BottomBarItem>
          <BottomBarItem to='/profile/connections'>
            <GraduationCap size={28} />
          </BottomBarItem>
          <BottomBarItem to='/progress'>
            <TrendingUp size={28} />
          </BottomBarItem>
        </div>
      </div>
    </nav>
  )
}
