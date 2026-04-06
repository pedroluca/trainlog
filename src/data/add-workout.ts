import { db } from '../firebaseConfig'
import { collection, addDoc } from 'firebase/firestore'

export async function addWorkout(usuarioID: string, dia: string, musculo: string) {
  try {
    await addDoc(collection(db, 'treinos'), {
      usuarioID,
      dia, // Exemplo: "2024-03-31"
      musculo // Exemplo: "Peito e Tríceps"
    })
  } catch (error) {
    console.error('Erro ao adicionar treino:', error)
  }
}
