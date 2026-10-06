import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

type Variant = 'ghost' | 'surface' | 'primary' | 'soft'

const variantClasses: Record<Variant, string> = {
  ghost: 'bg-transparent text-foreground hover:bg-surface-2',
  surface: 'bg-surface-2 text-foreground hover:bg-surface-3',
  primary: 'bg-primary text-on-primary hover:bg-primary-strong',
  soft: 'bg-primary/10 text-primary hover:bg-primary/20',
}

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: LucideIcon
  /** Vira o aria-label e a dica ao passar o mouse */
  label: string
  variant?: Variant
  size?: number
  iconSize?: number
  badge?: number
}

export function IconButton({
  icon: Icon,
  label,
  variant = 'ghost',
  size = 40,
  iconSize = 20,
  badge,
  type = 'button',
  className,
  style,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      style={{ width: size, height: size, ...style }}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full transition-colors focus-ring active:opacity-80',
        'disabled:opacity-40 disabled:pointer-events-none',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      <Icon size={iconSize} strokeWidth={2} aria-hidden />
      {!!badge && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] leading-[18px] font-bold text-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}
