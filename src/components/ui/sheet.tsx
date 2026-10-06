import { X, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { IconButton } from './icon-button'
import { useEscape, usePresence, useScrollLock } from '../../hooks/useOverlay'
import { Portal } from './portal'

type SheetProps = {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  /** Rodapé fixo (botões de salvar/cancelar), fora da área que rola */
  footer?: ReactNode
  dismissable?: boolean
  /** Largura máxima no desktop */
  size?: 'sm' | 'md' | 'lg'
  contentClassName?: string
}

const sizeClasses = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }

/**
 * No celular, folha que sobe da parte de baixo (como no app nativo).
 * A partir de 640px, vira um modal centralizado com botão de fechar.
 */
export function Sheet({ open, onClose, title, description, children, footer, dismissable = true, size = 'md', contentClassName }: SheetProps) {
  const { mounted, closing } = usePresence(open)
  const close = dismissable ? onClose : undefined
  useScrollLock(mounted)
  useEscape(open, close)

  if (!mounted) return null

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
        <div
          aria-hidden
          onClick={close}
          className={cn('absolute inset-0 bg-black/50 animate-overlay-in transition-opacity duration-150', closing && 'opacity-0')}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={cn(
            'relative flex flex-col w-full max-h-[88dvh] bg-surface text-foreground shadow-2xl transition-[opacity,transform] duration-150',
            'rounded-t-3xl animate-sheet-in pb-[max(env(safe-area-inset-bottom),16px)]',
            'sm:rounded-3xl sm:animate-dialog-in sm:pb-5',
            sizeClasses[size],
            closing && 'opacity-0 translate-y-4 sm:translate-y-0',
          )}
        >
          <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-surface-3" />
          </div>

          {(title || description) && (
            <div className="flex items-start gap-3 px-5 pt-2 pb-3 sm:pt-5">
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                {title && <h2 className="type-heading">{title}</h2>}
                {description && <p className="text-sm leading-5 text-muted">{description}</p>}
              </div>
              {close && <IconButton icon={X} label="Fechar" onClick={close} size={36} iconSize={18} className="hidden sm:inline-flex -mr-2 -mt-1" />}
            </div>
          )}

          <div className={cn('flex-1 overflow-y-auto overscroll-contain px-5 pb-2', contentClassName)}>{children}</div>

          {footer && <div className="px-5 pt-3">{footer}</div>}
        </div>
      </div>
    </Portal>
  )
}

export type ActionItem = {
  label: string
  icon?: LucideIcon
  destructive?: boolean
  /** Roda dentro do próprio clique (necessário para abrir o seletor de arquivos) */
  immediate?: boolean
  onSelect: () => void
}

/** Lista de ações (menu de contexto). No desktop aparece como um modal compacto */
export function ActionSheet({ open, onClose, title, actions }: {
  open: boolean
  onClose: () => void
  title?: string
  actions: ActionItem[]
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col pb-2">
        {actions.map(action => {
          const Icon = action.icon
          return (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                onClose()
                if (action.immediate) action.onSelect()
                // Deixa a folha fechar antes de abrir outra tela/modal
                else setTimeout(action.onSelect, 180)
              }}
              className={cn(
                'flex items-center gap-3.5 py-3.5 px-2 -mx-1 rounded-xl text-left text-base transition-colors hover:bg-surface-2 focus-ring',
                action.destructive ? 'text-danger' : 'text-foreground',
              )}
            >
              {Icon && <Icon size={20} aria-hidden />}
              {action.label}
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}
