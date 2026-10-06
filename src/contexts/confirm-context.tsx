import { CircleAlert, type LucideIcon } from 'lucide-react'
import { createContext, use, useCallback, useState, type ReactNode } from 'react'
import { Button } from '../components/ui/button'
import { Dialog } from '../components/ui/dialog'

type ConfirmTone = 'danger' | 'warning'

type ConfirmOptions = {
  title: string
  message: string
  confirmLabel: string
  icon?: LucideIcon
  tone?: ConfirmTone
  /** Se devolver uma Promise, o diálogo fica aberto com loading até ela terminar */
  onConfirm: () => void | Promise<unknown>
}

type ConfirmFn = (options: ConfirmOptions) => void

const ConfirmContext = createContext<ConfirmFn | null>(null)

/** Confirmações com o visual dos diálogos do app (no lugar do window.confirm) */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmOptions | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const confirm = useCallback<ConfirmFn>(options => {
    setLoading(false)
    setRequest(options)
    setOpen(true)
  }, [])

  const close = () => {
    if (!loading) setOpen(false)
  }

  const handleConfirm = async () => {
    if (!request) return
    const result = request.onConfirm()
    if (result instanceof Promise) {
      setLoading(true)
      await result.catch(() => {})
      setLoading(false)
    }
    setOpen(false)
  }

  const tone = request?.tone ?? 'danger'
  const toneColor = tone === 'danger' ? 'var(--color-danger)' : 'var(--color-warning)'
  const Icon = request?.icon ?? CircleAlert

  return (
    <ConfirmContext value={confirm}>
      {children}
      <Dialog open={open} onClose={close} label={request?.title}>
        {request && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div
              className="size-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `color-mix(in srgb, ${toneColor} 12%, transparent)`, color: toneColor }}
            >
              <Icon size={28} strokeWidth={2.2} aria-hidden />
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="text-xl font-semibold">{request.title}</h2>
              <p className="text-[15px] leading-[22px] text-muted">{request.message}</p>
            </div>

            <div className="flex gap-3 self-stretch mt-1">
              <Button label="Cancelar" variant="secondary" onClick={close} disabled={loading} className="flex-1" />
              <Button
                label={request.confirmLabel}
                variant={tone === 'danger' ? 'danger' : 'primary'}
                onClick={handleConfirm}
                loading={loading}
                autoFocus
                className="flex-1"
              />
            </div>
          </div>
        )}
      </Dialog>
    </ConfirmContext>
  )
}

export function useConfirm() {
  const context = use(ConfirmContext)
  if (!context) throw new Error('useConfirm precisa estar dentro de ConfirmProvider')
  return context
}
