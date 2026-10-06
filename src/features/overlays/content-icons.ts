import { CalendarDays, Crown, Dumbbell, Flame, Snowflake, Sparkles, TrendingUp, UsersRound, type LucideIcon } from 'lucide-react'

// Ícones do onboarding e das novidades (os textos em data/ ainda guardam emojis para o histórico,
// mas a interface usa os mesmos ícones do app nativo)
const ICONS: Record<string, LucideIcon> = {
  // Onboarding
  welcome: Dumbbell,
  workouts: CalendarDays,
  streak: Flame,
  progress: TrendingUp,
  friends: UsersRound,
  premium: Crown,
  // Novidades
  'weekly-streak': Flame,
  'weekly-freezes': Snowflake,
  'total-workouts': Dumbbell,
  'calendar-streak-weeks': CalendarDays,
  'premium-calendar': CalendarDays,
  'workout-streak': Flame,
  friendships: UsersRound,
  'progressive-weight': TrendingUp,
}

export const contentIcon = (id: string): LucideIcon => ICONS[id] ?? Sparkles
