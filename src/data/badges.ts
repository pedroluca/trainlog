// Badge definitions — static source of truth, no Firestore needed
// Add new badges here; the UI will pick them up automatically.

import type { LucideIcon } from 'lucide-react'
import { Crown, Laptop, GraduationCap, Rocket, Flame, Trophy } from 'lucide-react'

/** Cor da conquista, ligada aos tokens do tema (--color-founder, --color-premium...) */
export type BadgeTone = 'founder' | 'premium' | 'info' | 'success' | 'streak'

export interface BadgeDefinition {
  id: string
  tone: BadgeTone
  title: string
  description: string
  Icon: LucideIcon
  /** Defined order = "special" badge; shown first, sorted by this value */
  order?: number
  /** If true, this badge's color drives the avatar ring */
  hasImageBorder: boolean
  /** Tailwind ring classes applied to the avatar */
  ringClass?: string
  /** Tailwind gradient/glow classes for the avatar shadow */
  glowClass?: string
  /** Background + text classes for the badge circle */
  chipClass: string
  /** Whether to show an "upgrade" CTA in the modal (for premium-gated badges) */
  upgradeLink?: boolean
}

/** Tamanho de cada bloco de marco da streak, em semanas */
export const STREAK_MILESTONE_WEEKS = 4

export function getStreakMilestoneValue(streak: number): number {
  if (streak < STREAK_MILESTONE_WEEKS) return 0
  return Math.floor(streak / STREAK_MILESTONE_WEEKS) * STREAK_MILESTONE_WEEKS
}

function createStreakMilestoneBadge(milestoneValue: number): BadgeDefinition {
  return {
    id: 'streak-milestone',
    tone: 'streak',
    title: `${milestoneValue} Semanas de Streak`,
    description: `Completou ${milestoneValue} semanas seguidas de treino. Cada bloco de ${STREAK_MILESTONE_WEEKS} semanas fortalece sua consistência.`,
    Icon: Flame,
    order: 4.5,
    hasImageBorder: false,
    chipClass: 'bg-red-500/15 border-2 border-red-500 text-red-400 dark:text-red-300'
  }
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'founder',
    tone: 'founder',
    title: 'Fundador',
    description: 'Desenvolvedor que fundou o Tractus. Obrigado por acreditar desde o início!',
    Icon: Laptop,
    order: 0,
    hasImageBorder: true,
    ringClass: 'ring-4 ring-purple-500 dark:ring-purple-400',
    glowClass: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]',
    chipClass: 'bg-purple-500/15 border-2 border-purple-500 text-purple-400 dark:text-purple-300',
  },
  {
    id: 'premium',
    tone: 'premium',
    title: 'Premium',
    description: 'Usuário com acesso premium ao Tractus. Desfruta de todos os recursos exclusivos da plataforma.',
    Icon: Crown,
    order: 1,
    hasImageBorder: true,
    ringClass: 'ring-4 ring-amber-400 dark:ring-amber-500',
    glowClass: 'shadow-lg shadow-amber-400/40',
    chipClass: 'bg-amber-400/15 border-2 border-amber-400 text-amber-400 dark:text-amber-300',
    upgradeLink: true,
  },
  {
    id: 'trainer',
    tone: 'info',
    title: 'Treinador',
    description: 'Personal trainer verificado no Tractus. Profissional qualificado para orientar treinos.',
    Icon: GraduationCap,
    order: 2,
    hasImageBorder: false,
    chipClass: 'bg-blue-500/15 border-2 border-blue-500 text-blue-400 dark:text-blue-300',
  },
  {
    id: 'alpha',
    tone: 'success',
    title: 'Alpha User',
    description: 'Fez parte da fase Alpha do Tractus, testando o app antes de ser lançado ao público.',
    Icon: Rocket,
    order: 3,
    hasImageBorder: false,
    chipClass: 'bg-emerald-400/15 border-2 border-emerald-500 text-emerald-400 dark:text-emerald-300',
  },
  {
    id: 'streak-milestone',
    tone: 'streak',
    title: 'Streak Milestone',
    description: 'Conquista dinâmica de marcos de consistência em blocos de 4 semanas.',
    Icon: Flame,
    order: 4.5,
    hasImageBorder: false,
    chipClass: 'bg-red-500/15 border-2 border-red-500 text-red-400 dark:text-red-300',
  },
  {
    id: 'streak-100',
    tone: 'streak',
    title: '100 Dias de Treino',
    description: 'Este usuário completou 100 dias de treino. Uau!',
    Icon: Flame,
    order: 5,
    hasImageBorder: false,
    chipClass: 'bg-red-500/15 border-2 border-red-500 text-red-400 dark:text-red-300',
  },
  {
    id: 'streak-leader',
    tone: 'streak',
    title: 'Líder de Treinos',
    description: 'Este usuário tem o maior acumulado de streaks!',
    Icon: Trophy,
    order: 4,
    hasImageBorder: false,
    chipClass: 'bg-red-500/15 border-2 border-red-500 text-red-400 dark:text-red-300',
  }
]

const BADGE_MAP = new Map(BADGE_DEFINITIONS.map(b => [b.id, b]))

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGE_MAP.get(id)
}

/**
 * Resolve which badges a user has, in display order.
 *
 * Source of truth: `userData.badges: string[]`
 * Fallback for existing users that don't have the field yet:
 * derive from `isFounder`, `isPremium`, `isTrainer` booleans.
 */
export function resolveUserBadges(userData: {
  badges?: string[]
  isFounder?: boolean
  isPremium?: boolean
  isTrainer?: boolean
  longestStreak?: number
  streakVersion?: number
}): BadgeDefinition[] {
  let ids: string[]

  if (userData.badges && userData.badges.length > 0) {
    ids = userData.badges
  } else {
    // Backward-compat fallback
    ids = []
    if (userData.isFounder) ids.push('founder')
    if (userData.isPremium) ids.push('premium')
    if (userData.isTrainer) ids.push('trainer')
  }

  const resolved = ids
    .map(id => getBadgeById(id))
    .filter(Boolean) as BadgeDefinition[]

  // Perfis ainda não migrados para a streak semanal guardam longestStreak em dias
  const milestoneValue = userData.streakVersion === 2 ? getStreakMilestoneValue(userData.longestStreak || 0) : 0
  if (milestoneValue > 0) {
    resolved.push(createStreakMilestoneBadge(milestoneValue))
  }

  // Sort: ordered badges first (by order), then unordered badges
  resolved.sort((a, b) => {
    const aOrder = a.order ?? Infinity
    const bOrder = b.order ?? Infinity
    return aOrder - bOrder
  })

  return resolved
}

/**
 * Returns the avatar ring/glow classes based on the highest-priority badge
 * with hasImageBorder = true. If none, returns the neutral ring.
 */
export function resolveAvatarRing(badges: BadgeDefinition[]): string {
  const borderBadge = badges.find(b => b.hasImageBorder)
  if (!borderBadge) return 'ring-4 ring-white dark:ring-[#1e1e1e]'
  return `${borderBadge.ringClass ?? ''} ${borderBadge.glowClass ?? ''}`.trim()
}

/** Anel do avatar: a conquista de maior prioridade que pinta a borda (fundador > premium) */
export function resolveAvatarTone(badges: BadgeDefinition[]): 'founder' | 'premium' | null {
  const borderBadge = badges.find(badge => badge.hasImageBorder)
  return borderBadge?.tone === 'founder' || borderBadge?.tone === 'premium' ? borderBadge.tone : null
}
