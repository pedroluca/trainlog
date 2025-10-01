import { NavLink } from 'react-router-dom'

export function BottomBarItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `cursor-pointer p-4 transition-colors duration-200 ${
          isActive ? 'text-white' : 'text-white/50 hover:text-white/80'
        }`
      }
    >
      {children}
    </NavLink>
  )
}