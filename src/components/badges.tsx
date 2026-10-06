import { ChevronRight, Crown } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { BadgeDefinition, BadgeTone } from '../data/badges'
import { Button } from './ui/button'
import { Sheet } from './ui/sheet'

export const badgeColor = (tone: BadgeTone) => `var(--color-${tone})`

function BadgeIcon({ badge, size = 40 }: { badge: BadgeDefinition; size?: number }) {
  const color = badgeColor(badge.tone)
  const { Icon } = badge
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full border"
      style={{
        width: size,
        height: size,
        color,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
      }}
    >
      <Icon size={size * 0.45} strokeWidth={2.4} aria-hidden />
    </span>
  )
}

function BadgeDetailSheet({ badge, onClose, onUpgrade }: { badge: BadgeDefinition | null; onClose: () => void; onUpgrade?: () => void }) {
  return (
    <Sheet open={!!badge} onClose={onClose} size="sm">
      {badge && (
        <div className="flex flex-col items-center gap-3 pb-3 pt-2 text-center">
          <BadgeIcon badge={badge} size={64} />
          <h2 className="type-heading">{badge.title}</h2>
          <p className="px-2 text-sm leading-5 text-muted">{badge.description}</p>
          {onUpgrade && badge.id === 'premium' && (
            <Button
              label="Quero ser Premium"
              icon={Crown}
              variant="secondary"
              className="mt-2"
              onClick={() => {
                onClose()
                setTimeout(onUpgrade, 180)
              }}
            />
          )}
        </div>
      )}
    </Sheet>
  )
}

/** Fileira de badges do perfil; clicar abre o detalhe */
export function BadgeStrip({ badges, viewAllHref, onUpgrade }: {
  badges: BadgeDefinition[]
  viewAllHref?: string
  /** Presente quando quem vê ainda não é Premium (mostra o convite no detalhe do badge Premium) */
  onUpgrade?: () => void
}) {
  const [active, setActive] = useState<BadgeDefinition | null>(null)
  if (badges.length === 0) return null

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {badges.map(badge => (
          <button
            key={badge.id}
            type="button"
            aria-label={badge.title}
            title={badge.title}
            onClick={() => setActive(badge)}
            className="rounded-full transition-transform hover:scale-105 focus-ring"
          >
            <BadgeIcon badge={badge} size={36} />
          </button>
        ))}
        {viewAllHref && (
          <Link
            to={viewAllHref}
            aria-label="Ver todas as conquistas"
            title="Ver todas as conquistas"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted transition-colors hover:bg-surface-3 focus-ring"
          >
            <ChevronRight size={18} aria-hidden />
          </Link>
        )}
      </div>
      <BadgeDetailSheet badge={active} onClose={() => setActive(null)} onUpgrade={onUpgrade} />
    </>
  )
}

/** Lista completa (tela de conquistas) */
export function BadgeList({ badges, onUpgrade }: { badges: BadgeDefinition[]; onUpgrade?: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {badges.map((badge, index) => (
        <div key={badge.id}>
          {index > 0 && <div className="ml-[72px] h-px bg-border" />}
          <div className="flex items-center gap-4 px-4 py-3.5">
            <BadgeIcon badge={badge} size={44} />
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-base font-semibold">{badge.title}</span>
              <span className="text-xs leading-4 text-muted">{badge.description}</span>
              {onUpgrade && badge.id === 'premium' && (
                <button type="button" onClick={onUpgrade} className="mt-1 self-start text-xs font-semibold text-premium hover:underline">
                  Quero ser Premium também
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
