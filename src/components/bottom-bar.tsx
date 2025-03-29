import { Dumbbell, Home, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export function BottomBar() {
  return (
    <nav className='h-16 bg-gray-800 text-white flex items-center justify-around fixed bottom-0 left-0 right-0'>
      <NavLink to='/' className='cursor-pointer p-4'>
        <Home />
      </NavLink>
      <NavLink to='/train' className='cursor-pointer p-4'>
        <Dumbbell />
      </NavLink>
      <NavLink to='/' className='cursor-pointer p-4'>
        <UserRound />
      </NavLink>
    </nav>
  )
}