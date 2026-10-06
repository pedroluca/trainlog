import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Callout } from '../components/ui/misc'
import { Page, StackHeader } from '../components/ui/page'
import { TextField } from '../components/ui/text-field'
import { useToast } from '../contexts/toast-context'
import { auth } from '../firebaseConfig'

export function SettingsPassword() {
  const navigate = useNavigate()
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!current || !next || !confirmation) return setError('Preencha todos os campos.')
    if (next.length < 6) return setError('A nova senha precisa ter pelo menos 6 caracteres.')
    if (next !== confirmation) return setError('As senhas novas não coincidem.')
    if (next === current) return setError('A nova senha precisa ser diferente da atual.')

    const user = auth.currentUser
    if (!user?.email) return setError('Sessão expirada. Entre novamente.')

    setLoading(true)
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, current))
      await updatePassword(user, next)
      toast.success('Senha alterada')
      navigate(-1)
    } catch (err) {
      const code = (err as { code?: string }).code
      setError(
        code === 'auth/wrong-password' || code === 'auth/invalid-credential' ? 'A senha atual está incorreta.'
          : code === 'auth/too-many-requests' ? 'Muitas tentativas. Tente novamente mais tarde.'
            : 'Não foi possível alterar a senha. Tente novamente.',
      )
      setLoading(false)
    }
  }

  return (
    <>
      <StackHeader title="Alterar senha" backTo="/profile/settings" />
      <Page className="pt-4">
        <form onSubmit={submit} className="flex flex-col gap-5">
          {error && <Callout tone="danger">{error}</Callout>}
          <div className="flex flex-col gap-4">
            <TextField label="Senha atual" value={current} onChange={event => setCurrent(event.target.value)} secureToggle autoComplete="current-password" />
            <TextField label="Nova senha" value={next} onChange={event => setNext(event.target.value)} secureToggle autoComplete="new-password" hint="Mínimo de 6 caracteres" />
            <TextField label="Confirmar nova senha" value={confirmation} onChange={event => setConfirmation(event.target.value)} secureToggle autoComplete="new-password" />
          </div>
          <Button type="submit" label="Alterar senha" size="lg" loading={loading} />
        </form>
      </Page>
    </>
  )
}
