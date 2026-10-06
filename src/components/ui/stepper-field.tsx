import { Minus, Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { cn } from '../../utils/cn'

type StepperFieldProps = {
  label?: string
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
  /** Casas decimais aceitas (0 = só inteiros) */
  decimals?: number
  suffix?: string
  compact?: boolean
  className?: string
}

const format = (value: number, decimals: number) =>
  decimals > 0 ? String(Number(value.toFixed(decimals))).replace('.', ',') : String(Math.round(value))

/** Campo numérico com botões − e +, aceitando digitação com vírgula ou ponto */
export function StepperField({ label, value, onChange, step = 1, min = 0, max = 9999, decimals = 0, suffix, compact = false, className }: StepperFieldProps) {
  const id = useId()
  // Rascunho só existe enquanto o campo está em foco; fora dele mostra sempre o valor real
  const [draft, setDraft] = useState<string | null>(null)
  const text = draft ?? format(value, decimals)

  const clamp = (next: number) => Math.min(max, Math.max(min, Number(next.toFixed(decimals))))
  const nudge = (direction: 1 | -1) => onChange(clamp(value + direction * step))
  const commit = (raw: string) => {
    const parsed = Number(raw.replace(',', '.'))
    if (raw.trim() !== '' && !Number.isNaN(parsed)) onChange(clamp(parsed))
  }

  const buttonClass = cn(
    'flex shrink-0 items-center justify-center rounded-xl bg-surface-2 text-foreground transition-colors hover:bg-surface-3 focus-ring disabled:opacity-40 disabled:pointer-events-none',
    compact ? 'size-10' : 'size-12',
  )

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      {label && <label htmlFor={id} className="text-sm font-medium text-muted">{label}</label>}
      <div className="flex items-center gap-2">
        <button type="button" aria-label={`Diminuir ${label ?? ''}`} onClick={() => nudge(-1)} disabled={value <= min} className={buttonClass}>
          <Minus size={18} aria-hidden />
        </button>
        <div className={cn('flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl border border-transparent bg-surface-2 px-2 focus-within:border-primary', compact ? 'h-10' : 'h-12')}>
          <input
            id={id}
            value={text}
            inputMode={decimals > 0 ? 'decimal' : 'numeric'}
            onChange={event => setDraft(event.target.value)}
            onFocus={event => {
              setDraft(format(value, decimals))
              event.target.select()
            }}
            onBlur={() => {
              commit(text)
              setDraft(null)
            }}
            onKeyDown={event => {
              if (event.key === 'Enter') commit(text)
              if (event.key === 'ArrowUp') {
                event.preventDefault()
                nudge(1)
              }
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                nudge(-1)
              }
            }}
            size={1}
            className="w-full min-w-0 max-w-16 bg-transparent text-center text-base font-semibold text-foreground outline-none"
          />
          {suffix && <span className="shrink-0 text-sm text-subtle">{suffix}</span>}
        </div>
        <button type="button" aria-label={`Aumentar ${label ?? ''}`} onClick={() => nudge(1)} disabled={value >= max} className={buttonClass}>
          <Plus size={18} aria-hidden />
        </button>
      </div>
    </div>
  )
}
