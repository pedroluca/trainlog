import { Check, ChevronDown, Search } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { cn } from '../../utils/cn'
import { Sheet } from './sheet'

export type SelectOption<T extends string> = { value: T; label: string; description?: string }

type SelectFieldProps<T extends string> = {
  label?: string
  value: T | null
  options: SelectOption<T>[]
  onChange: (value: T) => void
  placeholder?: string
  sheetTitle?: string
}

/** Campo que abre a lista de opções numa sheet (com busca quando a lista é longa) */
export function SelectField<T extends string>({ label, value, options, onChange, placeholder = 'Selecione', sheetTitle }: SelectFieldProps<T>) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const selected = options.find(option => option.value === value)
  const searchable = options.length > 8

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return term ? options.filter(option => option.label.toLowerCase().includes(term)) : options
  }, [options, search])

  const close = () => {
    setOpen(false)
    setSearch('')
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={id} className="text-sm font-medium text-muted">{label}</label>}
      <button
        id={id}
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 items-center gap-2 rounded-xl bg-surface-2 px-4 text-left transition-colors hover:bg-surface-3 focus-ring"
      >
        <span className={cn('flex-1 truncate text-base', selected ? 'text-foreground' : 'text-subtle')}>{selected?.label ?? placeholder}</span>
        <ChevronDown size={18} className="shrink-0 text-subtle" aria-hidden />
      </button>

      <Sheet open={open} onClose={close} title={sheetTitle ?? label} size="sm" contentClassName="px-3">
        {searchable && (
          <label className="mx-2 mb-2 flex h-11 items-center gap-2 rounded-xl border border-transparent bg-surface-2 px-3.5 focus-within:border-primary">
            <Search size={16} className="shrink-0 text-subtle" aria-hidden />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Buscar"
              aria-label="Buscar opção"
              autoFocus
              className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-subtle"
            />
          </label>
        )}
        <div role="listbox" className="flex flex-col pb-2">
          {filtered.map(option => {
            const isSelected = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value)
                  close()
                }}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-surface-2 focus-ring"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={cn('truncate text-base', isSelected && 'font-semibold text-primary')}>{option.label}</span>
                  {option.description && <span className="text-xs text-muted">{option.description}</span>}
                </span>
                {isSelected && <Check size={18} className="shrink-0 text-primary" aria-hidden />}
              </button>
            )
          })}
          {filtered.length === 0 && <p className="py-6 text-center text-sm text-muted">Nada encontrado.</p>}
        </div>
      </Sheet>
    </div>
  )
}
