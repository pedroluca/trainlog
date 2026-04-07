import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { Button } from './button'
import { exerciseLibrary, getMuscleGroups, type MuscleGroup } from '../data/exercise-library'
import { Toast, ToastState } from './toast'
import { Search, ChevronDown, X, Dumbbell, CheckCircle2, Minus, Plus } from 'lucide-react'

type Props = {
  workoutId: string
  onClose: () => void
}

const difficultyColor: Record<string, string> = {
  'Iniciante':     'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Intermediário': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Avançado':      'bg-red-500/15 text-red-400 border-red-500/30',
}

const muscleColors: Record<string, string> = {
  'Peito':       'bg-rose-500/15 text-rose-400 border-rose-500/30',
  'Costas':      'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Ombros':      'bg-violet-500/15 text-violet-400 border-violet-500/30',
  'Bíceps':      'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  'Tríceps':     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'Quadríceps':  'bg-lime-500/15 text-lime-400 border-lime-500/30',
  'Posteriores': 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  'Glúteos':     'bg-pink-500/15 text-pink-400 border-pink-500/30',
  'Panturrilha': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  'Abdômen':     'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'Antebraço':   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Pernas':      'bg-lime-500/15 text-lime-400 border-lime-500/30',
}

function getMuscleColor(muscle: string): string {
  return muscleColors[muscle] ?? 'bg-gray-500/15 text-gray-400 border-gray-500/30'
}

// ─── Exercise Picker ──────────────────────────────────────────────────────────

type ExercisePickerProps = {
  selectedId: string
  onSelect: (id: string) => void
}

function ExercisePicker({ selectedId, onSelect }: ExercisePickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState<MuscleGroup | 'all'>('all')
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const muscleGroups = getMuscleGroups()

  const filtered = exerciseLibrary.filter(ex => {
    const matchesMuscle = muscle === 'all' || ex.musculos.includes(muscle)
    const q = search.toLowerCase()
    const matchesSearch = !q || ex.nome.toLowerCase().includes(q) || ex.musculos.some(m => m.toLowerCase().includes(q))
    return matchesMuscle && matchesSearch
  })

  const selected = exerciseLibrary.find(ex => ex.id === selectedId)

  // Close on outside click (desktop)
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Auto-focus search when picker opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 80)
  }, [open])

  const handleSelect = (id: string) => {
    onSelect(id)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left
          ${open
            ? 'border-[#27AE60] bg-[#27AE60]/5 dark:bg-[#27AE60]/10'
            : 'border-gray-200 dark:border-[#404040] bg-white dark:bg-[#1a1a1a] hover:border-gray-300 dark:hover:border-[#555]'
          }`}
      >
        {selected ? (
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle2 size={18} className="text-[#27AE60] flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-gray-800 dark:text-gray-100 truncate text-sm">{selected.nome}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{selected.musculos.join(', ')}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
            <Dumbbell size={18} className="flex-shrink-0" />
            <span className="text-sm">Escolher exercício da biblioteca...</span>
          </div>
        )}
        <ChevronDown
          size={18}
          className={`flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="
          absolute left-0 right-0 z-50 mt-2
          bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#404040]
          rounded-2xl shadow-2xl overflow-hidden
          flex flex-col
          max-h-[50vh]
          animate-in fade-in slide-in-from-top-2 duration-150
        ">
          {/* Search */}
          <div className="p-3 border-b border-gray-100 dark:border-[#333] flex-shrink-0">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar exercício..."
                className="w-full pl-9 pr-9 py-2 text-sm rounded-lg bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#404040] text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#27AE60]/40"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Muscle filter chips */}
          <div className="flex gap-1.5 px-3 py-2 overflow-x-auto flex-shrink-0 border-b border-gray-100 dark:border-[#333] scrollbar-none">
            <button
              type="button"
              onClick={() => setMuscle('all')}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold border transition-all
                ${muscle === 'all'
                  ? 'bg-[#27AE60] text-white border-[#27AE60]'
                  : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#404040] hover:border-[#27AE60]/50'
                }`}
            >
              Todos
            </button>
            {muscleGroups.map(m => (
              <button
                type="button"
                key={m}
                onClick={() => setMuscle(m)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold border transition-all
                  ${muscle === m
                    ? 'bg-[#27AE60] text-white border-[#27AE60]'
                    : `${getMuscleColor(m)} hover:border-current/70`
                  }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Exercise list */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                Nenhum exercício encontrado
              </div>
            ) : (
              filtered.map(ex => (
                <button
                  type="button"
                  key={ex.id}
                  onClick={() => handleSelect(ex.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors border-b border-gray-50 dark:border-[#2a2a2a] last:border-0
                    ${selectedId === ex.id ? 'bg-[#27AE60]/5 dark:bg-[#27AE60]/10' : ''}
                  `}
                >
                  {selectedId === ex.id && (
                    <CheckCircle2 size={16} className="text-[#27AE60] flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${selectedId === ex.id ? 'text-[#27AE60]' : 'text-gray-800 dark:text-gray-100'}`}>
                      {ex.nome}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {ex.musculos.slice(0, 2).map(m => (
                        <span key={m} className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getMuscleColor(m)}`}>
                          {m}
                        </span>
                      ))}
                      {ex.musculos.length > 2 && (
                        <span className="text-[10px] text-gray-400">+{ex.musculos.length - 2}</span>
                      )}
                    </div>
                  </div>
                  <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border ${difficultyColor[ex.dificuldade]}`}>
                    {ex.dificuldade}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function AddExerciseModal({ onClose, workoutId }: Props) {
  const [titulo, setTitulo] = useState('')
  const [series, setSeries] = useState(0)
  const [repeticoes, setRepeticoes] = useState(0)
  const [peso, setPeso] = useState(0)
  const [tempoIntervalo, setTempoIntervalo] = useState('')
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [usesProgressiveWeight, setUsesProgressiveWeight] = useState(false)
  const [progressiveSets, setProgressiveSets] = useState<Array<{ reps: number; weight: number }>>([])
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })
  const [isLoading, setIsLoading] = useState(false)

  // Sync progressive sets when series changes
  useEffect(() => {
    if (usesProgressiveWeight && series > 0) {
      setProgressiveSets(currentSets => {
        const currentLength = currentSets.length
        if (series > currentLength) {
          const newSets = Array.from({ length: series - currentLength }, () => ({
            reps: repeticoes || 10,
            weight: peso || 0
          }))
          return [...currentSets, ...newSets]
        } else if (series < currentLength) {
          return currentSets.slice(0, series)
        }
        return currentSets
      })
    }
  }, [series, usesProgressiveWeight, repeticoes, peso])

  const handleSelectExercise = (exerciseId: string) => {
    const exercise = exerciseLibrary.find(ex => ex.id === exerciseId)
    if (!exercise) return

    setSelectedExerciseId(exerciseId)
    setTitulo(exercise.nome)

    if (exercise.dificuldade === 'Iniciante') {
      setSeries(3)
      setRepeticoes(12)
    } else if (exercise.dificuldade === 'Intermediário') {
      setSeries(4)
      setRepeticoes(10)
    } else {
      setSeries(4)
      setRepeticoes(8)
    }
    setTempoIntervalo('01:30')
  }

  const handleBreakTimeChange = (value: string) => {
    const sanitizedValue = value.replace(/[^0-9:]/g, '').slice(0, 5)
    const formattedValue = sanitizedValue.replace(/^(\d{2})(\d{1,2})?$/, (_, m, s) => (s ? `${m}:${s}` : m))
    setTempoIntervalo(formattedValue)
  }

  const adjustBreakTime = (adjustment: number) => {
    const [minutes = 0, seconds = 0] = tempoIntervalo.split(':').map(Number)
    let totalSeconds = minutes * 60 + seconds + adjustment
    if (totalSeconds < 0) totalSeconds = 0
    const newMinutes = Math.floor(totalSeconds / 60)
    const newSeconds = totalSeconds % 60
    setTempoIntervalo(`${String(newMinutes).padStart(2, '0')}:${String(newSeconds).padStart(2, '0')}`)
  }

  const handleAddExercise = async () => {
    try {
      setIsLoading(true)
      const [minutes, seconds] = tempoIntervalo.split(':').map(Number)
      const totalBreakTime = minutes * 60 + seconds

      const exercisesRef = collection(db, 'treinos', workoutId, 'exercicios')

      const exerciseData: Record<string, unknown> = {
        titulo,
        series,
        repeticoes,
        peso,
        tempoIntervalo: totalBreakTime,
        usesProgressiveWeight
      }

      if (usesProgressiveWeight) {
        exerciseData.progressiveSets = progressiveSets
      }

      const newExercise = await addDoc(exercisesRef, exerciseData)

      const workoutRef = doc(db, 'treinos', workoutId)
      const workoutSnap = await getDoc(workoutRef)
      if (workoutSnap.exists()) {
        const workoutData = workoutSnap.data()
        const currentOrder = workoutData.exerciseOrder || []
        await updateDoc(workoutRef, {
          exerciseOrder: [...currentOrder, newExercise.id]
        })
      }

      onClose()
    } catch (err) {
      console.error('Erro ao adicionar exercício:', err)
      setToast({ show: true, message: 'Erro ao adicionar exercício.', type: 'error' })
      setIsLoading(false)
    }
  }

  const inputClass = 'flex-1 border border-gray-300 dark:border-[#404040] rounded-lg px-3 py-2.5 bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-100 text-center w-4/6 focus:outline-none focus:ring-2 focus:ring-[#27AE60]/50 font-medium transition-all shadow-sm'
  const stepBtnClass = 'bg-gray-100 border border-gray-200 dark:border-[#404040] dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#3a3a3a] text-gray-700 dark:text-gray-300 font-bold w-1/6 h-[46px] rounded-lg flex items-center justify-center transition-all shadow-sm'

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] dark:bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-60 px-4">
      <div className="bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#404040] rounded-2xl p-6 w-full max-w-md overflow-y-auto max-h-[90vh] shadow-xl">
        <h2 className="text-2xl font-bold mb-6 dark:text-gray-100">Adicionar Exercício</h2>

        <form className="space-y-5">
          {/* ── Exercise Picker ── */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
              Escolher exercício:
            </label>
            <ExercisePicker selectedId={selectedExerciseId} onSelect={handleSelectExercise} />
          </div>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-[#404040]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white dark:bg-[#2d2d2d] px-2 text-gray-500 dark:text-gray-400">ou preencher manualmente</span>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="titulo">
              Nome do exercício:
            </label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full border border-gray-300 dark:border-[#404040] rounded-lg px-3 py-2.5 bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#27AE60]/50 font-medium transition-all shadow-sm"
              placeholder="Ex: Supino Inclinado"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="series">
              Séries:
            </label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setSeries(Math.max(0, series - 1))} className={`${stepBtnClass} cursor-pointer flex items-center justify-center`}><Minus /></button>
              <input id="series" type="number" value={series || ''} onChange={(e) => setSeries(Number(e.target.value))} className={`${inputClass}`} placeholder="Ex: 3" required />
              <button type="button" onClick={() => setSeries(series + 1)} className={`${stepBtnClass} cursor-pointer flex items-center justify-center`}><Plus /></button>
            </div>
          </div>

          {/* Progressive Weight Switch */}
          <div className='bg-gray-50 dark:bg-[#252525] p-4 rounded-xl border border-gray-200 dark:border-[#404040] flex items-center justify-between'>
            <div className="flex-1 pr-4">
              <p className="text-gray-800 dark:text-gray-100 font-bold text-sm">Progressão de carga</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Configurar peso e repetições para cada série</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const checked = !usesProgressiveWeight
                setUsesProgressiveWeight(checked)
                if (checked) {
                  setProgressiveSets(Array.from({ length: series || 3 }, () => ({ reps: repeticoes || 10, weight: peso || 0 })))
                }
              }}
              className={`cursor-pointer relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                usesProgressiveWeight ? 'bg-[#27AE60]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  usesProgressiveWeight ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Progressive Sets Configuration */}
          {usesProgressiveWeight && (
            <div className='p-4 border border-gray-200 dark:border-[#404040] rounded-xl bg-gray-50 dark:bg-[#1f1f1f]'>
              {progressiveSets.map((set, index) => (
                <div key={index} className='flex items-center gap-2 mb-3 last:mb-0'>
                  <span className='text-gray-700 dark:text-gray-300 text-sm font-bold w-16'>Série {index + 1}:</span>
                  <input type='number' value={set.reps} onChange={(e) => { const newSets = [...progressiveSets]; newSets[index].reps = Number(e.target.value); setProgressiveSets(newSets) }} className='min-w-0 flex-1 border border-gray-300 dark:border-[#404040] rounded-lg px-2 py-2 text-center bg-white dark:bg-[#1a1a1a] dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#27AE60]/50 transition-all shadow-sm' placeholder='Reps' />
                  <span className='text-gray-600 dark:text-gray-400 text-sm font-medium'>x</span>
                  <input type='number' value={set.weight} onChange={(e) => { const newSets = [...progressiveSets]; newSets[index].weight = Number(e.target.value); setProgressiveSets(newSets) }} className='min-w-0 flex-1 border border-gray-300 dark:border-[#404040] rounded-lg px-2 py-2 text-center bg-white dark:bg-[#1a1a1a] dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#27AE60]/50 transition-all shadow-sm' placeholder='Peso' />
                  <span className='text-gray-600 dark:text-gray-400 text-sm font-medium'>kg</span>
                </div>
              ))}
            </div>
          )}

          {!usesProgressiveWeight && (
            <>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="repeticoes">Repetições:</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setRepeticoes(Math.max(0, repeticoes - 1))} className={`${stepBtnClass} cursor-pointer flex items-center justify-center`}><Minus /></button>
                  <input id="repeticoes" type="number" value={repeticoes || ''} onChange={(e) => setRepeticoes(Number(e.target.value))} className={inputClass} placeholder="Ex: 12" required />
                  <button type="button" onClick={() => setRepeticoes(repeticoes + 1)} className={`${stepBtnClass} cursor-pointer flex items-center justify-center`}><Plus /></button>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="peso">Peso (kg):</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setPeso(Math.max(0, peso - 1))} className={`${stepBtnClass} cursor-pointer flex items-center justify-center`}><Minus /></button>
                  <input id="peso" type="number" value={peso || ''} onChange={(e) => setPeso(Number(e.target.value))} className={inputClass} placeholder="Ex: 20" required />
                  <button type="button" onClick={() => setPeso(peso + 1)} className={`${stepBtnClass} cursor-pointer flex items-center justify-center`}><Plus /></button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="tempoIntervalo">Tempo de intervalo (MM:SS):</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => adjustBreakTime(-10)} className={`${stepBtnClass} cursor-pointer flex items-center justify-center`}><Minus /></button>
              <input id="tempoIntervalo" type="text" value={tempoIntervalo} onChange={(e) => handleBreakTimeChange(e.target.value)} className={inputClass} placeholder="Ex: 01:30" required />
              <button type="button" onClick={() => adjustBreakTime(10)} className={`${stepBtnClass} cursor-pointer flex items-center justify-center`}><Plus /></button>
            </div>
          </div>

          <div className="flex items-center w-full gap-2 mt-6">
            <Button type="button" className="flex-1 bg-gray-100 hover:bg-gray-200 border border-gray-200 dark:border-[#505050] dark:bg-[#404040] dark:hover:bg-[#505050] py-3 rounded-lg shadow-sm disabled:opacity-50" buttonTextColor='text-gray-800 dark:text-gray-300' onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="button" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-3 flex items-center justify-center gap-2 disabled:opacity-50 min-w-[100px] shadow-sm" onClick={handleAddExercise} disabled={isLoading}>
              {isLoading && <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div>}
              <span>Salvar</span>
            </Button>
          </div>
        </form>
      </div>

      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      )}
    </div>
  )
}