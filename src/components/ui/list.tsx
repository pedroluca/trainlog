import { ChevronRight, type LucideIcon } from 'lucide-react'
import { Children, Fragment, isValidElement, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

type SectionProps = {
  title?: string
  footer?: string
  children: ReactNode
  className?: string
}

/** Grupo de linhas no estilo das configurações nativas (cartão com divisórias) */
export function ListSection({ title, footer, children, className }: SectionProps) {
  const items = Children.toArray(children).filter(isValidElement)
  return (
    <section className={cn('flex flex-col gap-2', className)}>
      {title && <h2 className="type-overline text-subtle px-1">{title}</h2>}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        {items.map((child, index) => (
          <Fragment key={child.key ?? index}>
            {index > 0 && <div className="h-px bg-border ml-14" />}
            {child}
          </Fragment>
        ))}
      </div>
      {footer && <p className="text-xs text-subtle px-1">{footer}</p>}
    </section>
  )
}

type RowProps = {
  title: string
  description?: string
  icon?: LucideIcon
  /** Cor do ícone (qualquer cor CSS); o padrão é a primária */
  iconColor?: string
  value?: string
  /** Rota interna: a linha vira um link */
  to?: string
  onClick?: () => void
  accessory?: ReactNode
  showChevron?: boolean
  destructive?: boolean
  disabled?: boolean
}

export function ListRow({ title, description, icon: Icon, iconColor, value, to, onClick, accessory, showChevron, destructive, disabled }: RowProps) {
  const interactive = (!!to || !!onClick) && !disabled
  const tint = destructive ? 'var(--color-danger)' : iconColor ?? 'var(--color-primary)'
  const chevron = showChevron ?? (interactive && !accessory)

  const content = (
    <>
      {Icon && (
        <span
          className="size-8 shrink-0 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `color-mix(in srgb, ${tint} 12%, transparent)`, color: tint }}
        >
          <Icon size={18} strokeWidth={2.2} aria-hidden />
        </span>
      )}
      <span className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className={cn('text-base', destructive ? 'text-danger font-medium' : 'text-foreground')}>{title}</span>
        {description && <span className="text-xs leading-4 text-muted">{description}</span>}
      </span>
      {value && <span className="text-sm text-subtle">{value}</span>}
      {accessory}
      {chevron && <ChevronRight size={18} className="shrink-0 text-subtle" aria-hidden />}
    </>
  )

  const classes = cn(
    'w-full flex items-center gap-3 px-4 py-3.5 min-h-14 text-left',
    interactive && 'transition-colors hover:bg-surface-2 focus-ring focus-visible:-outline-offset-2',
    disabled && 'opacity-50',
  )

  if (to && !disabled) {
    return <Link to={to} className={classes}>{content}</Link>
  }
  if (onClick) {
    return <button type="button" onClick={onClick} disabled={disabled} className={classes}>{content}</button>
  }
  return <div className={classes}>{content}</div>
}

type SwitchRowProps = Omit<RowProps, 'onClick' | 'to' | 'accessory' | 'value'> & {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function SwitchRow({ checked, onCheckedChange, disabled, ...props }: SwitchRowProps) {
  return (
    <ListRow
      {...props}
      disabled={disabled}
      showChevron={false}
      onClick={() => onCheckedChange(!checked)}
      accessory={<Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} tabIndex={-1} />}
    />
  )
}

export function Switch({ checked, onCheckedChange, disabled, label, tabIndex }: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  tabIndex?: number
}) {
  return (
    <span
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled || undefined}
      tabIndex={tabIndex ?? (disabled ? -1 : 0)}
      onClick={event => {
        // Dentro de uma SwitchRow o clique já é tratado pela linha
        event.stopPropagation()
        if (!disabled) onCheckedChange(!checked)
      }}
      onKeyDown={event => {
        if (disabled || (event.key !== ' ' && event.key !== 'Enter')) return
        event.preventDefault()
        onCheckedChange(!checked)
      }}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors focus-ring',
        checked ? 'bg-primary' : 'bg-surface-3',
        disabled ? 'opacity-50' : 'cursor-pointer',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 size-6 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </span>
  )
}
