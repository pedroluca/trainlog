import { NavLink } from 'react-router-dom'

export function BottomBarItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `cursor-pointer p-4 ${isActive ? 'text-white' : ''}`
      }
    >
      {children}
    </NavLink>
  )
}