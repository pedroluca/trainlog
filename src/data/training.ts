import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '../firebaseConfig'
import type { Treino } from './get-user-workouts'
import type { Exercicio } from './get-workout-exercises'

// Mesmas operações do app nativo (tractus-app/src/data/workouts.ts), com leitura em tempo real:
// a tela reflete o Firestore e as escritas locais aparecem na hora, mesmo offline.

const exercisesRef = (workoutId: string) => collection(db, 'treinos', workoutId, 'exercicios')
const exerciseRef = (workoutId: string, exerciseId: string) => doc(db, 'treinos', workoutId, 'exercicios', exerciseId)

export function mapExercise(snapshot: QueryDocumentSnapshot<DocumentData>): Exercicio {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    titulo: data.titulo ?? '',
    series: Number(data.series) || 0,
    repeticoes: Number(data.repeticoes) || 0,
    peso: Number(data.peso) || 0,
    tempoIntervalo: Number(data.tempoIntervalo) || 0,
    isFeito: data.isFeito === true,
    isSkipped: data.isSkipped === true,
    lastDoneDate: data.lastDoneDate,
    nota: data.nota,
    usesProgressiveWeight: data.usesProgressiveWeight === true,
    progressiveSets: Array.isArray(data.progressiveSets) ? data.progressiveSets : undefined,
    setsDone: typeof data.setsDone === 'number' ? data.setsDone : 0,
    restEndsAt: typeof data.restEndsAt === 'number' ? data.restEndsAt : null,
  }
}

/** Ordem salva no treino; exercícios fora dela vão para o fim, em ordem alfabética */
export function sortExercises(exercises: Exercicio[], order?: string[]) {
  const position = (id: string) => {
    const index = order?.indexOf(id) ?? -1
    return index === -1 ? Number.MAX_SAFE_INTEGER : index
  }
  return [...exercises].sort((a, b) => position(a.id) - position(b.id) || a.titulo.localeCompare(b.titulo))
}

/** Treinos do usuário (sem os modelos) em tempo real */
export function subscribeUserWorkouts(userId: string, onChange: (workouts: Treino[]) => void, onError?: () => void) {
  return onSnapshot(
    query(collection(db, 'treinos'), where('usuarioID', '==', userId)),
    snapshot => onChange(
      snapshot.docs
        .map(workoutDoc => ({ id: workoutDoc.id, ...workoutDoc.data() }) as Treino)
        .filter(workout => !workout.isTemplate),
    ),
    error => {
      console.error('Erro ao assinar os treinos:', error)
      onError?.()
    },
  )
}

export function subscribeWorkoutExercises(workoutId: string, onChange: (exercises: Exercicio[]) => void, onError?: () => void) {
  return onSnapshot(
    exercisesRef(workoutId),
    snapshot => onChange(snapshot.docs.map(mapExercise)),
    error => {
      console.error('Erro ao assinar os exercícios:', error)
      onError?.()
    },
  )
}

/** Exclui o treino junto com os exercícios (antes os exercícios ficavam órfãos no Firestore) */
export async function deleteWorkoutWithExercises(workoutId: string) {
  const snapshot = await getDocs(exercisesRef(workoutId))
  const batch = writeBatch(db)
  snapshot.docs.forEach(exerciseDoc => batch.delete(exerciseDoc.ref))
  batch.delete(doc(db, 'treinos', workoutId))
  await batch.commit()
}

/** Zera o progresso de hoje de todos os exercícios do treino */
export async function resetWorkoutExercises(workoutId: string) {
  const snapshot = await getDocs(exercisesRef(workoutId))
  const batch = writeBatch(db)
  snapshot.docs.forEach(exerciseDoc => {
    batch.update(exerciseDoc.ref, { isFeito: false, isSkipped: false, setsDone: 0, restEndsAt: null })
  })
  await batch.commit()
}

export async function saveExerciseNote(workoutId: string, exerciseId: string, note: string) {
  await updateDoc(exerciseRef(workoutId, exerciseId), { nota: note.trim() ? note.trim() : deleteField() })
}

/** Salva a série atual e o fim do descanso; é o que permite retomar o timer depois de sair da página */
export function saveExerciseProgress(workoutId: string, exerciseId: string, setsDone: number, restEndsAt: number | null) {
  return updateDoc(exerciseRef(workoutId, exerciseId), { setsDone, restEndsAt })
}

/** Marca o exercício como feito (registrando no histórico, no mesmo lote) ou como pulado */
export function finishExercise({ workoutId, exercise, userId, skipped }: { workoutId: string; exercise: Exercicio; userId: string; skipped: boolean }) {
  const now = new Date().toISOString()
  const batch = writeBatch(db)

  batch.update(exerciseRef(workoutId, exercise.id), {
    isFeito: true,
    isSkipped: skipped,
    lastDoneDate: now,
    restEndsAt: null,
    ...(skipped ? {} : { setsDone: exercise.series }),
  })

  if (!skipped) {
    batch.set(doc(collection(db, 'logs')), {
      usuarioID: userId,
      titulo: exercise.titulo,
      series: exercise.series,
      repeticoes: exercise.repeticoes,
      peso: exercise.peso,
      usesProgressiveWeight: !!exercise.usesProgressiveWeight,
      progressiveSets: exercise.usesProgressiveWeight ? exercise.progressiveSets ?? [] : [],
      data: now,
    })
  }

  return batch.commit()
}

/** Volta o exercício para "não concluído" mantendo (ou zerando) as séries feitas */
export function reopenExercise(workoutId: string, exerciseId: string, setsDone: number) {
  return updateDoc(exerciseRef(workoutId, exerciseId), { isFeito: false, isSkipped: false, setsDone, restEndsAt: null })
}

// ─── Treinos ─────────────────────────────────────────────────────────────────

async function hasWorkoutOnDay(userId: string, day: string) {
  const snapshot = await getDocs(query(collection(db, 'treinos'), where('usuarioID', '==', userId), where('dia', '==', day)))
  return snapshot.docs.some(workoutDoc => !workoutDoc.data().isTemplate)
}

export class WorkoutDayTakenError extends Error {
  constructor() {
    super('Já existe um treino cadastrado para este dia.')
  }
}

export async function createWorkout(params: { userId: string; createdBy: string; day: string; name: string }) {
  if (await hasWorkoutOnDay(params.userId, params.day)) throw new WorkoutDayTakenError()

  const ref = doc(collection(db, 'treinos'))
  await setDoc(ref, {
    usuarioID: params.userId,
    createdByUserId: params.createdBy,
    dia: params.day,
    musculo: params.name.trim(),
    exerciseOrder: [],
  })
  return ref.id
}

export class InvalidShareCodeError extends Error {}

/** Código de compartilhamento = "{workoutId}-{donoId}" (o mesmo usado pelo app) */
export const buildShareCode = (workoutId: string, ownerId: string) => `${workoutId}-${ownerId}`

/** Copia um treino compartilhado (ou modelo) para o dia escolhido */
export async function cloneSharedWorkout(params: { code: string; userId: string; createdBy: string; day: string }) {
  const [sourceId, ownerId] = params.code.trim().split('-')
  if (!sourceId || !ownerId) throw new InvalidShareCodeError('Código de compartilhamento inválido.')

  if (await hasWorkoutOnDay(params.userId, params.day)) throw new WorkoutDayTakenError()

  const sourceSnap = await getDoc(doc(db, 'treinos', sourceId))
  if (!sourceSnap.exists() || sourceSnap.data()?.usuarioID !== ownerId) {
    throw new InvalidShareCodeError('Treino não encontrado ou sem permissão.')
  }

  const source = sourceSnap.data() as Treino
  const sourceExercises = sortExercises((await getDocs(exercisesRef(sourceId))).docs.map(mapExercise), source.exerciseOrder)

  const newWorkoutRef = doc(collection(db, 'treinos'))
  const exerciseRefs = sourceExercises.map(() => doc(exercisesRef(newWorkoutRef.id)))

  await setDoc(newWorkoutRef, {
    usuarioID: params.userId,
    createdByUserId: params.createdBy,
    dia: params.day,
    musculo: source.musculo,
    exerciseOrder: exerciseRefs.map(ref => ref.id),
  })

  // As regras validam o treino pai com get(), então os exercícios vão num segundo lote, depois do treino existir
  if (sourceExercises.length > 0) {
    const batch = writeBatch(db)
    sourceExercises.forEach((exercise, index) => {
      batch.set(exerciseRefs[index], buildExerciseData({
        titulo: exercise.titulo,
        series: exercise.series,
        repeticoes: exercise.repeticoes,
        peso: exercise.peso,
        tempoIntervalo: exercise.tempoIntervalo,
        usesProgressiveWeight: !!exercise.usesProgressiveWeight,
        progressiveSets: exercise.progressiveSets,
        nota: exercise.nota,
      }))
    })
    await batch.commit()
  }

  return { id: newWorkoutRef.id, name: source.musculo }
}

export async function updateWorkout(workoutId: string, data: Partial<Pick<Treino, 'dia' | 'musculo' | 'exerciseOrder'>>) {
  await updateDoc(doc(db, 'treinos', workoutId), data)
}

// ─── Exercícios ──────────────────────────────────────────────────────────────

export type ProgressiveSet = { reps: number; weight: number }

export type ExerciseInput = {
  titulo: string
  series: number
  repeticoes: number
  peso: number
  tempoIntervalo: number
  usesProgressiveWeight: boolean
  progressiveSets?: ProgressiveSet[]
  nota?: string
}

function buildExerciseData(input: ExerciseInput): DocumentData {
  const data: DocumentData = {
    titulo: input.titulo.trim(),
    series: input.series,
    repeticoes: input.repeticoes,
    peso: input.peso,
    tempoIntervalo: input.tempoIntervalo,
    usesProgressiveWeight: input.usesProgressiveWeight,
    isFeito: false,
    isSkipped: false,
    setsDone: 0,
    restEndsAt: null,
  }
  if (input.usesProgressiveWeight && input.progressiveSets?.length) data.progressiveSets = input.progressiveSets
  if (input.nota) data.nota = input.nota
  return data
}

// Escritas em lote sem depender de leituras: ficam na fila offline como uma operação só

export function addExercise(workoutId: string, input: ExerciseInput) {
  const ref = doc(exercisesRef(workoutId))
  const batch = writeBatch(db)
  batch.set(ref, buildExerciseData(input))
  batch.update(doc(db, 'treinos', workoutId), { exerciseOrder: arrayUnion(ref.id) })
  return batch.commit()
}

export async function updateExercise(workoutId: string, exerciseId: string, input: ExerciseInput) {
  await updateDoc(exerciseRef(workoutId, exerciseId), {
    titulo: input.titulo.trim(),
    series: input.series,
    repeticoes: input.repeticoes,
    peso: input.peso,
    tempoIntervalo: input.tempoIntervalo,
    usesProgressiveWeight: input.usesProgressiveWeight,
    progressiveSets: input.usesProgressiveWeight && input.progressiveSets?.length ? input.progressiveSets : deleteField(),
  })
}

export function deleteExercise(workoutId: string, exerciseId: string) {
  const batch = writeBatch(db)
  batch.delete(exerciseRef(workoutId, exerciseId))
  batch.update(doc(db, 'treinos', workoutId), { exerciseOrder: arrayRemove(exerciseId) })
  return batch.commit()
}
