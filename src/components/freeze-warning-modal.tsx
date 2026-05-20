import { AlertTriangle, Snowflake } from 'lucide-react'
import type { FreezeWarning } from '../data/streak-utils'

type FreezeWarningModalProps = {
  isOpen: boolean
  warning: FreezeWarning | null
  onClose: () => void
}

export function FreezeWarningModal({ isOpen, warning, onClose }: FreezeWarningModalProps) {
  if (!isOpen || !warning) return null

  const title = warning.streakBroken ? 'Sua streak foi zerada' : 'Você usou o último freeze'

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/65 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-amber-200/60 dark:border-amber-700/30 bg-white dark:bg-[#1e1e1e] shadow-2xl shadow-black/30 p-6 md:p-7"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            {warning.streakBroken ? <AlertTriangle size={28} /> : <Snowflake size={28} />}
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              {warning.message}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-700/30 px-4 py-3">
          <p className="text-sm text-amber-800 dark:text-amber-200 font-semibold">
            {warning.streakBroken
              ? 'Próxima falta: sua streak já foi reiniciada.'
              : 'Próxima falta: sua streak será zerada.'}
          </p>
        </div>

        <button
          onClick={onClose}
          className="cursor-pointer mt-6 w-full rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 transition-colors shadow-lg shadow-amber-600/20"
        >
          Entendi
        </button>
      </div>
    </div>
  )
}