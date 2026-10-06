import { extendTailwindMerge } from 'tailwind-merge'

// Ensina ao tailwind-merge as utilities próprias (index.css), para não confundirem com cores de texto
const twMerge = extendTailwindMerge<'typography'>({
  extend: {
    classGroups: {
      typography: [{ type: ['display', 'title', 'heading', 'overline'] }],
    },
  },
})

type ClassValue = string | false | null | undefined

/** Junta classes resolvendo conflitos (ex.: "text-base" + "text-sm" fica só "text-sm") */
export function cn(...classes: ClassValue[]): string {
  return twMerge(classes.filter(Boolean).join(' '))
}
