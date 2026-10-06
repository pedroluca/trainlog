import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebaseConfig'

export type Privacidade = {
  ocultarEmail?: boolean
  ocultarNascimento?: boolean
  ocultarInstagram?: boolean
  ocultarPeso?: boolean
  ocultarAltura?: boolean
  ocultarAmigos?: boolean
  ocultarStreak?: boolean
  ocultarAtividades?: boolean
  ocultarTreinos?: boolean
}

/** Documento de usuarios/{id} (mesmo formato usado pelo app nativo) */
export interface UserProfile {
  id: string
  nome: string
  email?: string
  telefone?: string
  username?: string
  photoURL?: string
  bio?: string
  dataNascimento?: string
  instagram?: string
  /** cm */
  altura?: number
  /** kg */
  peso?: number
  cref?: string
  isTrainer?: boolean
  isPremium?: boolean
  isFounder?: boolean
  isAdmin?: boolean
  isActive?: boolean
  badges?: string[]
  currentStreak?: number
  longestStreak?: number
  totalWorkouts?: number
  freezeCount?: number
  lastStreakWeek?: string
  streakVersion?: number
  /** Dias da semana (0 = domingo) com treino cadastrado */
  scheduledDays?: number[]
  lastBirthdayCelebrationDate?: string
  audioEnabled?: boolean
  emailNotifications?: boolean
  privacidade?: Privacidade
  themeMode?: 'light' | 'dark' | 'system'
  primaryColor?: string
}

export function subscribeUserProfile(userId: string, onChange: (profile: UserProfile | null) => void) {
  return onSnapshot(
    doc(db, 'usuarios', userId),
    snapshot => onChange(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as UserProfile) : null),
    error => console.error('Erro ao assinar o perfil do usuário:', error),
  )
}

/** Primeiro e segundo nome, como o header antigo mostrava */
export function shortName(nome?: string) {
  return (nome ?? '').trim().split(/\s+/).slice(0, 2).join(' ')
}
