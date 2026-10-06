import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button, buttonClasses } from '../components/ui/button'
import { IconButton } from '../components/ui/icon-button'
import { Callout } from '../components/ui/misc'
import { TextField } from '../components/ui/text-field'
import { auth, db } from '../firebaseConfig'
import { trackLogin, trackPageView } from '../utils/analytics'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  useEffect(() => {
    trackPageView('login')
  }, [])

  if (localStorage.getItem('usuarioId')) return <Navigate to="/train" replace />

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError('Informe seu email e sua senha.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
      const userDoc = await getDoc(doc(db, 'usuarios', credential.user.uid))

      if (!userDoc.exists()) {
        await auth.signOut()
        setError('Conta não encontrada no sistema. Entre em contato com o suporte.')
        return
      }
      // Sem o campo isActive a conta é considerada ativa (contas antigas)
      if (userDoc.data().isActive === false) {
        await auth.signOut()
        setError('Sua conta está inativa. Entre em contato com o suporte para ativá-la.')
        return
      }

      localStorage.setItem('usuarioId', credential.user.uid)
      trackLogin('email')
      navigate('/train')
    } catch {
      setError('Email ou senha incorretos. Confira e tente de novo.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (event: FormEvent) => {
    event.preventDefault()
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Digite um email válido.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setResetSent(true)
    } catch {
      setError('Não foi possível enviar o email. Confira se o endereço está correto.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (next: 'login' | 'forgot') => {
    setMode(next)
    setError(null)
    setResetSent(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <IconButton
        icon={ArrowLeft}
        label="Voltar"
        className="-ml-2"
        onClick={() => (mode === 'forgot' ? switchMode('login') : navigate('/'))}
      />

      {mode === 'forgot' ? (
        <>
          <div className="flex flex-col gap-1.5">
            <h1 className="type-display">Recuperar senha</h1>
            <p className="text-muted">Enviaremos um link para você criar uma nova senha.</p>
          </div>
          {resetSent ? (
            <div className="flex flex-col gap-4">
              <Callout tone="success" icon={MailCheck} title="Email enviado">
                Confira sua caixa de entrada (e o spam) e siga o link para redefinir a senha.
              </Callout>
              <Button label="Voltar para o login" size="lg" onClick={() => switchMode('login')} />
            </div>
          ) : (
            <form onSubmit={handleForgot} className="flex flex-col gap-4">
              {error && <Callout tone="danger">{error}</Callout>}
              <TextField label="Email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="voce@email.com" autoComplete="email" autoFocus />
              <Button type="submit" label="Enviar link" size="lg" loading={loading} />
            </form>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <h1 className="type-display">Entrar</h1>
            <p className="text-muted">Bom te ver de volta. Faça login para continuar seus treinos.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            {error && <Callout tone="danger">{error}</Callout>}
            <div className="flex flex-col gap-4">
              <TextField label="Email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="voce@email.com" autoComplete="email" />
              <TextField label="Senha" value={password} onChange={event => setPassword(event.target.value)} placeholder="Sua senha" secureToggle autoComplete="current-password" />
              <Button label="Esqueci minha senha" variant="ghost" size="sm" className="-mr-2 self-end" onClick={() => switchMode('forgot')} />
            </div>
            <div className="flex flex-col gap-3">
              <Button type="submit" label="Entrar" size="lg" loading={loading} />
              <Link to="/cadastro" className={buttonClasses({ variant: 'outline', size: 'lg' })}>Ainda não tenho conta</Link>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
