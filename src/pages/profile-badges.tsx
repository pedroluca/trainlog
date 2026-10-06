import { Award } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BadgeList } from '../components/badges'
import { PremiumUpgrade } from '../components/premium-upgrade'
import { Card } from '../components/ui/card'
import { EmptyState, LoadingState } from '../components/ui/misc'
import { Page, StackHeader } from '../components/ui/page'
import { useCurrentUser } from '../contexts/current-user-context'
import { resolveUserBadges, STREAK_MILESTONE_WEEKS } from '../data/badges'

export function ProfileBadges() {
  const profile = useCurrentUser()
  const badges = useMemo(() => (profile ? resolveUserBadges(profile) : []), [profile])
  const [premiumOpen, setPremiumOpen] = useState(false)

  return (
    <>
      <StackHeader title="Conquistas" backTo="/profile" />
      {!profile ? (
        <LoadingState />
      ) : (
        <Page className="pt-2">
          {badges.length === 0 ? (
            <Card>
              <EmptyState
                icon={Award}
                title="Nenhuma conquista ainda"
                description={`Treine ${STREAK_MILESTONE_WEEKS} semanas seguidas para ganhar sua primeira conquista de streak.`}
              />
            </Card>
          ) : (
            <BadgeList badges={badges} onUpgrade={profile.isPremium ? undefined : () => setPremiumOpen(true)} />
          )}
          <p className="px-4 text-center text-xs text-subtle">
            Conquistas de streak são liberadas a cada {STREAK_MILESTONE_WEEKS} semanas seguidas de treino.
          </p>
        </Page>
      )}
      <PremiumUpgrade open={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </>
  )
}
