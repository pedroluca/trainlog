import { Award } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BadgeList } from '../components/badges'
import { PremiumUpgrade } from '../components/premium-upgrade'
import { Card } from '../components/ui/card'
import { EmptyState, LoadingState } from '../components/ui/misc'
import { Page, StackHeader } from '../components/ui/page'
import { useCurrentUser } from '../contexts/current-user-context'
import { resolveUserBadges, type BadgeDefinition } from '../data/badges'
import { findUserByIdOrUsername } from '../data/profile'

export function FriendBadges() {
  const { id = '' } = useParams<{ id: string }>()
  const viewer = useCurrentUser()
  const [badges, setBadges] = useState<BadgeDefinition[] | null>(null)
  const [premiumOpen, setPremiumOpen] = useState(false)

  useEffect(() => {
    let active = true
    findUserByIdOrUsername(id)
      .then(user => active && setBadges(user ? resolveUserBadges(user) : []))
      .catch(() => active && setBadges([]))
    return () => {
      active = false
    }
  }, [id])

  return (
    <>
      <StackHeader title="Conquistas" backTo={`/friend/${id}`} />
      {!badges ? (
        <LoadingState />
      ) : (
        <Page className="pt-2">
          {badges.length === 0 ? (
            <Card><EmptyState icon={Award} title="Nenhuma conquista por aqui ainda" /></Card>
          ) : (
            <BadgeList badges={badges} onUpgrade={viewer?.isPremium ? undefined : () => setPremiumOpen(true)} />
          )}
        </Page>
      )}
      <PremiumUpgrade open={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </>
  )
}
