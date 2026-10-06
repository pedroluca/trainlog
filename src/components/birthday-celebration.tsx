import { Cake } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog } from './ui/dialog'

export type BirthdayBalloonMode = 'none' | 'compact' | 'burst'

export const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const isBirthdayToday = (birthDate: string, referenceDate = new Date()) => {
  const [year, month, day] = birthDate.split('-')

  if (!year || !month || !day) return false

  return (
    Number(month) === referenceDate.getMonth() + 1 &&
    Number(day) === referenceDate.getDate()
  )
}

export const getBirthdayCelebrationStorageKey = (userId: string, dateKey: string) =>
  `birthdayCelebration:${userId}:${dateKey}`

type BirthdayCelebrationModalProps = {
  isOpen: boolean
  onClose: () => void
  name: string
}

export function BirthdayCelebrationModal({ isOpen, onClose, name }: BirthdayCelebrationModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} animation="pop" label="Feliz aniversário">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-premium/12 text-premium">
          <Cake size={30} aria-hidden />
        </div>
        <h2 className="type-title">Feliz aniversário, {name.split(' ')[0]}!</h2>
        <p className="text-sm leading-5 text-muted">
          Que seu novo ano venha com mais saúde, evolução e boas conquistas dentro e fora do treino.
        </p>
        <Button label="Obrigado!" onClick={onClose} fullWidth className="mt-2" autoFocus />
      </div>
    </Dialog>
  )
}

export function BirthdayCelebrationBalloons({ mode }: { mode: BirthdayBalloonMode }) {
  if (mode === 'none') return null

  if (mode === 'burst') {
    return (
      <div className="fixed inset-0 pointer-events-none z-[65] overflow-hidden">
        <div className="absolute left-[6%] top-[14%] animate-bounce" style={{ animationDuration: '3s' }}>
          <div className="h-14 w-11 rounded-full bg-rose-400 shadow-xl shadow-rose-500/30 relative">
            <div className="absolute left-1/2 top-full h-10 w-px -translate-x-1/2 bg-rose-300" />
          </div>
        </div>
        <div className="absolute left-[16%] top-[28%] animate-bounce" style={{ animationDuration: '2.6s', animationDelay: '0.2s' }}>
          <div className="h-12 w-9 rounded-full bg-amber-400 shadow-xl shadow-amber-500/30 relative">
            <div className="absolute left-1/2 top-full h-9 w-px -translate-x-1/2 bg-amber-300" />
          </div>
        </div>
        <div className="absolute right-[12%] top-[18%] animate-bounce" style={{ animationDuration: '2.9s', animationDelay: '0.35s' }}>
          <div className="h-14 w-11 rounded-full bg-sky-400 shadow-xl shadow-sky-500/30 relative">
            <div className="absolute left-1/2 top-full h-10 w-px -translate-x-1/2 bg-sky-300" />
          </div>
        </div>
        <div className="absolute right-[8%] top-[38%] animate-bounce" style={{ animationDuration: '3.1s', animationDelay: '0.15s' }}>
          <div className="h-12 w-9 rounded-full bg-emerald-400 shadow-xl shadow-emerald-500/30 relative">
            <div className="absolute left-1/2 top-full h-9 w-px -translate-x-1/2 bg-emerald-300" />
          </div>
        </div>
        <div className="absolute left-[26%] bottom-[18%] animate-bounce" style={{ animationDuration: '2.7s', animationDelay: '0.4s' }}>
          <div className="h-12 w-10 rounded-full bg-fuchsia-400 shadow-xl shadow-fuchsia-500/30 relative">
            <div className="absolute left-1/2 top-full h-10 w-px -translate-x-1/2 bg-fuchsia-300" />
          </div>
        </div>
        <div className="absolute right-[24%] bottom-[16%] animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.05s' }}>
          <div className="h-12 w-10 rounded-full bg-yellow-400 shadow-xl shadow-yellow-500/30 relative">
            <div className="absolute left-1/2 top-full h-10 w-px -translate-x-1/2 bg-yellow-300" />
          </div>
        </div>
      </div>
    )
  }

  return null
}