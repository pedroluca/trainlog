import { Settings } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/nova-logo-white.svg'
import { useCurrentUser } from '../../contexts/current-user-context'
import { shortName } from '../../data/user-profile'
import { cn } from '../../utils/cn'
import { Avatar } from '../ui/avatar'
import { IconButton } from '../ui/icon-button'
import { useAppTabs } from './tabs'

/** Navegação do desktop (a partir de 1024px): as mesmas abas da cápsula do celular */
export function Sidebar() {
  const { tabs, activeIndex } = useAppTabs()
  const profile = useCurrentUser()
  const navigate = useNavigate()

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-border bg-surface px-3 py-5">
      <Link to="/train" className="flex items-center gap-2.5 px-3 pb-6 focus-ring rounded-xl">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary">
          <img src={logo} alt="" className="size-6" />
        </span>
        <span className="text-lg font-bold tracking-tight">Tractus</span>
      </Link>

      <nav aria-label="Navegação principal" className="flex flex-col gap-1">
        {tabs.map((tab, index) => {
          const active = index === activeIndex
          const Icon = tab.icon
          return (
            <Link
              key={tab.key}
              to={tab.to}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 h-11 px-3 rounded-xl text-[15px] transition-colors focus-ring',
                active ? 'bg-primary/10 text-primary font-semibold' : 'text-muted font-medium hover:bg-surface-2 hover:text-foreground',
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} aria-hidden />
              <span className="flex-1">{tab.label}</span>
              {!!tab.badge && tab.badge > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-danger text-white text-[11px] leading-5 font-bold text-center">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {profile && (
        <div className="mt-auto flex items-center gap-1 border-t border-border pt-4">
          <Link to="/profile" className="flex flex-1 min-w-0 items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-2 focus-ring">
            <Avatar name={profile.nome} src={profile.photoURL} size={36} ring={profile.isFounder ? 'founder' : profile.isPremium ? 'premium' : null} />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">{shortName(profile.nome)}</span>
              <span className="truncate text-xs text-muted">{profile.username ? `@${profile.username}` : 'Ver perfil'}</span>
            </span>
          </Link>
          <IconButton icon={Settings} label="Configurações" onClick={() => navigate('/profile/settings')} />
        </div>
      )}
    </aside>
  )
}
