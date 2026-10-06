import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { Check, CircleCheck, ImagePlus, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { ListRow, ListSection } from '../components/ui/list'
import { Callout } from '../components/ui/misc'
import { Page, StackHeader } from '../components/ui/page'
import { TextArea, TextField } from '../components/ui/text-field'
import { useCurrentUser } from '../contexts/current-user-context'
import { db } from '../firebaseConfig'
import { notifyAdmins } from '../utils/admin-notifications'

type ReportType = 'Bug' | 'Sugestão' | 'Erro' | 'Outro'

const TYPES: { value: ReportType; label: string; description: string }[] = [
  { value: 'Bug', label: 'Reportar um bug', description: 'Algo não funciona como deveria' },
  { value: 'Sugestão', label: 'Dar uma sugestão', description: 'Uma ideia para melhorar o app' },
  { value: 'Erro', label: 'Erro no aplicativo', description: 'Uma mensagem de erro ou travamento' },
  { value: 'Outro', label: 'Outro assunto', description: 'Dúvidas e qualquer outra coisa' },
]

/** Mesmo servidor do upload de foto de perfil, em outro script */
async function uploadReportImage(file: File, userId: string): Promise<string | null> {
  const baseUrl = import.meta.env.VITE_API_UPLOAD_URL as string | undefined
  if (!baseUrl) return null
  const formData = new FormData()
  formData.append('image', file)
  formData.append('userId', userId)
  const response = await fetch(baseUrl.replace('upload-profile-image.php', 'upload-bug-report-image.php'), { method: 'POST', body: formData })
  if (!response.ok) throw new Error('Falha no upload da imagem')
  const data = await response.json()
  if (!data.success) throw new Error(data.message || 'Falha no upload da imagem')
  return data.imageUrl as string
}

export function SettingsSupport() {
  const profile = useCurrentUser()
  const navigate = useNavigate()
  const fileInput = useRef<HTMLInputElement>(null)
  const [type, setType] = useState<ReportType>('Bug')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  // Libera a URL temporária da prévia quando a imagem muda ou a tela fecha
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  const attach = (file: File | undefined) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5 MB.')
      return
    }
    setError(null)
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!profile) return
    if (!title.trim() || !message.trim()) {
      setError('Preencha o título e a mensagem.')
      return
    }
    setSending(true)
    setError(null)
    try {
      const imagemUrl = image ? await uploadReportImage(image, profile.id) : null
      await addDoc(collection(db, 'bug_reports'), {
        usuarioID: profile.id,
        nome: profile.nome || 'Desconhecido',
        email: profile.email || 'Desconhecido',
        username: profile.username || 'Desconhecido',
        tipo: type,
        titulo: title.trim(),
        mensagem: message.trim(),
        imagemUrl,
        dataCriacao: serverTimestamp(),
        status: 'pendente',
      })
      notifyAdmins(`Novo(a) ${type} reportado!`, `${title.trim()} - Enviado por ${profile.nome || 'Desconhecido'}`, '/admin/dashboard/bugs')
        .catch(notifyError => console.error('Erro ao avisar os admins:', notifyError))
      setSent(true)
    } catch (err) {
      console.error('Erro ao enviar relato:', err)
      setError('Não foi possível enviar seu relato. Verifique a conexão e tente de novo.')
      setSending(false)
    }
  }

  if (sent) {
    return (
      <>
        <StackHeader title="Ajuda e suporte" backTo="/profile/settings" />
        <Page className="items-center gap-4 pt-10 text-center">
          <CircleCheck size={56} className="text-primary" aria-hidden />
          <h2 className="type-title">Relato enviado</h2>
          <p className="px-6 text-sm leading-5 text-muted">Obrigado por ajudar a melhorar o Tractus. Vamos analisar em breve.</p>
          <Button label="Voltar" onClick={() => navigate(-1)} className="mt-4 w-full max-w-sm" />
        </Page>
      </>
    )
  }

  return (
    <>
      <StackHeader title="Ajuda e suporte" backTo="/profile/settings" />
      <Page className="pt-4">
        <form onSubmit={submit} className="flex flex-col gap-5">
          {error && <Callout tone="danger">{error}</Callout>}

          <ListSection title="Tipo">
            {TYPES.map(option => (
              <ListRow
                key={option.value}
                title={option.label}
                description={option.description}
                onClick={() => setType(option.value)}
                accessory={type === option.value ? <Check size={20} className="text-primary" aria-label="Selecionado" /> : <span className="size-5" />}
              />
            ))}
          </ListSection>

          <TextField
            label="Título"
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder={type === 'Sugestão' ? 'Ex.: Filtro por músculo no histórico' : 'Ex.: O timer não toca o som'}
            maxLength={100}
          />
          <TextArea
            label="Mensagem"
            value={message}
            onChange={event => setMessage(event.target.value)}
            placeholder="Conte com detalhes o que aconteceu ou qual é a sua ideia"
            maxLength={2000}
            rows={5}
          />

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted">Print (opcional)</span>
            <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={event => attach(event.target.files?.[0])} />
            {preview ? (
              <div className="relative self-start">
                <img src={preview} alt="Print anexado" className="h-40 w-30 rounded-2xl object-cover" />
                <button
                  type="button"
                  aria-label="Remover print"
                  title="Remover print"
                  onClick={() => {
                    setImage(null)
                    setPreview(null)
                  }}
                  className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full bg-foreground text-background"
                >
                  <X size={14} aria-hidden />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border text-muted transition-colors hover:bg-surface-2 focus-ring"
              >
                <ImagePlus size={22} aria-hidden />
                <span className="text-sm">Anexar uma imagem</span>
              </button>
            )}
          </div>

          <Button type="submit" label="Enviar relato" size="lg" loading={sending} />
        </form>
      </Page>
    </>
  )
}
