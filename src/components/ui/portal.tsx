import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Renderiza no fim do <body>, fora de containers com overflow/transform */
export function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body)
}
