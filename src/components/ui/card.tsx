import type { ButtonHTMLAttributes, HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-surface rounded-2xl border border-border', className)} {...props} />
}

export function PressableCard({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn('block w-full text-left bg-surface rounded-2xl border border-border transition-colors hover:bg-surface-2 focus-ring', className)}
      {...props}
    />
  )
}
