import { useCurrentUser } from '../contexts/current-user-context'
import { PremiumSheet } from '../features/premium/premium-sheet'

/** Tela do Premium já com os dados do usuário logado */
export function PremiumUpgrade({ open, onClose }: { open: boolean; onClose: () => void }) {
  const profile = useCurrentUser()
  if (!open || !profile) return null
  return <PremiumSheet profile={profile} onClose={onClose} />
}
