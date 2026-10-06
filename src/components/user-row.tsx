import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { resolveAvatarTone, resolveUserBadges } from '../data/badges'
import type { UserProfile } from '../data/user-profile'
import { cn } from '../utils/cn'
import { Avatar } from './ui/avatar'

type UserRowProps = {
  user: Pick<UserProfile, 'nome' | 'username' | 'photoURL' | 'isTrainer' | 'isFounder' | 'isPremium' | 'badges'>
  /** Rota interna: a linha vira link */
  to?: string
  onClick?: () => void
  /** Ações à direita (ficam fora da área clicável da linha) */
  right?: ReactNode
  subtitle?: string
  className?: string
}

/** Linha de usuário (amigos, solicitações, alunos) */
export function UserRow({ user, to, onClick, right, subtitle, className }: UserRowProps) {
  const ring = resolveAvatarTone(resolveUserBadges(user))
  const interactive = !!to || !!onClick

  const content = (
    <>
      <Avatar name={user.nome} src={user.photoURL} size={44} ring={ring} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-base font-semibold">{user.nome}</span>
        <span className="flex items-center gap-2">
          {(subtitle || user.username) && <span className="truncate text-xs text-muted">{subtitle ?? `@${user.username}`}</span>}
          {user.isTrainer && <span className="shrink-0 rounded-md bg-info/10 px-1.5 py-0.5 text-[10px] font-semibold text-info">TREINADOR</span>}
        </span>
      </span>
    </>
  )

  const mainClasses = cn('flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left', !right && 'pr-4', interactive && 'focus-ring focus-visible:-outline-offset-2')

  return (
    <div className={cn('flex items-center gap-2', interactive && 'transition-colors hover:bg-surface-2', className)}>
      {to ? (
        <Link to={to} className={mainClasses}>{content}</Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={mainClasses}>{content}</button>
      ) : (
        <div className={mainClasses}>{content}</div>
      )}
      {right && <div className="flex shrink-0 items-center gap-2 pr-4">{right}</div>}
    </div>
  )
}
