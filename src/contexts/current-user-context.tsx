import { createContext, use, useEffect, useState, type ReactNode } from 'react'
import { subscribeUserProfile, type UserProfile } from '../data/user-profile'

const CurrentUserContext = createContext<UserProfile | null>(null)

/**
 * Perfil do usuário logado em tempo real, compartilhado pela navegação e pelas telas.
 * Fica null enquanto carrega (ou sem login).
 */
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const userId = localStorage.getItem('usuarioId')
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (!userId) return
    return subscribeUserProfile(userId, setProfile)
  }, [userId])

  return <CurrentUserContext value={profile && profile.id === userId ? profile : null}>{children}</CurrentUserContext>
}

export function useCurrentUser() {
  return use(CurrentUserContext)
}
