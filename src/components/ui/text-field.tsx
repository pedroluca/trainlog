import { Eye, EyeOff } from 'lucide-react'
import { useId, useState, type InputHTMLAttributes, type ReactNode, type Ref, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

type FieldProps = {
  label?: string
  hint?: string
  error?: string | null
  containerClassName?: string
}

const boxClasses = (error?: string | null) => cn(
  'flex items-center rounded-xl bg-surface-2 border transition-colors',
  error ? 'border-danger' : 'border-transparent focus-within:border-primary',
)

const controlClasses = 'flex-1 min-w-0 bg-transparent text-base text-foreground placeholder:text-subtle outline-none disabled:opacity-60'

/** Rótulo, caixa e texto de ajuda/erro em volta do controle */
function Field({ id, label, hint, error, containerClassName, children }: FieldProps & { id: string; children: ReactNode }) {
  const helpId = `${id}-help`
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && <label htmlFor={id} className="text-sm font-medium text-muted">{label}</label>}
      {children}
      {error ? (
        <p id={helpId} className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p id={helpId} className="text-xs text-subtle">{hint}</p>
      ) : null}
    </div>
  )
}

export type TextFieldProps = FieldProps & InputHTMLAttributes<HTMLInputElement> & {
  prefix?: string
  /** Botão de mostrar/ocultar senha */
  secureToggle?: boolean
  ref?: Ref<HTMLInputElement>
}

export function TextField({ label, hint, error, containerClassName, prefix, secureToggle, type, id, className, ...props }: TextFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const [hidden, setHidden] = useState(true)
  const inputType = secureToggle ? (hidden ? 'password' : 'text') : type

  return (
    <Field id={fieldId} label={label} hint={hint} error={error} containerClassName={containerClassName}>
      <div className={cn(boxClasses(error), 'h-12')}>
        {prefix && <span className="pl-4 text-subtle">{prefix}</span>}
        <input
          {...props}
          id={fieldId}
          type={inputType}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? `${fieldId}-help` : undefined}
          className={cn(controlClasses, 'h-full', prefix ? 'pl-1 pr-4' : 'px-4', className)}
        />
        {secureToggle && (
          <button
            type="button"
            aria-label={hidden ? 'Mostrar senha' : 'Ocultar senha'}
            title={hidden ? 'Mostrar senha' : 'Ocultar senha'}
            onClick={() => setHidden(value => !value)}
            className="h-full px-4 text-subtle hover:text-muted focus-ring rounded-r-xl"
          >
            {hidden ? <Eye size={20} aria-hidden /> : <EyeOff size={20} aria-hidden />}
          </button>
        )}
      </div>
    </Field>
  )
}

export type TextAreaProps = FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement> & {
  ref?: Ref<HTMLTextAreaElement>
}

export function TextArea({ label, hint, error, containerClassName, id, className, ...props }: TextAreaProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId

  return (
    <Field id={fieldId} label={label} hint={hint} error={error} containerClassName={containerClassName}>
      <div className={cn(boxClasses(error), 'items-start')}>
        <textarea
          {...props}
          id={fieldId}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? `${fieldId}-help` : undefined}
          className={cn(controlClasses, 'min-h-24 px-4 py-3 resize-y leading-6', className)}
        />
      </div>
    </Field>
  )
}
