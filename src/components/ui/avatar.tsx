import { useState } from 'react'
import { cn } from '../../utils/cn'

type AvatarProps = {
  name?: string
  src?: string | null
  size?: number
  /** Anel colorido para badges especiais (fundador, premium) */
  ring?: 'founder' | 'premium' | null
  className?: string
}

/** Foto do usuário com fallback para a inicial quando não há foto ou a URL quebrou */
export function Avatar({ name, src, size = 48, ring, className }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = !!src && failedSrc !== src
  const initial = name?.trim().charAt(0).toUpperCase() || '?'

  const ringColor = ring === 'founder' ? 'var(--color-founder)' : ring === 'premium' ? 'var(--color-premium)' : null
  const ringWidth = size >= 72 ? 3 : 2
  const outer = ringColor ? size + ringWidth * 2 + 4 : size

  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full', className)}
      style={{ width: outer, height: outer, border: ringColor ? `${ringWidth}px solid ${ringColor}` : undefined }}
    >
      <span
        className="flex items-center justify-center overflow-hidden rounded-full bg-primary text-on-primary font-bold"
        style={{ width: size, height: size, fontSize: size * 0.42 }}
      >
        {showImage ? (
          <img
            src={src}
            alt={name ? `Foto de ${name}` : 'Foto de perfil'}
            className="size-full object-cover"
            onError={() => setFailedSrc(src ?? null)}
          />
        ) : (
          <span aria-hidden>{initial}</span>
        )}
      </span>
    </span>
  )
}
