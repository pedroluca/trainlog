import { db } from '../firebaseConfig'
import { collection, addDoc } from 'firebase/firestore'

export async function addWorkout(usuarioID: string, dia: string, musculo: string) {
  try {
    const docRef = await addDoc(collection(db, 'treinos'), {
      usuarioID,
      dia, // Exemplo: "2024-03-31"
      musculo // Exemplo: "Peito e Tríceps"
    })
    console.log('Treino adicionado com ID:', docRef.id)
  } catch (error) {
    console.error('Erro ao adicionar treino:', error)
  }
}
