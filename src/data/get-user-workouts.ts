import { db } from '../firebaseConfig'
import { collection, query, where, getDocs } from 'firebase/firestore'

export interface Treino {
  id: string
  dia: string
  musculo: string
  usuarioID: string
  createdByUserId?: string
  isTemplate?: boolean // Optional flag to mark template workouts
  exerciseOrder?: string[] // Ordem customizada dos IDs dos exercícios
}

type GetUserWorkoutsOptions = {
  createdByUserId?: string
}

export async function getUserWorkouts(usuarioID: string, options?: GetUserWorkoutsOptions): Promise<Treino[]> {
  const q = query(collection(db, 'treinos'), where('usuarioID', '==', usuarioID))
  const querySnapshot = await getDocs(q)
  const workouts = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Treino[]
  
  // Filter out templates (only show regular workouts)
  const nonTemplate = workouts.filter(workout => !workout.isTemplate)

  if (options?.createdByUserId) {
    return nonTemplate.filter(workout => (workout.createdByUserId || workout.usuarioID) === options.createdByUserId)
  }

  return nonTemplate
}