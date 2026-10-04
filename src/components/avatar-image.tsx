import { useState, type ReactNode } from 'react'

interface AvatarImageProps {
  src?: string | null
  alt: string
  className?: string
  fallback: ReactNode
}

// Renderiza a foto do usuário; se não houver URL ou a imagem quebrar, mostra o fallback
export function AvatarImage({ src, alt, className, fallback }: AvatarImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (!src || failedSrc === src) return <>{fallback}</>

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  )
}
