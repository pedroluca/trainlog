import { db } from '../firebaseConfig'
import { collection, addDoc } from 'firebase/firestore'

export async function addExercise(
  workoutId: string,
  titulo: string,
  series: number,
  repeticoes: number,
  peso: number,
  tempoIntervalo: number
) {
  try {
    await addDoc(collection(db, 'exercicios'), {
      workoutId,
      titulo, // Exemplo: "Supino reto"
      series, // Exemplo: 3
      repeticoes, // Exemplo: 10
      peso, // Exemplo: 40 (kg)
      tempoIntervalo, // Exemplo: 60 (segundos)
    })
  } catch (error) {
    console.error('Erro ao adicionar exercício:', error)
  }
}
