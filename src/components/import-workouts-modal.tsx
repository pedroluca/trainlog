import { useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, CircleCheck, Copy, FileDown, FileUp, TriangleAlert, X } from 'lucide-react'
import { Button } from './button'
import { Spinner } from './spinner'
import type { Treino } from '../data/get-user-workouts'
import type { WeekDay } from '../data/week-days'
import { CSV_TEMPLATE, formatDecimal, formatRestTime } from '../data/workout-csv'
import {
  downloadTextFile,
  importWorkouts,
  JSON_EXAMPLE,
  parseWorkoutImport,
  type ImportResult,
  type ParsedExercise,
  type ParsedWorkout,
} from '../data/workout-transfer'

type ImportWorkoutsModalProps = {
  usuarioID: string
  existingWorkouts: Treino[]
  onClose: () => void
  onImported: (count: number) => void
}

type Step = 'input' | 'preview' | 'importing' | 'result'

const MAX_FILE_BYTES = 1024 * 1024
const MAX_VISIBLE_ERRORS = 8

function describeExercise(exercise: ParsedExercise): string {
  const rest = `descanso ${formatRestTime(exercise.tempoIntervalo)}`

  if (exercise.usesProgressiveWeight && exercise.progressiveSets) {
    const sets = exercise.progressiveSets.map(set => `${set.reps}×${formatDecimal(set.weight)}`).join(' · ')
    return `${exercise.series} séries: ${sets} kg · ${rest}`
  }

  const weight = exercise.peso > 0 ? ` · ${formatDecimal(exercise.peso)} kg` : ''
  return `${exercise.series} séries × ${exercise.repeticoes} reps${weight} · ${rest}`
}

export function ImportWorkoutsModal({ usuarioID, existingWorkouts, onClose, onImported }: ImportWorkoutsModalProps) {
  const [step, setStep] = useState<Step>('input')
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [treinos, setTreinos] = useState<ParsedWorkout[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [selectedDays, setSelectedDays] = useState<Set<WeekDay>>(new Set())
  const [expandedDays, setExpandedDays] = useState<Set<WeekDay>>(new Set())
  const [showFormats, setShowFormats] = useState(false)
  const [copied, setCopied] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const existingByDay = useMemo(
    () => new Map(existingWorkouts.map(workout => [workout.dia, workout])),
    [existingWorkouts]
  )

  const selectedCount = treinos.filter(treino => selectedDays.has(treino.dia)).length
  const replaceCount = treinos.filter(treino => selectedDays.has(treino.dia) && existingByDay.has(treino.dia)).length
  const isImporting = step === 'importing'

  const handleParse = (content: string) => {
    const parsed = parseWorkoutImport(content)
    if (!parsed.ok) {
      setErrors(parsed.errors)
      return
    }

    setErrors([])
    setTreinos(parsed.treinos)
    setWarnings(parsed.warnings)
    // Dias que já têm treino começam desmarcados: substituir precisa ser escolha explícita
    setSelectedDays(new Set(parsed.treinos.filter(treino => !existingByDay.has(treino.dia)).map(treino => treino.dia)))
    setExpandedDays(new Set())
    setStep('preview')
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = '' // permite escolher o mesmo arquivo de novo
    if (!file) return

    if (file.size > MAX_FILE_BYTES) {
      setFileName(file.name)
      setErrors(['O arquivo é grande demais (máximo de 1 MB).'])
      return
    }

    try {
      const content = await file.text()
      setFileName(file.name)
      handleParse(content)
    } catch (err) {
      console.error('Erro ao ler arquivo de treinos:', err)
      setErrors(['Não foi possível ler o arquivo.'])
    }
  }

  const toggleDay = (set: Set<WeekDay>, day: WeekDay) => {
    const next = new Set(set)
    if (next.has(day)) next.delete(day)
    else next.add(day)
    return next
  }

  const handleImport = async () => {
    const toImport = treinos.filter(treino => selectedDays.has(treino.dia))
    if (toImport.length === 0) return

    setStep('importing')
    try {
      const importResult = await importWorkouts(usuarioID, toImport)
      if (importResult.failed.length === 0) {
        onImported(importResult.imported.length)
        return
      }
      setResult(importResult)
      setStep('result')
    } catch (err) {
      console.error('Erro ao importar treinos:', err)
      setErrors(['Erro ao importar os treinos. Verifique sua conexão e tente novamente.'])
      setStep('preview')
    }
  }

  const handleCloseResult = () => {
    if (result && result.imported.length > 0) onImported(result.imported.length)
    else onClose()
  }

  const handleCopyExample = () => {
    navigator.clipboard.writeText(JSON_EXAMPLE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadTemplate = () => {
    downloadTextFile(CSV_TEMPLATE, 'modelo-treinos-tractus.csv', 'text/csv;charset=utf-8')
  }

  const errorBox = errors.length > 0 && (
    <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">
      <p className="font-bold mb-1 flex items-center gap-1.5">
        <TriangleAlert size={16} className="shrink-0" />
        {errors.length === 1 ? 'Encontramos um problema:' : `Encontramos ${errors.length} problemas:`}
      </p>
      <ul className="list-disc pl-5 space-y-0.5">
        {errors.slice(0, MAX_VISIBLE_ERRORS).map((error, index) => <li key={index}>{error}</li>)}
      </ul>
      {errors.length > MAX_VISIBLE_ERRORS && (
        <p className="mt-1 text-xs">e mais {errors.length - MAX_VISIBLE_ERRORS}.</p>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] dark:bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-60 px-4">
      <div className="bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#404040] rounded-2xl w-full max-w-lg max-h-[90vh] shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#404040]">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {step === 'input' ? 'Importar Treinos' : step === 'result' ? 'Resultado da Importação' : 'Revisar Treinos'}
          </h2>
          <button
            onClick={step === 'result' ? handleCloseResult : onClose}
            disabled={isImporting}
            className="cursor-pointer p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#404040] text-gray-400 dark:text-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {step === 'input' && (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Traga treinos de um arquivo JSON ou de uma planilha (CSV). Você revisa tudo antes de salvar.
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer w-full flex flex-col items-center gap-1 rounded-xl border-2 border-dashed border-gray-300 dark:border-[#505050] hover:border-primary py-5 transition-colors"
              >
                <FileUp size={26} className="text-gray-500 dark:text-gray-400" />
                <span className="font-bold text-gray-800 dark:text-gray-100">Selecionar arquivo</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{fileName ?? '.json ou .csv'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv,.tsv,.txt,application/json,text/csv,text/plain"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-[#404040]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white dark:bg-[#2d2d2d] px-2 text-gray-500 dark:text-gray-400">ou cole o conteúdo</span>
                </div>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder="Cole aqui o JSON ou as células copiadas da planilha"
                className="w-full border border-gray-200 dark:border-[#404040] rounded-lg px-3 py-2 text-xs font-mono text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
              />

              {errorBox}

              <div>
                <button
                  type="button"
                  onClick={() => setShowFormats(value => !value)}
                  className="cursor-pointer text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1"
                >
                  Ver formatos aceitos
                  <ChevronDown size={16} className={`transition-transform ${showFormats ? 'rotate-180' : ''}`} />
                </button>

                {showFormats && (
                  <div className="mt-3 space-y-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="space-y-2">
                      <p className="font-bold text-gray-800 dark:text-gray-100">Planilha (Excel, Google Sheets, CSV)</p>
                      <p>
                        Uma linha por exercício, com as colunas <b>dia</b>, <b>treino</b>, <b>exercicio</b>, <b>series</b>, <b>repeticoes</b>, <b>peso</b>, <b>descanso</b> (ex: 1:30), <b>progressao</b> (ex: 12x40 / 10x45) e <b>nota</b>.
                        Deixe dia e treino vazios para repetir os da linha de cima. Dá pra copiar as células direto da planilha e colar aqui.
                      </p>
                      <Button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-[#404040] dark:hover:bg-[#505050] border border-gray-200 dark:border-[#505050]"
                        buttonTextColor="text-gray-800 dark:text-gray-200"
                      >
                        <FileDown size={18} />
                        Baixar modelo de planilha
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-gray-800 dark:text-gray-100">JSON</p>
                        <button
                          type="button"
                          onClick={handleCopyExample}
                          className="cursor-pointer text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1"
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          {copied ? 'Copiado!' : 'Copiar exemplo'}
                        </button>
                      </div>
                      <pre className="text-[11px] leading-snug bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#404040] rounded-lg p-3 overflow-x-auto text-gray-700 dark:text-gray-300">
                        {JSON_EXAMPLE}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {(step === 'preview' || step === 'importing') && (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Marque os dias que deseja importar. Toque em um treino para ver os exercícios.
              </p>

              {errorBox}

              {warnings.length > 0 && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-400">
                  <p className="font-bold mb-1">Ajustes feitos na leitura:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {warnings.map((warning, index) => <li key={index}>{warning}</li>)}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                {treinos.map(treino => {
                  const isSelected = selectedDays.has(treino.dia)
                  const isExpanded = expandedDays.has(treino.dia)
                  const existing = existingByDay.get(treino.dia)

                  return (
                    <div
                      key={treino.dia}
                      className={`rounded-xl border transition-colors ${
                        isSelected ? 'border-primary bg-white dark:bg-[#252525]' : 'border-gray-200 dark:border-[#404040] bg-gray-50 dark:bg-[#1f1f1f]'
                      }`}
                    >
                      <div className="flex items-center gap-3 p-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => setSelectedDays(current => toggleDay(current, treino.dia))}
                          disabled={isImporting}
                          className="w-5 h-5 shrink-0 cursor-pointer"
                          style={{ accentColor: 'var(--color-primary)' }}
                          aria-label={`Importar treino de ${treino.dia}`}
                        />
                        <button
                          type="button"
                          onClick={() => setExpandedDays(current => toggleDay(current, treino.dia))}
                          className="cursor-pointer flex-1 min-w-0 flex items-center justify-between gap-2 text-left"
                        >
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400">{treino.dia}</p>
                            <p className={`font-bold truncate ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                              {treino.musculo}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {treino.exercicios.length} {treino.exercicios.length === 1 ? 'exercício' : 'exercícios'}
                            </p>
                          </div>
                          <ChevronDown size={18} className={`shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {existing && (
                        <div className="mx-3 mb-3 flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-xs border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400">
                          <TriangleAlert size={14} className="shrink-0 mt-px" />
                          <span>
                            {isSelected
                              ? <>Vai substituir seu treino atual: <b>{existing.musculo}</b></>
                              : <>Você já tem <b>{existing.musculo}</b> neste dia. Marque para substituir.</>}
                          </span>
                        </div>
                      )}

                      {isExpanded && (
                        <ol className="border-t border-gray-100 dark:border-[#404040] px-3 py-2 space-y-2">
                          {treino.exercicios.length === 0 && (
                            <li className="text-xs text-gray-500 dark:text-gray-400">Nenhum exercício neste treino.</li>
                          )}
                          {treino.exercicios.map((exercicio, index) => (
                            <li key={index}>
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                {index + 1}. {exercicio.titulo}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{describeExercise(exercicio)}</p>
                              {exercicio.nota && (
                                <p className="text-xs italic text-gray-400 dark:text-gray-500">{exercicio.nota}</p>
                              )}
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {step === 'result' && result && (
            <div className="space-y-3 text-sm">
              {result.imported.length > 0 && (
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-100 mb-1">Importados:</p>
                  <ul className="space-y-1">
                    {result.imported.map(dia => (
                      <li key={dia} className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <CircleCheck size={16} className="shrink-0" /> {dia}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-100 mb-1">Não importados:</p>
                <ul className="space-y-1">
                  {result.failed.map(({ dia, message }) => (
                    <li key={dia} className="flex items-start gap-2 text-red-700 dark:text-red-400">
                      <TriangleAlert size={16} className="shrink-0 mt-0.5" />
                      <span><b>{dia}:</b> {message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-[#404040]">
          {step === 'input' && (
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-[#404040] dark:hover:bg-[#505050]"
                buttonTextColor="text-gray-700 dark:text-gray-200"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setFileName(null)
                  handleParse(text)
                }}
                disabled={!text.trim()}
                className="flex-1 disabled:opacity-50"
                bgColor="bg-primary hover:opacity-90"
              >
                Continuar
              </Button>
            </div>
          )}

          {(step === 'preview' || step === 'importing') && (
            <>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    setErrors([])
                    setStep('input')
                  }}
                  disabled={isImporting}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-[#404040] dark:hover:bg-[#505050] disabled:opacity-50"
                  buttonTextColor="text-gray-700 dark:text-gray-200"
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  onClick={handleImport}
                  disabled={selectedCount === 0 || isImporting}
                  className="flex-[2] disabled:opacity-50"
                  bgColor="bg-primary hover:opacity-90"
                >
                  {isImporting && <Spinner size={16} thickness={2} color="rgba(255,255,255,0.8)" />}
                  {isImporting
                    ? 'Importando...'
                    : `Importar ${selectedCount} ${selectedCount === 1 ? 'treino' : 'treinos'}`}
                </Button>
              </div>
              {replaceCount > 0 && (
                <p className="mt-2 text-xs text-center text-amber-700 dark:text-amber-400">
                  {replaceCount === 1
                    ? '1 treino existente será substituído'
                    : `${replaceCount} treinos existentes serão substituídos`}
                </p>
              )}
            </>
          )}

          {step === 'result' && (
            <Button
              type="button"
              onClick={handleCloseResult}
              className="w-full"
              bgColor="bg-primary hover:opacity-90"
            >
              Fechar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
