import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ArrowLeft, Check } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button, buttonClasses } from '../components/ui/button'
import { IconButton } from '../components/ui/icon-button'
import { ListSection, SwitchRow } from '../components/ui/list'
import { Callout } from '../components/ui/misc'
import { TextField } from '../components/ui/text-field'
import { auth, db } from '../firebaseConfig'
import { notifyAdmins } from '../utils/admin-notifications'
import { trackSignUp } from '../utils/analytics'
import { cn } from '../utils/cn'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Máscara de telefone brasileiro: (99) 99999-9999 */
function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function Cadastro() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailInUse, setEmailInUse] = useState(false)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isTrainer, setIsTrainer] = useState(false)
  const [cref, setCref] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (localStorage.getItem('usuarioId') && !loading) return <Navigate to="/train" replace />

  const checkEmail = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!EMAIL_REGEX.test(trimmed)) return
    try {
      const snapshot = await getDoc(doc(db, 'emailsRegistrados', trimmed))
      setEmailInUse(snapshot.exists())
    } catch {
      // Falha de rede na checagem: o próprio cadastro avisa se o email já existir
    }
  }

  const validate = (): string | null => {
    if (!name.trim()) return 'Digite seu nome.'
    if (!EMAIL_REGEX.test(email.trim())) return 'Digite um email válido.'
    if (emailInUse) return 'Este email já está cadastrado. Faça login ou use outro email.'
    if (phone.replace(/\D/g, '').length !== 11) return 'Digite um telefone válido com DDD.'
    if (password.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.'
    if (password !== confirmPassword) return 'As senhas não coincidem.'
    if (!acceptedTerms) return 'Você precisa aceitar a Política de Privacidade para continuar.'
    return null
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)
    const normalizedEmail = email.trim().toLowerCase()
    try {
      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
      const uid = credential.user.uid
      const now = new Date().toISOString()

      await setDoc(doc(db, 'usuarios', uid), {
        nome: name.trim(),
        email: normalizedEmail,
        telefone: phone,
        isTrainer,
        cref: isTrainer ? cref.trim().toUpperCase() : '',
        isPremium: false,
        isAdmin: false,
        isActive: true,
        criadoEm: now,
        currentStreak: 0,
        longestStreak: 0,
        lastStreakWeek: '',
        totalWorkouts: 0,
        streakVersion: 2,
        scheduledDays: [],
        badges: isTrainer ? ['trainer'] : [],
        hasCompletedOnboarding: false,
      })
      // Consulta pública para avisar no cadastro quando o email já existe
      await setDoc(doc(db, 'emailsRegistrados', normalizedEmail), { uid, criadoEm: now })

      notifyAdmins('Novo usuário registrado!', `Nome: ${name.trim()} | Email: ${normalizedEmail}`, '/admin/dashboard/users')
        .catch(notifyError => console.error('Erro ao avisar os admins:', notifyError))
      trackSignUp('email')

      // A conta criada já fica logada: segue direto para o app (o onboarding abre na primeira vez)
      localStorage.setItem('usuarioId', uid)
      navigate('/train', { replace: true })
    } catch (err) {
      const code = (err as { code?: string }).code
      setError(
        code === 'auth/email-already-in-use' ? 'Este email já está cadastrado. Faça login ou use outro email.'
          : code === 'auth/invalid-email' ? 'Email inválido.'
            : code === 'auth/weak-password' ? 'Senha muito fraca. Use pelo menos 6 caracteres.'
              : 'Não foi possível criar a conta. Tente novamente.',
      )
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <IconButton icon={ArrowLeft} label="Voltar" className="-ml-2" onClick={() => navigate('/')} />

      <div className="flex flex-col gap-1.5">
        <h1 className="type-display">Criar conta</h1>
        <p className="text-muted">Leva menos de um minuto e é grátis.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <TextField label="Nome completo" value={name} onChange={event => setName(event.target.value)} placeholder="Como você quer ser chamado" autoComplete="name" />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={event => {
              setEmail(event.target.value)
              setEmailInUse(false)
            }}
            onBlur={checkEmail}
            placeholder="voce@email.com"
            autoComplete="email"
            error={emailInUse ? 'Este email já está cadastrado.' : null}
          />
          <TextField label="Telefone (WhatsApp)" type="tel" value={phone} onChange={event => setPhone(formatPhone(event.target.value))} placeholder="(11) 91234-5678" autoComplete="tel" />
          <TextField label="Senha" value={password} onChange={event => setPassword(event.target.value)} placeholder="Mínimo de 6 caracteres" secureToggle autoComplete="new-password" />
          <TextField label="Confirmar senha" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Repita a senha" secureToggle autoComplete="new-password" />
        </div>

        <ListSection footer="Treinadores podem montar e acompanhar os treinos dos alunos vinculados.">
          <SwitchRow title="Sou personal trainer" checked={isTrainer} onCheckedChange={setIsTrainer} />
        </ListSection>
        {isTrainer && (
          <TextField label="CREF (opcional)" value={cref} onChange={event => setCref(event.target.value.toUpperCase())} placeholder="Ex.: 123456-G/SP" maxLength={30} />
        )}

        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={acceptedTerms} onChange={event => setAcceptedTerms(event.target.checked)} className="peer sr-only" />
          <span
            aria-hidden
            className={cn(
              'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary',
              acceptedTerms ? 'border-primary bg-primary text-on-primary' : 'border-border',
            )}
          >
            {acceptedTerms && <Check size={16} strokeWidth={3} />}
          </span>
          <span className="flex-1 text-sm leading-5 text-muted">
            Li e aceito a{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Política de Privacidade</a>
            {' '}do Tractus.
          </span>
        </label>

        {error && <Callout tone="danger">{error}</Callout>}

        <div className="flex flex-col gap-3">
          <Button type="submit" label="Criar conta" size="lg" loading={loading} />
          <Link to="/login" className={buttonClasses({ variant: 'outline', size: 'lg' })}>Já tenho conta</Link>
        </div>
      </form>
    </div>
  )
}
