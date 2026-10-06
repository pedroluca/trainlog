import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import { createContext, use, useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { Portal } from '../components/ui/portal'

type ToastType = 'success' | 'error' | 'info'
type ToastState = { id: number; message: string; type: ToastType }

type ToastContextValue = {
  show: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const icons = { success: CircleCheck, error: CircleAlert, info: Info }
const iconColors = { success: 'text-success', error: 'text-danger', info: 'text-info' }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((message: string, type: ToastType = 'info') => {
    if (timer.current) clearTimeout(timer.current)
    setToast({ id: Date.now(), message, type })
    timer.current = setTimeout(() => setToast(null), type === 'error' ? 4000 : 2800)
  }, [])

  const value = useMemo<ToastContextValue>(() => ({
    show,
    success: message => show(message, 'success'),
    error: message => show(message, 'error'),
  }), [show])

  const Icon = toast ? icons[toast.type] : null

  return (
    <ToastContext value={value}>
      {children}
      {toast && Icon && (
        <Portal>
          <div className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),12px)] z-[60] flex justify-center px-4">
            <div
              key={toast.id}
              role="status"
              aria-live="polite"
              className="flex items-center gap-2.5 max-w-md bg-surface text-foreground border border-border rounded-2xl px-4 py-3 shadow-lg animate-toast-in"
            >
              <Icon size={18} className={iconColors[toast.type]} aria-hidden />
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          </div>
        </Portal>
      )}
    </ToastContext>
  )
}

export function useToast() {
  const context = use(ToastContext)
  if (!context) throw new Error('useToast precisa estar dentro de ToastProvider')
  return context
}
