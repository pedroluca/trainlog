import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { useAppTabs } from './tabs'

const isTextInput = (element: EventTarget | null) =>
  element instanceof HTMLElement && (element.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName))

/** No celular, esconde a cápsula enquanto o teclado está aberto (ela subiria junto com ele) */
function useTypingOnTouch() {
  const [typing, setTyping] = useState(false)
  useEffect(() => {
    if (!window.matchMedia('(pointer: coarse)').matches) return
    const onFocusIn = (event: FocusEvent) => setTyping(isTextInput(event.target))
    const onFocusOut = () => setTyping(false)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])
  return typing
}

/**
 * Tab bar flutuante em forma de cápsula, com acabamento de vidro (mesmo desenho do app nativo):
 * fundo translúcido com blur, brilho no topo, borda clara e um indicador que desliza até a aba ativa.
 * Só aparece abaixo de 1024px; no desktop a navegação fica na barra lateral.
 */
export function FloatingTabBar() {
  const { tabs, activeIndex } = useAppTabs()
  const typing = useTypingOnTouch()

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        'lg:hidden fixed inset-x-0 bottom-0 z-30 flex justify-center px-5 pt-7 pb-[calc(env(safe-area-inset-bottom)_+_8px)] pointer-events-none',
        'transition-[opacity,translate] duration-200',
        typing && 'opacity-0 translate-y-full',
      )}
      style={{
        // Faixa acima da cápsula em que o conteúdo vai sumindo
        background: 'linear-gradient(to bottom, transparent, color-mix(in srgb, var(--color-background) 92%, transparent) 55%)',
      }}
    >
      <div
        className={cn(
          'pointer-events-auto relative w-full max-w-[440px] h-16 rounded-full border',
          'bg-surface/75 backdrop-blur-xl backdrop-saturate-150',
          'border-foreground/[0.07] dark:border-white/10',
          'shadow-[0_12px_32px_rgba(16,18,20,0.14),0_2px_6px_rgba(16,18,20,0.06)]',
          'dark:shadow-[0_12px_32px_rgba(0,0,0,0.55),0_2px_6px_rgba(0,0,0,0.35)]',
        )}
      >
        {/* Reflexo do vidro: mais claro em cima, sumindo até o meio */}
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-b from-white/75 to-transparent to-60% dark:from-white/10" />
        {/* Fio de luz na borda de cima */}
        <div aria-hidden className="pointer-events-none absolute top-0 inset-x-8 h-px bg-linear-to-r from-transparent via-white to-transparent dark:via-white/35" />

        <div className="relative flex h-full p-1.5">
          {activeIndex >= 0 && (
            <div
              aria-hidden
              className="absolute top-1.5 bottom-1.5 left-1.5 rounded-full border bg-primary/13 border-primary/20 dark:bg-primary/20 dark:border-primary/30 transition-transform duration-500 ease-[cubic-bezier(0.22,1.2,0.36,1)]"
              style={{ width: `calc((100% - 12px) / ${tabs.length})`, transform: `translateX(${activeIndex * 100}%)` }}
            />
          )}

          {tabs.map((tab, index) => {
            const active = index === activeIndex
            const Icon = tab.icon
            return (
              <Link
                key={tab.key}
                to={tab.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full focus-ring',
                  active ? 'text-primary' : 'text-muted',
                )}
              >
                <span className="relative">
                  <Icon size={22} strokeWidth={active ? 2.4 : 2} aria-hidden />
                  {!!tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-[5px] -right-[11px] min-w-[18px] h-[18px] px-1 rounded-full border-2 border-surface bg-danger text-white text-[10px] leading-[14px] font-bold text-center">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </span>
                <span className={cn('text-[11px] truncate', active ? 'font-semibold' : 'font-medium')}>{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
