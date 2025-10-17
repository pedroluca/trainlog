import { db } from '../firebaseConfig'
import { collection, getDocs } from 'firebase/firestore'

export interface Exercicio {
  id: string
  titulo: string
  series: number
  repeticoes: number
  peso: number
  tempoIntervalo: number
  isFeito: boolean
  lastDoneDate?: string
}

export async function getWorkoutExercises(workoutId: string): Promise<Exercicio[]> {
  const exercisesRef = collection(db, 'treinos', workoutId, 'exercicios')
  const querySnapshot = await getDocs(exercisesRef)
  
  // Sort in memory instead of using Firestore orderBy to avoid index requirement
  const exercises = querySnapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      titulo: data.titulo,
      series: data.series,
      repeticoes: data.repeticoes,
      peso: data.peso,
      tempoIntervalo: data.tempoIntervalo,
      isFeito: data.isFeito,
      lastDoneDate: data.lastDoneDate
    } as Exercicio
  })
  
  // Sort by title alphabetically in memory
  return exercises.sort((a, b) => a.titulo.localeCompare(b.titulo))
}