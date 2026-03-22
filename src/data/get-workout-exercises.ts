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
  nota?: string
  usesProgressiveWeight?: boolean
  progressiveSets?: Array<{ reps: number; weight: number }>
}

export async function getWorkoutExercises(workoutId: string, exerciseOrder?: string[]): Promise<Exercicio[]> {
  const exercisesRef = collection(db, 'treinos', workoutId, 'exercicios')
  const querySnapshot = await getDocs(exercisesRef)
  
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
      lastDoneDate: data.lastDoneDate,
      nota: data.nota,
      usesProgressiveWeight: data.usesProgressiveWeight,
      progressiveSets: data.progressiveSets
    } as Exercicio
  })
  
  // Custom ordering based on array, fallback to alphabetical
  if (exerciseOrder && exerciseOrder.length > 0) {
    return exercises.sort((a, b) => {
      const indexA = exerciseOrder.indexOf(a.id)
      const indexB = exerciseOrder.indexOf(b.id)
      
      // Se ambos existem no array, ordena pelo array
      if (indexA !== -1 && indexB !== -1) return indexA - indexB
      // Se apenas A está no array, A vem primeiro
      if (indexA !== -1) return -1
      // Se apenas B está no array, B vem primeiro
      if (indexB !== -1) return 1
      // Se nenhum está no array, fallback alfabético 
      return a.titulo.localeCompare(b.titulo)
    })
  }

  // Fallback: Sort by title alphabetically in memory
  return exercises.sort((a, b) => a.titulo.localeCompare(b.titulo))
}