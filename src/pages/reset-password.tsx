import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { CircleCheck, TriangleAlert } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Callout, LoadingState } from '../components/ui/misc'
import { TextField } from '../components/ui/text-field'
import { auth } from '../firebaseConfig'

/** Página do link "redefinir senha" enviado pelo Firebase */
export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const oobCode = searchParams.get('oobCode')

  const [status, setStatus] = useState<'verifying' | 'ready' | 'invalid' | 'done'>(oobCode ? 'verifying' : 'invalid')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!oobCode) return
    verifyPasswordResetCode(auth, oobCode)
      .then(userEmail => {
        setEmail(userEmail)
        setStatus('ready')
      })
      .catch(() => setStatus('invalid'))
  }, [oobCode])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (password.length < 6) return setError('A senha precisa ter pelo menos 6 caracteres.')
    if (password !== confirmation) return setError('As senhas não coincidem.')
    if (!oobCode) return
    setLoading(true)
    setError(null)
    try {
      await confirmPasswordReset(auth, oobCode, password)
      setStatus('done')
    } catch {
      setError('Não foi possível redefinir a senha. O link pode ter expirado; solicite um novo.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'verifying') return <LoadingState />

  if (status === 'invalid') {
    return (
      <div className="flex flex-col items-center gap-4 pt-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <TriangleAlert size={30} aria-hidden />
        </span>
        <h1 className="type-title">Link inválido</h1>
        <p className="text-sm leading-5 text-muted">Este link de recuperação é inválido ou já expirou. Solicite um novo na tela de login.</p>
        <Button label="Ir para o login" size="lg" fullWidth className="mt-4" onClick={() => navigate('/login')} />
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="flex flex-col items-center gap-4 pt-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CircleCheck size={30} aria-hidden />
        </span>
        <h1 className="type-title">Senha redefinida</h1>
        <p className="text-sm leading-5 text-muted">Agora é só entrar com a nova senha.</p>
        <Button label="Ir para o login" size="lg" fullWidth className="mt-4" onClick={() => navigate('/login')} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="type-display">Nova senha</h1>
        <p className="text-muted">Crie uma nova senha para <strong className="font-semibold text-foreground">{email}</strong>.</p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-5">
        {error && <Callout tone="danger">{error}</Callout>}
        <div className="flex flex-col gap-4">
          <TextField label="Nova senha" value={password} onChange={event => setPassword(event.target.value)} secureToggle autoComplete="new-password" hint="Mínimo de 6 caracteres" autoFocus />
          <TextField label="Confirmar nova senha" value={confirmation} onChange={event => setConfirmation(event.target.value)} secureToggle autoComplete="new-password" />
        </div>
        <Button type="submit" label="Redefinir senha" size="lg" loading={loading} />
      </form>
    </div>
  )
}
