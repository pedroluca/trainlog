import { CircleUserRound, Dumbbell, GraduationCap, UsersRound, type LucideIcon } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useCurrentUser } from '../../contexts/current-user-context'
import { usePendingFriendsCount } from '../../hooks/usePendingFriendsCount'

export type AppTab = {
  key: 'train' | 'friends' | 'coaching' | 'profile'
  to: string
  label: string
  icon: LucideIcon
  badge?: number
}

/** Qual aba fica ativa em cada rota (o Progresso faz parte do Perfil, como no app nativo) */
function activeTabKey(pathname: string): AppTab['key'] | null {
  if (pathname.startsWith('/train')) return 'train'
  if (pathname.startsWith('/friends') || pathname.startsWith('/friend/')) return 'friends'
  if (pathname.startsWith('/profile/connections')) return 'coaching'
  if (pathname.startsWith('/profile') || pathname.startsWith('/progress')) return 'profile'
  return null
}

/** As mesmas 4 abas do app nativo, usadas pela cápsula (celular) e pela barra lateral (desktop) */
export function useAppTabs() {
  const profile = useCurrentUser()
  const pendingFriends = usePendingFriendsCount()
  const { pathname } = useLocation()

  const tabs: AppTab[] = [
    { key: 'train', to: '/train', label: 'Treino', icon: Dumbbell },
    { key: 'friends', to: '/friends', label: 'Amigos', icon: UsersRound, badge: pendingFriends },
    { key: 'coaching', to: '/profile/connections', label: profile?.isTrainer ? 'Alunos' : 'Treinador', icon: GraduationCap },
    { key: 'profile', to: '/profile', label: 'Perfil', icon: CircleUserRound },
  ]

  const activeKey = activeTabKey(pathname)
  return { tabs, activeIndex: tabs.findIndex(tab => tab.key === activeKey) }
}
