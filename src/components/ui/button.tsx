import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'danger-soft'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-strong',
  secondary: 'bg-surface-2 text-foreground hover:bg-surface-3',
  outline: 'bg-transparent border border-border text-foreground hover:bg-surface-2',
  ghost: 'bg-transparent text-primary hover:bg-primary/10',
  danger: 'bg-danger text-white hover:opacity-90',
  'danger-soft': 'bg-danger/10 text-danger hover:bg-danger/15',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 rounded-lg gap-1.5 text-sm',
  md: 'h-12 px-5 rounded-xl gap-2 text-base',
  lg: 'h-14 px-6 rounded-2xl gap-2.5 text-[17px]',
}

const iconSizes: Record<ButtonSize, number> = { sm: 16, md: 18, lg: 20 }

/** Classes do botão, para aplicar o mesmo visual em links (<Link className={buttonClasses()}>) */
export function buttonClasses({ variant = 'primary', size = 'md', fullWidth = false, className }: {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
} = {}) {
  return cn(
    'inline-flex items-center justify-center font-semibold whitespace-nowrap transition-colors focus-ring active:opacity-80',
    'disabled:opacity-50 disabled:pointer-events-none',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
    className,
  )
}

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  label: string
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  loading?: boolean
  fullWidth?: boolean
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  fullWidth = false,
  disabled,
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {loading ? (
        <span aria-hidden className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        Icon && <Icon size={iconSizes[size]} strokeWidth={2.2} aria-hidden />
      )}
      <span className="truncate">{label}</span>
    </button>
  )
}
