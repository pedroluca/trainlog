import { WEEK_DAYS } from '../../data/week-days'
import { cn } from '../../utils/cn'

const SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

type DayStripProps = {
  selected: number
  onSelect: (index: number) => void
  daysWithWorkout: Set<string>
}

/** Semana inteira visível: o dia de hoje tem contorno e os dias com treino têm um ponto */
export function DayStrip({ selected, onSelect, daysWithWorkout }: DayStripProps) {
  const today = new Date().getDay()

  return (
    <div role="tablist" aria-label="Dia da semana" className="flex gap-1.5 lg:gap-2">
      {WEEK_DAYS.map((day, index) => {
        const isSelected = index === selected
        const isToday = index === today
        const hasWorkout = daysWithWorkout.has(day.toLowerCase())
        return (
          <button
            key={day}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-label={`${day}${isToday ? ', hoje' : ''}${hasWorkout ? ', com treino' : ''}`}
            title={day}
            onClick={() => onSelect(index)}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 h-14 rounded-2xl border transition-colors focus-ring',
              isSelected
                ? 'bg-primary border-primary'
                : isToday
                  ? 'bg-surface border-primary/60 hover:bg-surface-2'
                  : 'bg-surface border-border hover:bg-surface-2',
            )}
          >
            <span className={cn('text-[13px] font-semibold', isSelected ? 'text-on-primary' : isToday ? 'text-primary' : 'text-foreground')}>
              {SHORT[index]}
            </span>
            <span className={cn('size-1.5 rounded-full', hasWorkout ? (isSelected ? 'bg-on-primary' : 'bg-primary') : 'bg-transparent')} />
          </button>
        )
      })}
    </div>
  )
}
