import { db } from '../firebaseConfig'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'

export interface Exercicio {
  id: string
  titulo: string
  series: number
  repeticoes: number
  peso: number
  tempoIntervalo: number
  isFeito: boolean
}

export async function getWorkoutExercises(workoutId: string): Promise<Exercicio[]> {
  const exercisesRef = collection(db, 'treinos', workoutId, 'exercicios')
  const exercisesQuery = query(exercisesRef, orderBy('titulo', 'asc')) // Ordena pelo campo 'titulo' em ordem ascendente
  const querySnapshot = await getDocs(exercisesQuery)
  return querySnapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      titulo: data.titulo,
      series: data.series,
      repeticoes: data.repeticoes,
      peso: data.peso,
      tempoIntervalo: data.tempoIntervalo,
      isFeito: data.isFeito,
    } as Exercicio
  })
}