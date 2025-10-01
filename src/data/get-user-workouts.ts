import { db } from '../firebaseConfig'
import { collection, query, where, getDocs } from 'firebase/firestore'

export interface Treino {
  id: string
  dia: string
  musculo: string
  usuarioID: string
  isTemplate?: boolean // Optional flag to mark template workouts
}

export async function getUserWorkouts(usuarioID: string): Promise<Treino[]> {
  const q = query(collection(db, 'treinos'), where('usuarioID', '==', usuarioID))
  const querySnapshot = await getDocs(q)
  const workouts = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Treino[]
  
  // Filter out templates (only show regular workouts)
  return workouts.filter(workout => !workout.isTemplate)
}