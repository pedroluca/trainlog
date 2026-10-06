import { useSyncExternalStore } from 'react'

/** true enquanto a media query casar (ex.: '(min-width: 1024px)') */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    onChange => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Mesmo ponto de corte da barra lateral (lg do Tailwind) */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')
