import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { IconButton } from './icon-button'

export type PageWidth = 'md' | 'lg' | 'xl'

const widthClasses: Record<PageWidth, string> = {
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
}

/** Container padrão das telas: largura máxima, margens e espaçamento entre blocos */
export function Page({ children, width = 'md', className }: { children: ReactNode; width?: PageWidth; className?: string }) {
  return (
    <div className={cn('mx-auto flex w-full flex-col gap-5 px-4 pb-6 lg:px-8', widthClasses[width], className)}>
      {children}
    </div>
  )
}

/** Cabeçalho das telas de aba (Treino, Amigos, Treinador, Perfil): título grande, como no app */
export function PageHeader({ title, subtitle, right, className }: { title: string; subtitle?: string; right?: ReactNode; className?: string }) {
  return (
    <header className={cn('flex items-end justify-between gap-3 pt-3 lg:pt-10', className)}>
      <div className="min-w-0 flex-1">
        {subtitle && <p className="mb-0.5 text-xs text-muted">{subtitle}</p>}
        <h1 className="type-display truncate">{title}</h1>
      </div>
      {right && <div className="flex items-center gap-2 pb-1">{right}</div>}
    </header>
  )
}

/**
 * Cabeçalho das telas empilhadas (configurações, histórico, perfil de amigo...): voltar + título.
 * Fica preso no topo ao rolar, como o header do app nativo.
 */
export function StackHeader({ title, backTo, right, width = 'md' }: {
  title: string
  /** Rota de volta quando a tela é aberta direto (sem histórico) */
  backTo?: string
  right?: ReactNode
  width?: PageWidth
}) {
  const navigate = useNavigate()
  const location = useLocation()

  const goBack = () => {
    // 'default' é a primeira página da sessão: não há para onde voltar dentro do app
    if (location.key !== 'default') navigate(-1)
    else navigate(backTo ?? '/train')
  }

  return (
    <header className="sticky top-[env(safe-area-inset-top)] z-20 bg-background/85 backdrop-blur-md">
      <div className={cn('mx-auto flex h-14 w-full items-center gap-2 px-2 lg:h-24 lg:gap-3 lg:px-6 lg:pt-4', widthClasses[width])}>
        <IconButton icon={ArrowLeft} label="Voltar" variant="ghost" onClick={goBack} className="lg:bg-surface-2 lg:hover:bg-surface-3" />
        <h1 className="flex-1 truncate type-heading lg:text-2xl lg:font-bold">{title}</h1>
        {right && <div className="flex items-center gap-1">{right}</div>}
      </div>
    </header>
  )
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="type-overline text-subtle">{title}</h2>
      {action}
    </div>
  )
}
