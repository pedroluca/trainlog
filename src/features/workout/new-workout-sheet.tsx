import { BookOpen, ChevronRight, KeyRound, PencilLine } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Callout, Chip, ChipRow, SegmentedControl } from '../../components/ui/misc'
import { Sheet } from '../../components/ui/sheet'
import { TextField } from '../../components/ui/text-field'
import { useToast } from '../../contexts/toast-context'
import { updateScheduledDays } from '../../data/streak-utils'
import { cloneSharedWorkout, createWorkout, InvalidShareCodeError, WorkoutDayTakenError } from '../../data/training'
import { templateCategories, workoutTemplates, type WorkoutTemplate } from '../../data/workout-templates'
import { trackTemplateCloned, trackWorkoutCreated } from '../../utils/analytics'

type Mode = 'blank' | 'template' | 'code'
type Category = (typeof templateCategories)[number]['value'] | 'all'

const SUGGESTIONS = ['Peito e Tríceps', 'Costas e Bíceps', 'Pernas', 'Ombros e Abdômen', 'Full Body']

type Props = {
  day: string
  /** Dono do treino (o próprio usuário ou um aluno) */
  ownerId: string
  /** Quem está criando (o treinador, quando monta para um aluno) */
  createdBy: string
  onClose: () => void
}

export function NewWorkoutSheet({ day, ownerId, createdBy, onClose }: Props) {
  const toast = useToast()
  const [mode, setMode] = useState<Mode>('blank')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [category, setCategory] = useState<Category>('all')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const finish = (message: string) => {
    toast.success(message)
    updateScheduledDays(ownerId)
    onClose()
  }

  const handleError = (err: unknown) => {
    setError(
      err instanceof WorkoutDayTakenError || err instanceof InvalidShareCodeError
        ? err.message
        : 'Não foi possível adicionar o treino. Verifique sua conexão e tente de novo.',
    )
    setBusy(null)
  }

  const createBlank = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!name.trim()) {
      setError('Dê um nome ao treino, por exemplo "Peito e Tríceps".')
      return
    }
    setBusy('blank')
    setError(null)
    try {
      await createWorkout({ userId: ownerId, createdBy, day, name })
      trackWorkoutCreated(day)
      finish('Treino criado')
    } catch (err) {
      handleError(err)
    }
  }

  const cloneFromCode = async (shareCode: string, busyKey: string, template?: WorkoutTemplate) => {
    setBusy(busyKey)
    setError(null)
    try {
      await cloneSharedWorkout({ code: shareCode, userId: ownerId, createdBy, day })
      if (template) trackTemplateCloned(template.nome)
      finish(template ? 'Modelo adicionado' : 'Treino adicionado')
    } catch (err) {
      handleError(err)
    }
  }

  const templates = category === 'all' ? workoutTemplates : workoutTemplates.filter(template => template.categoria === category)

  return (
    <Sheet open onClose={onClose} title="Novo treino" description={`${day} · escolha como quer montar o treino deste dia.`}>
      <div className="flex flex-col gap-5 pb-2">
        <SegmentedControl<Mode>
          value={mode}
          onChange={value => {
            setMode(value)
            setError(null)
          }}
          options={[
            { value: 'blank', label: 'Do zero', icon: PencilLine },
            { value: 'template', label: 'Modelo', icon: BookOpen },
            { value: 'code', label: 'Código', icon: KeyRound },
          ]}
        />

        {error && <Callout tone="danger">{error}</Callout>}

        {mode === 'blank' && (
          <form onSubmit={createBlank} className="flex flex-col gap-4">
            <TextField label="Nome do treino" value={name} onChange={event => setName(event.target.value)} placeholder="Ex.: Costas e Bíceps" autoFocus maxLength={80} />
            <ChipRow>
              {SUGGESTIONS.map(suggestion => (
                <Chip key={suggestion} label={suggestion} selected={name === suggestion} onClick={() => setName(suggestion)} />
              ))}
            </ChipRow>
            <Button type="submit" label="Criar treino" size="lg" loading={busy === 'blank'} />
            <p className="text-center text-xs text-subtle">Depois de criar, adicione os exercícios pelo botão + na tela de treino.</p>
          </form>
        )}

        {mode === 'template' && (
          <div className="flex flex-col gap-4">
            <ChipRow>
              <Chip label="Todos" selected={category === 'all'} onClick={() => setCategory('all')} />
              {templateCategories.map(item => (
                <Chip key={item.value} label={item.label} selected={category === item.value} onClick={() => setCategory(item.value)} />
              ))}
            </ChipRow>
            <Card className="overflow-hidden">
              {templates.map((template, index) => (
                <div key={template.id}>
                  {index > 0 && <div className="mx-4 h-px bg-border" />}
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => cloneFromCode(template.id, template.id, template)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-2 focus-ring disabled:opacity-60"
                  >
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="text-base font-semibold">{template.nome}</span>
                      <span className="text-xs text-muted">{template.descricao}</span>
                    </span>
                    {busy === template.id ? <span className="text-xs text-primary">Adicionando...</span> : <ChevronRight size={18} className="text-subtle" aria-hidden />}
                  </button>
                </div>
              ))}
            </Card>
          </div>
        )}

        {mode === 'code' && (
          <form
            onSubmit={event => {
              event.preventDefault()
              if (code.trim()) cloneFromCode(code, 'code')
            }}
            className="flex flex-col gap-4"
          >
            <TextField
              label="Código de compartilhamento"
              value={code}
              onChange={event => setCode(event.target.value)}
              placeholder="Cole o código recebido"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              hint="Peça para quem montou o treino usar Compartilhar no perfil."
            />
            <Button type="submit" label="Adicionar treino" size="lg" loading={busy === 'code'} disabled={!code.trim()} />
          </form>
        )}
      </div>
    </Sheet>
  )
}
