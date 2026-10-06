import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/button'
import { ListSection, SwitchRow } from '../../components/ui/list'
import { Callout } from '../../components/ui/misc'
import { Sheet } from '../../components/ui/sheet'
import { TextArea, TextField } from '../../components/ui/text-field'
import { useToast } from '../../contexts/toast-context'
import { saveProfile, UsernameTakenError } from '../../data/profile'
import type { UserProfile } from '../../data/user-profile'
import { getLocalDateKey } from '../../utils/format'

const BIO_LIMIT = 160

/** Montado só enquanto aberto, então o formulário sempre começa do perfil salvo */
export function EditProfileSheet({ profile, onClose }: { profile: UserProfile; onClose: () => void }) {
  const toast = useToast()
  const [nome, setNome] = useState(profile.nome ?? '')
  const [username, setUsername] = useState(profile.username ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [birthDate, setBirthDate] = useState(profile.dataNascimento ?? '')
  const [instagram, setInstagram] = useState(profile.instagram ?? '')
  const [isTrainer, setIsTrainer] = useState(!!profile.isTrainer)
  const [cref, setCref] = useState(profile.cref ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const save = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!nome.trim()) {
      setError('O nome não pode ficar vazio.')
      return
    }
    if (username && !/^[a-zA-Z0-9._]{3,30}$/.test(username.replace(/^@/, ''))) {
      setError('O username deve ter de 3 a 30 caracteres: letras, números, ponto ou _.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await saveProfile(profile, { nome, username, bio, dataNascimento: birthDate, instagram, isTrainer, cref })
      toast.success('Perfil atualizado')
      onClose()
    } catch (err) {
      setError(err instanceof UsernameTakenError ? err.message : 'Não foi possível salvar. Verifique sua conexão.')
      setSaving(false)
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Editar perfil"
      footer={(
        <div className="flex gap-2">
          <Button label="Cancelar" variant="secondary" className="flex-1" onClick={onClose} disabled={saving} />
          <Button label="Salvar" className="flex-1" loading={saving} onClick={() => save()} />
        </div>
      )}
    >
      <form onSubmit={save} className="flex flex-col gap-5 pb-2">
        {error && <Callout tone="danger">{error}</Callout>}

        <TextField label="Nome" value={nome} onChange={event => setNome(event.target.value)} placeholder="Seu nome" autoComplete="name" maxLength={80} />
        <TextField
          label="Username"
          value={username}
          onChange={event => setUsername(event.target.value.replace(/^@/, '').replace(/\s/g, ''))}
          prefix="@"
          placeholder="seu_username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          hint="Seus amigos te encontram por ele."
          maxLength={30}
        />
        <div className="flex flex-col gap-1.5">
          <TextArea label="Bio" value={bio} onChange={event => setBio(event.target.value)} placeholder="Conte um pouco sobre você e seus objetivos" maxLength={BIO_LIMIT} rows={3} />
          <span className="text-right text-xs text-subtle">{bio.length}/{BIO_LIMIT}</span>
        </div>
        <TextField label="Data de nascimento" type="date" value={birthDate} onChange={event => setBirthDate(event.target.value)} min="1920-01-01" max={getLocalDateKey()} />
        <TextField
          label="Instagram"
          value={instagram}
          onChange={event => setInstagram(event.target.value.replace(/^@/, '').replace(/\s/g, ''))}
          prefix="@"
          placeholder="seu_instagram"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />

        <ListSection footer="Treinadores podem montar e acompanhar os treinos de alunos vinculados.">
          <SwitchRow title="Perfil de treinador" checked={isTrainer} onCheckedChange={setIsTrainer} />
        </ListSection>
        {isTrainer && (
          <TextField label="CREF (opcional)" value={cref} onChange={event => setCref(event.target.value.toUpperCase())} placeholder="Ex.: 123456-G/SP" maxLength={30} />
        )}
        {/* Enter no formulário salva */}
        <button type="submit" hidden />
      </form>
    </Sheet>
  )
}
