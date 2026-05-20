import type { CSSProperties } from 'react'

interface SpinnerProps {
  size?: number
  thickness?: number
  color?: string
  className?: string
  style?: CSSProperties
  label?: string
}

export function Spinner({
  size = 24,
  thickness = 4,
  color = 'currentColor',
  className = '',
  style,
  label = 'Carregando'
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`inline-block animate-spin rounded-full border-solid ${className}`.trim()}
      style={{
        width: size,
        height: size,
        borderWidth: thickness,
        borderColor: color,
        borderTopColor: 'transparent',
        ...style
      }}
    />
  )
}