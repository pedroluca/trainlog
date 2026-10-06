import { Copy, Share2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Sheet } from '../../components/ui/sheet'
import { useToast } from '../../contexts/toast-context'
import { buildShareCode } from '../../data/training'
import { trackWorkoutShared } from '../../utils/analytics'

type Props = {
  workout: { id: string; musculo: string; usuarioID: string }
  onClose: () => void
}

export function ShareWorkoutSheet({ workout, onClose }: Props) {
  const toast = useToast()
  // O código leva o dono do treino (que pode ser um aluno), não quem está compartilhando
  const code = buildShareCode(workout.id, workout.usuarioID)
  const canShare = typeof navigator.share === 'function'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success('Código copiado')
      trackWorkoutShared()
    } catch {
      toast.error('Não foi possível copiar. Selecione o código e copie manualmente.')
    }
  }

  const share = () => {
    trackWorkoutShared()
    navigator.share({ text: `Treino "${workout.musculo}" no Tractus. Use o código ao adicionar um treino: ${code}` }).catch(() => {})
  }

  return (
    <Sheet
      open
      onClose={onClose}
      size="sm"
      title="Compartilhar treino"
      description="Quem receber o código pode adicionar uma cópia deste treino em “Novo treino > Código”."
    >
      <div className="flex flex-col gap-3 pb-2">
        <div className="rounded-2xl bg-surface-2 px-4 py-3.5">
          <span className="text-xs text-muted">{workout.musculo}</span>
          <p className="mt-0.5 select-all break-all text-sm font-semibold">{code}</p>
        </div>
        <div className="flex gap-2">
          <Button label="Copiar" icon={Copy} variant={canShare ? 'secondary' : 'primary'} className="flex-1" onClick={copy} />
          {canShare && <Button label="Enviar" icon={Share2} className="flex-1" onClick={share} />}
        </div>
      </div>
    </Sheet>
  )
}
