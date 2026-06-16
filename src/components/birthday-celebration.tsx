import { useEffect, useState } from 'react'
import { Crown } from 'lucide-react'

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
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => setShow(true), 10)
      return () => clearTimeout(timeout)
    }

    setShow(false)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 animate-fade-in">
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1f2937] via-[#111827] to-[#0f172a] shadow-2xl transition-all duration-300 ${
          show ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(39,174,96,0.18),_transparent_30%)]" />
        <div className="absolute -left-8 top-10 h-24 w-24 rounded-full bg-rose-400/20 blur-2xl" />
        <div className="absolute -right-8 bottom-8 h-28 w-28 rounded-full bg-amber-400/20 blur-2xl" />

        <div className="relative p-6 md:p-8 text-center">
          <div className="mb-5 flex items-center justify-center gap-3 text-5xl">
            <span>🎉</span>
            <Crown size={36} className="text-amber-300" />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-300/90 mb-2">Hoje é o seu dia</p>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
            Feliz aniversário, {name}!
          </h2>
          <p className="mt-4 text-sm md:text-base text-white/80 leading-relaxed">
            Que seu ano novo pessoal venha com mais saúde, evolução e boas conquistas dentro e fora do treino.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2 text-left">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-200/80">Energia</p>
              <p className="mt-1 text-sm font-semibold text-white">Lá no alto</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-200/80">Saúde</p>
              <p className="mt-1 text-sm font-semibold text-white">Sempre em dia</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-200/80">Meta</p>
              <p className="mt-1 text-sm font-semibold text-white">Bater recordes</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-7 w-full rounded-2xl bg-[#27AE60] px-4 py-3.5 font-bold text-white shadow-lg shadow-[#27AE60]/30 transition-colors hover:bg-[#219150]"
          >
            Obrigado!
          </button>
        </div>
      </div>
    </div>
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