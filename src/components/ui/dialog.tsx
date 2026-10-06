import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { useEscape, usePresence, useScrollLock } from '../../hooks/useOverlay'
import { Portal } from './portal'

type DialogProps = {
  open: boolean
  onClose?: () => void
  children: ReactNode
  className?: string
  /** Rótulo lido por leitores de tela */
  label?: string
  /** "pop" dá o pulo com mola, reservado para celebrações; o padrão só aparece suave */
  animation?: 'subtle' | 'pop'
}

/** Caixa centralizada para avisos e celebrações (confirmações usam useConfirm) */
export function Dialog({ open, onClose, children, className, label, animation = 'subtle' }: DialogProps) {
  const { mounted, closing } = usePresence(open)
  useScrollLock(mounted)
  useEscape(open, onClose)

  if (!mounted) return null

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div
          aria-hidden
          onClick={onClose}
          className={cn('absolute inset-0 bg-black/55 animate-overlay-in transition-opacity duration-150', closing && 'opacity-0')}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className={cn(
            'relative w-full max-w-sm bg-surface text-foreground rounded-3xl p-6 shadow-2xl transition-opacity duration-150',
            animation === 'pop' ? 'animate-dialog-pop' : 'animate-dialog-in',
            closing && 'opacity-0',
            className,
          )}
        >
          {children}
        </div>
      </div>
    </Portal>
  )
}
