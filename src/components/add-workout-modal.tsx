import { useState } from 'react'
import { doc, getDoc, collection, addDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { Button } from './button'
import { X } from 'lucide-react'

type AddWorkoutModalProps = {
  onClose: () => void
  currentDay: string
  usuarioID: string | null
}

export function AddWorkoutModal({ onClose, currentDay, usuarioID }: AddWorkoutModalProps) {
  const [muscleGroup, setMuscleGroup] = useState('')
  const [sharedWorkoutId, setSharedWorkoutId] = useState('')

  const handleAddWorkout = async () => {
    if (!usuarioID) return
    try {
      const workoutsRef = collection(db, 'treinos')
      await addDoc(workoutsRef, {
        usuarioID,
        dia: currentDay,
        musculo: muscleGroup,
      })
      onClose()
    } catch (err) {
      console.error('Erro ao adicionar treino:', err)
      alert('Erro ao adicionar treino.')
    }
  }

  const handleAddSharedWorkout = async () => {
    if (!usuarioID || !sharedWorkoutId) return
    try {
      // Divide o código de compartilhamento em [id do treino] e [id do usuário dono]
      const [workoutId, ownerId] = sharedWorkoutId.split('-')
  
      if (!workoutId || !ownerId) {
        alert('Código de compartilhamento inválido.')
        return
      }
  
      // Busca o treino compartilhado no banco de dados
      const workoutRef = doc(db, 'treinos', workoutId)
      const workoutDoc = await getDoc(workoutRef)
  
      if (!workoutDoc.exists() || workoutDoc.data()?.usuarioID !== ownerId) {
        alert('Treino compartilhado não encontrado ou você não tem permissão para acessá-lo.')
        return
      }
  
      const workoutData = workoutDoc.data()
      const newWorkoutRef = await addDoc(collection(db, 'treinos'), {
        usuarioID,
        dia: currentDay,
        musculo: workoutData.musculo,
      })
  
      // Copia os exercícios do treino compartilhado
      const exercisesRef = collection(db, 'treinos', workoutId, 'exercicios')
      const exercisesSnapshot = await getDocs(exercisesRef)
  
      const copyPromises = exercisesSnapshot.docs.map((exerciseDoc) =>
        addDoc(collection(db, 'treinos', newWorkoutRef.id, 'exercicios'), exerciseDoc.data())
      )
  
      await Promise.all(copyPromises)
  
      alert('Treino compartilhado adicionado com sucesso!')
      onClose()
    } catch (err) {
      console.error('Erro ao adicionar treino compartilhado:', err)
      alert('Erro ao adicionar treino compartilhado.')
    }
  }

  return (
    <div className="fixed inset-0 z-20 bg-[rgba(0,0,0,0.5)] flex items-center justify-center px-4">
      <div className="bg-white rounded-lg p-6 w-[100%] relative">
        <h2 className="text-xl font-bold mb-4">Criar um novo Treino</h2>
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">Grupo Muscular:</label>
          <input
            type="text"
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder='Ex: Costas e Bíceps'
          />
        </div>
        <div className="flex w-full mb-4">
          <Button
            type="button"
            className="bg-blue-500 hover:bg-blue-600 text-white w-full"
            onClick={handleAddWorkout}
            >
            Criar
          </Button>
        </div>
        <h2 className="text-xl font-bold mb-4 mt-8">Ou adicione um treino que foi compartilhado:</h2>
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">Código de compartilhamento:</label>
          <input
            type="text"
            value={sharedWorkoutId}
            onChange={(e) => setSharedWorkoutId(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder='Ex: 1a2b3c4d5f6g'
          />
        </div>
        <div className="flex w-full">
          <Button
            type="button"
            className="text-white w-full"
            bgColor='bg-[#F1C40F] hover:bg-[#D4AC0D]'
            onClick={handleAddSharedWorkout}
          >
            Adicionar treino compartilhado
          </Button>
        </div>
        
        <Button
          type="button"
          className="bg-transparent hover:bg-transparent absolute top-2 right-2 rounded-full p-1"
          buttonTextColor='text-gray-700'
          onClick={onClose}
        >
          <X />
        </Button>
      </div>
    </div>
  )
}