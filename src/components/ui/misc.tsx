import type { LucideIcon } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { Button } from './button'

// ─── Chip ────────────────────────────────────────────────────────────────────

export function Chip({ label, selected, onClick, icon: Icon }: { label: string; selected?: boolean; onClick?: () => void; icon?: LucideIcon }) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm font-medium transition-colors focus-ring',
        selected ? 'bg-primary border-primary text-on-primary' : 'bg-surface border-border text-foreground hover:bg-surface-2',
      )}
    >
      {Icon && <Icon size={15} className={selected ? undefined : 'text-muted'} aria-hidden />}
      {label}
    </button>
  )
}

/** Linha de chips que rola na horizontal no celular e quebra linha no desktop */
export function ChipRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex gap-2 overflow-x-auto scrollbar-hide px-0.5 md:flex-wrap md:overflow-visible', className)}>{children}</div>
}

// ─── Segmented control ───────────────────────────────────────────────────────

type SegmentedOption<T extends string> = { value: T; label: string; icon?: LucideIcon }

export function SegmentedControl<T extends string>({ options, value, onChange, className }: {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div role="tablist" className={cn('flex bg-surface-2 rounded-xl p-1', className)}>
      {options.map(option => {
        const selected = option.value === value
        const Icon = option.icon
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-semibold transition-colors focus-ring',
              selected ? 'bg-surface text-foreground shadow-sm' : 'text-muted hover:text-foreground',
            )}
          >
            {Icon && <Icon size={16} aria-hidden />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Estados de tela ─────────────────────────────────────────────────────────

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className }: {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center text-center px-6 py-10 gap-3', className)}>
      <div className="size-14 rounded-2xl bg-surface-2 text-muted flex items-center justify-center mb-1">
        <Icon size={26} aria-hidden />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="text-sm leading-5 text-muted max-w-xs">{description}</p>}
      {actionLabel && onAction && <Button label={actionLabel} onClick={onAction} variant="secondary" className="mt-2" />}
    </div>
  )
}

export function Spinner({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Carregando"
      className={cn('inline-block rounded-full border-2 border-current border-t-transparent animate-spin', className)}
      style={{ width: size, height: size }}
    />
  )
}

export function LoadingState({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-1 items-center justify-center py-16 text-primary', className)}>
      <Spinner />
    </div>
  )
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn('bg-surface-2 rounded-xl animate-pulse', className)} {...props} />
}

// ─── Indicadores ─────────────────────────────────────────────────────────────

export function ProgressBar({ value, className, color }: { value: number; className?: string; color?: string }) {
  const clamped = Math.min(1, Math.max(0, value))
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      className={cn('h-1.5 rounded-full bg-surface-3 overflow-hidden', className)}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${clamped * 100}%`, backgroundColor: color ?? 'var(--color-primary)' }}
      />
    </div>
  )
}

export function StatTile({ label, value, suffix, color, icon: Icon, onClick, className }: {
  label: string
  value: string | number
  suffix?: string
  /** Cor do valor e do ícone (qualquer cor CSS) */
  color?: string
  icon?: LucideIcon
  onClick?: () => void
  className?: string
}) {
  const content = (
    <>
      <span className="flex items-center gap-1.5 text-muted" style={color ? { color } : undefined}>
        {Icon && <Icon size={14} aria-hidden />}
        <span className="text-xs text-muted truncate">{label}</span>
      </span>
      <span className="text-2xl font-bold truncate" style={{ color: color ?? 'var(--color-foreground)' }}>
        {value}
        {suffix && <span className="text-sm font-medium text-subtle">{` ${suffix}`}</span>}
      </span>
    </>
  )
  const classes = cn('flex flex-1 flex-col gap-1 min-w-0 bg-surface-2 rounded-2xl px-3.5 py-3 text-left', className)

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(classes, 'transition-colors hover:bg-surface-3 focus-ring')}>
        {content}
      </button>
    )
  }
  return <div className={classes}>{content}</div>
}

export function Divider({ className }: { className?: string }) {
  return <div role="separator" className={cn('h-px bg-border', className)} />
}

const calloutColors = {
  info: 'var(--color-info)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  success: 'var(--color-success)',
}

/** Aviso destacado (premium, privacidade, erros de importação...) */
export function Callout({ tone = 'info', icon: Icon, title, children, className }: {
  tone?: keyof typeof calloutColors
  icon?: LucideIcon
  title?: string
  children: ReactNode
  className?: string
}) {
  const color = calloutColors[tone]
  return (
    <div className={cn('flex gap-3 rounded-2xl p-3.5', className)} style={{ backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)` }}>
      {Icon && <Icon size={18} className="mt-px shrink-0" style={{ color }} aria-hidden />}
      <div className="flex-1 flex flex-col gap-0.5">
        {title && <p className="text-sm font-semibold" style={{ color }}>{title}</p>}
        {typeof children === 'string' ? <p className="text-sm leading-5 text-muted">{children}</p> : children}
      </div>
    </div>
  )
}
