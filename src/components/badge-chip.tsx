import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X, Crown, ChevronRight } from 'lucide-react'
import { type BadgeDefinition } from '../data/badges'

// ─── Badge Modal ──────────────────────────────────────────────────────────────

type BadgeModalProps = {
  badge: BadgeDefinition
  onClose: () => void
  onUpgrade: () => void
  userIsPremium?: boolean
}

export function BadgeModal({ badge, onClose, onUpgrade, userIsPremium = false }: BadgeModalProps) {
  const { Icon, title, description, chipClass } = badge

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-6 w-full max-w-xs shadow-2xl border border-gray-100 dark:border-[#333] flex flex-col items-center text-center relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors"
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border-2 ${chipClass}`}>
          <Icon size={28} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-2">{title}</h3>

        {/* Description */}
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>

        {/* Upgrade CTA */}
        {!userIsPremium && title === 'Premium' && (
          <button
            onClick={() => { onUpgrade(); onClose() }}
            className="mt-5 flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors border border-amber-300 dark:border-amber-600/50 rounded-full px-4 py-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/10"
          >
            <Crown size={12} />
            Torne-se Premium também
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Badge Chip ───────────────────────────────────────────────────────────────

type BadgeChipProps = {
  badge: BadgeDefinition
  onClick: (badge: BadgeDefinition) => void
}

export function BadgeChip({ badge, onClick }: BadgeChipProps) {
  const { Icon, title, chipClass } = badge

  return (
    <button
      type="button"
      title={title}
      onClick={() => onClick(badge)}
      className={`
        shrink-0 w-10 h-10 rounded-full flex items-center justify-center
        hover:scale-110 active:scale-95 transition-transform cursor-pointer
        ${chipClass}
      `}
    >
      <Icon size={18} strokeWidth={2.5} />
    </button>
  )
}

// ─── Badge List ───────────────────────────────────────────────────────────────

type BadgeListProps = {
  badges: BadgeDefinition[]
  userIsPremium?: boolean
  onUpgrade: () => void
  viewAllHref?: string
}

export function BadgeList({ badges, userIsPremium = false, onUpgrade, viewAllHref }: BadgeListProps) {
  const [activeBadge, setActiveBadge] = useState<BadgeDefinition | null>(null)

  if (badges.length === 0) return null

  return (
    <>
      <div className="flex items-center gap-2 mt-2 overflow-x-auto scrollbar-hide pr-1">
        {badges.map(badge => (
          <BadgeChip
            key={badge.id}
            badge={badge}
            onClick={setActiveBadge}
          />
        ))}

        {viewAllHref && (
          <Link
            to={viewAllHref}
            title="Ver todas"
            className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-[#2d2d2d] border-2 border-gray-200 dark:border-[#404040] text-gray-500 dark:text-gray-400 hover:scale-110 active:scale-95 transition-transform"
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </Link>
        )}
      </div>

      {activeBadge && (
        <BadgeModal
          badge={activeBadge}
          onClose={() => setActiveBadge(null)}
          onUpgrade={onUpgrade}
          userIsPremium={userIsPremium}
        />
      )}
    </>
  )
}

// ─── Badge Gallery ────────────────────────────────────────────────────────────

type BadgeGalleryProps = {
  badges: BadgeDefinition[]
  userIsPremium?: boolean
  onUpgrade?: () => void
}

export function BadgeGallery({ badges, userIsPremium = false, onUpgrade }: BadgeGalleryProps) {
  if (badges.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
        Nenhuma conquista por aqui ainda.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {badges.map(badge => {
        const { Icon, title, description, chipClass } = badge
        return (
          <div
            key={badge.id}
            className="flex items-center gap-4 bg-white dark:bg-[#1e1e1e] rounded-xl p-4 border border-gray-100 dark:border-[#333]"
          >
            <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 ${chipClass}`}>
              <Icon size={22} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
              {!userIsPremium && title === 'Premium' && onUpgrade && (
                <button
                  onClick={onUpgrade}
                  className="mt-1.5 self-start flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors border border-amber-300 dark:border-amber-600/50 rounded-full px-3 py-1 hover:bg-amber-50 dark:hover:bg-amber-900/10"
                >
                  <Crown size={12} />
                  Torne-se Premium também
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
