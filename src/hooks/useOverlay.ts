import { useEffect, useRef, useState } from 'react'

const EXIT_MS = 160

/**
 * Mantém o overlay montado durante a animação de saída.
 * `closing` fica true nesse intervalo, para o componente aplicar o fade-out.
 */
export function usePresence(open: boolean) {
  const [rendered, setRendered] = useState(open)
  // Ajuste durante o render (padrão do React para estado derivado): abre sem esperar um frame
  if (open && !rendered) setRendered(true)
  const closing = !open && rendered

  useEffect(() => {
    if (!closing) return
    const timer = setTimeout(() => setRendered(false), EXIT_MS)
    return () => clearTimeout(timer)
  }, [closing])

  return { mounted: open || rendered, closing }
}

let lockCount = 0
let previousOverflow = ''

/** Trava a rolagem da página enquanto algum overlay está aberto (suporta overlays empilhados) */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    if (lockCount === 0) {
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    lockCount += 1
    return () => {
      lockCount -= 1
      if (lockCount === 0) document.body.style.overflow = previousOverflow
    }
  }, [active])
}

// Só o overlay do topo responde ao Esc (ex.: confirmação aberta por cima de uma sheet)
const escapeStack: Array<{ current: (() => void) | undefined }> = []

function handleEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape' || escapeStack.length === 0) return
  event.preventDefault()
  escapeStack[escapeStack.length - 1].current?.()
}

export function useEscape(active: boolean, onEscape?: () => void) {
  const handler = useRef(onEscape)
  useEffect(() => {
    handler.current = onEscape
  })

  useEffect(() => {
    if (!active) return
    if (escapeStack.length === 0) window.addEventListener('keydown', handleEscape)
    escapeStack.push(handler)
    return () => {
      escapeStack.splice(escapeStack.indexOf(handler), 1)
      if (escapeStack.length === 0) window.removeEventListener('keydown', handleEscape)
    }
  }, [active])
}
