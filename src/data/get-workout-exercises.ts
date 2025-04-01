import { db } from '../firebaseConfig'
import { collection, getDocs } from 'firebase/firestore'

export interface Exercicio {
  id: string
  titulo: string
  series: number
  repeticoes: number
  peso: number
  tempoIntervalo: number
}

export async function getWorkoutExercises(workoutId: string): Promise<Exercicio[]> {
  const exercisesRef = collection(db, 'treinos', workoutId, 'exercicios')
  const querySnapshot = await getDocs(exercisesRef)
  return querySnapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      titulo: data.titulo,
      series: data.series,
      repeticoes: data.repeticoes,
      peso: data.peso,
      tempoIntervalo: data.tempoIntervalo,
    } as Exercicio
  })
}