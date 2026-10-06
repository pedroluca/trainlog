import { Check, ChevronDown, CircleCheck, ClipboardPaste, FileDown, FileUp, TriangleAlert } from 'lucide-react'
import { useMemo, useRef, useState, type DragEvent } from 'react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Callout } from '../../components/ui/misc'
import { Sheet } from '../../components/ui/sheet'
import { TextArea } from '../../components/ui/text-field'
import { useToast } from '../../contexts/toast-context'
import type { Treino } from '../../data/get-user-workouts'
import type { WeekDay } from '../../data/week-days'
import { CSV_TEMPLATE, formatDecimal, formatRestTime } from '../../data/workout-csv'
import {
  downloadTextFile,
  importWorkouts,
  JSON_EXAMPLE,
  parseWorkoutImport,
  type ImportResult,
  type ParsedExercise,
  type ParsedWorkout,
} from '../../data/workout-transfer'
import { cn } from '../../utils/cn'

type Props = {
  usuarioID: string
  existingWorkouts: Treino[]
  onClose: () => void
  onImported: (count: number) => void
}

type Step = 'input' | 'preview' | 'result'
const MAX_FILE_BYTES = 1024 * 1024
const MAX_VISIBLE_ERRORS = 8

function describeExercise(exercise: ParsedExercise): string {
  const rest = `descanso ${formatRestTime(exercise.tempoIntervalo)}`
  if (exercise.usesProgressiveWeight && exercise.progressiveSets) {
    return `${exercise.series} séries: ${exercise.progressiveSets.map(set => `${set.reps}×${formatDecimal(set.weight)}`).join(' · ')} kg · ${rest}`
  }
  const weight = exercise.peso > 0 ? ` · ${formatDecimal(exercise.peso)} kg` : ''
  return `${exercise.series} × ${exercise.repeticoes}${weight} · ${rest}`
}

const toggle = (set: Set<WeekDay>, day: WeekDay) => {
  const next = new Set(set)
  if (next.has(day)) next.delete(day)
  else next.add(day)
  return next
}

/** Importar treinos de JSON ou planilha, com revisão antes de salvar (mesmo fluxo do app nativo) */
export function ImportSheet({ usuarioID, existingWorkouts, onClose, onImported }: Props) {
  const toast = useToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('input')
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [workouts, setWorkouts] = useState<ParsedWorkout[]>([])
  const [selected, setSelected] = useState<Set<WeekDay>>(new Set())
  const [expanded, setExpanded] = useState<Set<WeekDay>>(new Set())
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [showFormats, setShowFormats] = useState(false)

  const existingByDay = useMemo(() => new Map(existingWorkouts.map(workout => [workout.dia, workout])), [existingWorkouts])
  const selectedCount = workouts.filter(workout => selected.has(workout.dia)).length
  const replaceCount = workouts.filter(workout => selected.has(workout.dia) && existingByDay.has(workout.dia)).length

  const parse = (content: string) => {
    const parsed = parseWorkoutImport(content)
    if (!parsed.ok) {
      setErrors(parsed.errors)
      return
    }
    setErrors([])
    setWorkouts(parsed.treinos)
    setWarnings(parsed.warnings)
    // Dias que já têm treino começam desmarcados: substituir precisa ser escolha explícita
    setSelected(new Set(parsed.treinos.filter(workout => !existingByDay.has(workout.dia)).map(workout => workout.dia)))
    setExpanded(new Set())
    setStep('preview')
  }

  const readFile = async (file: File | undefined) => {
    if (!file) return
    setFileName(file.name)
    if (file.size > MAX_FILE_BYTES) {
      setErrors(['O arquivo é grande demais (máximo de 1 MB).'])
      return
    }
    try {
      parse(await file.text())
    } catch {
      setErrors(['Não foi possível ler o arquivo.'])
    }
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    readFile(event.dataTransfer.files?.[0])
  }

  const paste = async () => {
    try {
      setText(await navigator.clipboard.readText())
    } catch {
      toast.error('O navegador não liberou a área de transferência. Cole com Ctrl+V.')
    }
  }

  const runImport = async () => {
    const toImport = workouts.filter(workout => selected.has(workout.dia))
    if (toImport.length === 0) return
    setImporting(true)
    try {
      const importResult = await importWorkouts(usuarioID, toImport)
      if (importResult.failed.length === 0) {
        onImported(importResult.imported.length)
        return
      }
      setResult(importResult)
      setStep('result')
    } catch {
      setErrors(['Erro ao importar os treinos. Verifique sua conexão e tente novamente.'])
    } finally {
      setImporting(false)
    }
  }

  const closeResult = () => {
    if (result && result.imported.length > 0) onImported(result.imported.length)
    else onClose()
  }

  const errorBox = errors.length > 0 && (
    <Callout tone="danger" icon={TriangleAlert} title={errors.length === 1 ? 'Encontramos um problema' : `Encontramos ${errors.length} problemas`}>
      <ul className="flex flex-col gap-1 text-sm leading-5 text-muted">
        {errors.slice(0, MAX_VISIBLE_ERRORS).map((error, index) => <li key={index}>• {error}</li>)}
        {errors.length > MAX_VISIBLE_ERRORS && <li className="text-xs">e mais {errors.length - MAX_VISIBLE_ERRORS}.</li>}
      </ul>
    </Callout>
  )

  if (step === 'result' && result) {
    return (
      <Sheet open onClose={closeResult} title="Resultado da importação" footer={<Button label="Fechar" fullWidth onClick={closeResult} />}>
        <div className="flex flex-col gap-4 pb-2">
          {result.imported.length > 0 && (
            <Card className="flex flex-col gap-2 p-4">
              <h3 className="text-base font-semibold">Importados</h3>
              {result.imported.map(day => (
                <span key={day} className="flex items-center gap-2 text-sm">
                  <CircleCheck size={16} className="text-success" aria-hidden />
                  {day}
                </span>
              ))}
            </Card>
          )}
          <Card className="flex flex-col gap-2 p-4">
            <h3 className="text-base font-semibold">Não importados</h3>
            {result.failed.map(({ dia, message }) => (
              <span key={dia} className="flex items-start gap-2 text-sm">
                <TriangleAlert size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden />
                <span><strong className="font-semibold">{dia}:</strong> {message}</span>
              </span>
            ))}
          </Card>
        </div>
      </Sheet>
    )
  }

  if (step === 'preview') {
    return (
      <Sheet
        open
        onClose={onClose}
        dismissable={!importing}
        title="Revisar treinos"
        description="Marque os dias que deseja importar. Clique no treino para ver os exercícios."
        footer={(
          <div className="flex flex-col gap-2">
            <Button
              label={importing ? 'Importando...' : `Importar ${selectedCount} ${selectedCount === 1 ? 'treino' : 'treinos'}`}
              size="lg"
              loading={importing}
              disabled={selectedCount === 0}
              onClick={runImport}
            />
            {replaceCount > 0 && (
              <p className="text-center text-xs text-warning">
                {replaceCount === 1 ? '1 treino existente será substituído' : `${replaceCount} treinos existentes serão substituídos`}
              </p>
            )}
            <Button label="Voltar" variant="ghost" disabled={importing} onClick={() => { setErrors([]); setStep('input') }} />
          </div>
        )}
      >
        <div className="flex flex-col gap-4 pb-2">
          {errorBox}
          {warnings.length > 0 && (
            <Callout tone="warning" title="Ajustes feitos na leitura">
              <ul className="flex flex-col gap-1 text-xs leading-4 text-muted">
                {warnings.map((warning, index) => <li key={index}>• {warning}</li>)}
              </ul>
            </Callout>
          )}

          {workouts.map(workout => {
            const isSelected = selected.has(workout.dia)
            const isExpanded = expanded.has(workout.dia)
            const current = existingByDay.get(workout.dia)
            return (
              <Card key={workout.dia} className={cn('overflow-hidden', isSelected && 'border-primary')}>
                <div className="flex items-center gap-3 p-4">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    aria-label={`Importar treino de ${workout.dia}`}
                    disabled={importing}
                    onClick={() => setSelected(set => toggle(set, workout.dia))}
                    className={cn('flex size-6 shrink-0 items-center justify-center rounded-md border-2 focus-ring', isSelected ? 'border-primary bg-primary text-on-primary' : 'border-border')}
                  >
                    {isSelected && <Check size={16} strokeWidth={3} aria-hidden />}
                  </button>
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpanded(set => toggle(set, workout.dia))}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left focus-ring"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-xs text-muted">{workout.dia}</span>
                      <span className={cn('truncate text-base font-semibold', !isSelected && 'text-muted')}>{workout.musculo}</span>
                      <span className="text-xs text-subtle">{workout.exercicios.length} {workout.exercicios.length === 1 ? 'exercício' : 'exercícios'}</span>
                    </span>
                    <ChevronDown size={18} className={cn('shrink-0 text-subtle transition-transform', isExpanded && 'rotate-180')} aria-hidden />
                  </button>
                </div>
                {current && (
                  <p className="mx-4 mb-3 rounded-xl bg-warning/10 px-3 py-2 text-xs text-warning">
                    {isSelected ? `Vai substituir o treino atual: ${current.musculo}` : `Você já tem "${current.musculo}" neste dia. Marque para substituir.`}
                  </p>
                )}
                {isExpanded && (
                  <div className="flex flex-col gap-2.5 border-t border-border px-4 py-3">
                    {workout.exercicios.length === 0 && <span className="text-xs text-muted">Nenhum exercício neste treino.</span>}
                    {workout.exercicios.map((exercise, index) => (
                      <div key={index} className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold">{index + 1}. {exercise.titulo}</span>
                        <span className="text-xs text-muted">{describeExercise(exercise)}</span>
                        {!!exercise.nota && <span className="text-xs italic text-subtle">{exercise.nota}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet open onClose={onClose} title="Importar treinos" description="Traga treinos de um arquivo JSON ou de uma planilha (CSV). Você revisa tudo antes de salvar.">
      <div className="flex flex-col gap-5 pb-2">
        <input ref={fileInput} type="file" accept=".json,.csv,.tsv,.txt,application/json,text/csv,text/plain" className="hidden" onChange={event => { readFile(event.target.files?.[0]); event.target.value = '' }} />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          onDragOver={event => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex flex-col items-center gap-1.5 rounded-2xl border border-dashed py-6 transition-colors focus-ring',
            dragging ? 'border-primary bg-primary/5' : 'border-border hover:bg-surface-2',
          )}
        >
          <FileUp size={26} className="text-muted" aria-hidden />
          <span className="text-base font-semibold">Selecionar arquivo</span>
          <span className="text-xs text-muted">{fileName ?? '.json ou .csv · ou arraste o arquivo para cá'}</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-subtle">ou cole o conteúdo</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="flex flex-col gap-1">
          <TextArea
            value={text}
            onChange={event => setText(event.target.value)}
            placeholder="Cole aqui o JSON ou as células copiadas da planilha"
            aria-label="Conteúdo para importar"
            className="min-h-32 font-mono text-xs"
            spellCheck={false}
          />
          <Button label="Colar da área de transferência" icon={ClipboardPaste} variant="ghost" size="sm" className="-ml-2 self-start" onClick={paste} />
        </div>

        {errorBox}

        <Button label="Continuar" size="lg" disabled={!text.trim()} onClick={() => { setFileName(null); parse(text) }} />

        <div className="flex flex-col gap-3">
          <button type="button" onClick={() => setShowFormats(value => !value)} aria-expanded={showFormats} className="flex items-center gap-1 self-start text-sm font-semibold text-primary">
            Ver formatos aceitos
            <ChevronDown size={16} className={cn('transition-transform', showFormats && 'rotate-180')} aria-hidden />
          </button>
          {showFormats && (
            <div className="flex flex-col gap-4">
              <Card className="flex flex-col gap-2 p-4">
                <h3 className="text-base font-semibold">Planilha (Excel, Google Sheets, CSV)</h3>
                <p className="text-sm leading-5 text-muted">
                  Uma linha por exercício, com as colunas dia, treino, exercicio, series, repeticoes, peso, descanso (ex.: 1:30), progressao (ex.: 12x40 / 10x45) e nota.
                  Deixe dia e treino vazios para repetir os da linha de cima.
                </p>
                <Button
                  label="Baixar modelo de planilha"
                  icon={FileDown}
                  variant="secondary"
                  size="sm"
                  className="self-start"
                  onClick={() => downloadTextFile(CSV_TEMPLATE, 'modelo-treinos-tractus.csv', 'text/csv;charset=utf-8')}
                />
              </Card>
              <Card className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">JSON</h3>
                  <Button
                    label="Copiar exemplo"
                    variant="ghost"
                    size="sm"
                    className="-mr-2"
                    onClick={() => navigator.clipboard.writeText(JSON_EXAMPLE).then(() => toast.success('Exemplo copiado')).catch(() => {})}
                  />
                </div>
                <pre className="overflow-x-auto rounded-xl bg-surface-2 p-3 font-mono text-[11px] leading-4 text-muted">{JSON_EXAMPLE}</pre>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  )
}
