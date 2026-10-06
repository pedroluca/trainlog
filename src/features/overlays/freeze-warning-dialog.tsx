import { Snowflake, TriangleAlert } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import type { FreezeWarning } from '../../data/streak-utils'

/** Aviso de freeze consumido ou streak zerada (disparado pela manutenção diária da streak) */
export function FreezeWarningDialog({ warning, onClose }: { warning: FreezeWarning | null; onClose: () => void }) {
  const Icon = warning?.streakBroken ? TriangleAlert : Snowflake
  return (
    <Dialog open={!!warning} onClose={onClose} label={warning?.streakBroken ? 'Streak zerada' : 'Último freeze usado'}>
      {warning && (
        <div className="flex flex-col gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-warning/12 text-warning">
            <Icon size={24} aria-hidden />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="type-heading">{warning.streakBroken ? 'Sua streak foi zerada' : 'Você usou o último freeze'}</h2>
            <p className="text-sm leading-5 text-muted">{warning.message}</p>
            <p className="mt-1 text-sm font-medium leading-5">
              {warning.streakBroken ? 'Treine esta semana para começar uma nova sequência.' : 'Se passar mais uma semana sem treino, sua streak será zerada.'}
            </p>
          </div>
          <Button label="Entendi" onClick={onClose} autoFocus />
        </div>
      )}
    </Dialog>
  )
}
