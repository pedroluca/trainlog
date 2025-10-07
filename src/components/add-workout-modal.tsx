import { useState } from 'react'
import { doc, getDoc, collection, addDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { Button } from './button'
import { X, BookOpen } from 'lucide-react'
import { workoutTemplates, templateCategories, type WorkoutTemplate } from '../data/workout-templates'

type AddWorkoutModalProps = {
  onClose: () => void
  currentDay: string
  usuarioID: string | null
}

export function AddWorkoutModal({ onClose, currentDay, usuarioID }: AddWorkoutModalProps) {
  const [muscleGroup, setMuscleGroup] = useState('')
  const [sharedWorkoutId, setSharedWorkoutId] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'push_pull_legs' | 'upper_lower' | 'full_body'>('all')

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

  const handleAddSharedWorkout = async (workoutIdCode?: string) => {
    const codeToUse = workoutIdCode || sharedWorkoutId
    if (!usuarioID || !codeToUse) return
    try {
      // Divide o código de compartilhamento em [id do treino] e [id do usuário dono]
      const [workoutId, ownerId] = codeToUse.split('-')
  
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
  
      alert(workoutIdCode ? 'Treino modelo adicionado com sucesso!' : 'Treino compartilhado adicionado com sucesso!')
      onClose()
    } catch (err) {
      console.error('Erro ao adicionar treino compartilhado:', err)
      alert('Erro ao adicionar treino compartilhado.')
    }
  }

  const handleSelectTemplate = (template: WorkoutTemplate) => {
    handleAddSharedWorkout(template.id)
  }

  const filteredTemplates = selectedCategory === 'all' 
    ? workoutTemplates 
    : workoutTemplates.filter(t => t.categoria === selectedCategory)

  if (showTemplates) {
    return (
      <div className="fixed inset-0 z-61 bg-[rgba(0,0,0,0.5)] dark:bg-[rgba(0,0,0,0.7)] flex items-center justify-center px-4">
        <div className="bg-white dark:bg-[#2d2d2d] dark:border dark:border-[#404040] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 dark:text-gray-100">
            <BookOpen size={28} />
            Modelos de Treino
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">Escolha um modelo pronto para começar</p>

          {/* Category Filter */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-[#27AE60] text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todos
            </button>
            {templateCategories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-[#27AE60] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          {/* Template Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="border-2 border-gray-200 dark:border-[#404040] dark:bg-[#1a1a1a] rounded-lg p-4 hover:border-[#27AE60] transition-all cursor-pointer hover:shadow-md"
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{template.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">{template.nome}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{template.descricao}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Nenhum modelo encontrado nesta categoria.
            </p>
          )}

          {/* Back Button */}
          <div className="flex gap-2 mt-6">
            <Button
              type="button"
              className="w-full bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
              buttonTextColor="text-gray-800 dark:text-gray-300"
              onClick={() => setShowTemplates(false)}
            >
              ← Voltar
            </Button>
          </div>

          <Button
            type="button"
            className="bg-transparent hover:bg-transparent absolute top-2 right-2 rounded-full p-1"
            buttonTextColor='text-gray-700 dark:text-gray-300'
            onClick={onClose}
          >
            <X />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-60 bg-[rgba(0,0,0,0.5)] dark:bg-[rgba(0,0,0,0.7)] flex items-center justify-center px-4">
      <div className="bg-white dark:bg-[#2d2d2d] dark:border dark:border-[#404040] rounded-lg p-6 w-[100%] max-w-md relative">
        <h2 className="text-xl font-bold mb-4 dark:text-gray-100">Adicione um Treino</h2>
        
        <h3 className="text-lg font-bold mb-4 dark:text-gray-100">Escolha um modelo pronto:</h3>
        {/* Browse Templates Button */}
        <Button
          type="button"
          className="w-full text-white mb-6 flex items-center justify-center gap-2"
          bgColor='bg-[#27AE60] hover:bg-[#229954]'
          onClick={() => setShowTemplates(true)}
        >
          <BookOpen size={20} />
          Modelos
        </Button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-[#404040]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white dark:bg-[#2d2d2d] px-2 text-gray-500 dark:text-gray-400">ou</span>
          </div>
        </div>

        <h3 className="text-lg font-bold mb-4 dark:text-gray-100">Crie um do zero:</h3>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Grupo Muscular:</label>
          <input
            type="text"
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
            className="w-full border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100"
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
        
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-[#404040]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white dark:bg-[#2d2d2d] px-2 text-gray-500 dark:text-gray-400">ou</span>
          </div>
        </div>

        <h3 className="text-lg font-bold mb-4 dark:text-gray-100">Adicione um treino compartilhado:</h3>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Código de compartilhamento:</label>
          <input
            type="text"
            value={sharedWorkoutId}
            onChange={(e) => setSharedWorkoutId(e.target.value)}
            className="w-full border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100"
            placeholder='Ex: 1a2b3c4d5f6g'
          />
        </div>
        <div className="flex w-full">
          <Button
            type="button"
            className="text-white w-full"
            bgColor='bg-[#F1C40F] hover:bg-[#D4AC0D]'
            onClick={() => handleAddSharedWorkout()}
          >
            Adicionar
          </Button>
        </div>
        
        <Button
          type="button"
          className="bg-transparent hover:bg-transparent absolute top-2 right-2 rounded-full p-1"
          buttonTextColor='text-gray-700 dark:text-gray-300'
          onClick={onClose}
        >
          <X />
        </Button>
      </div>
    </div>
  )
}