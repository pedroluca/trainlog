import { useState, useEffect } from 'react'
import { X, Search, Dumbbell } from 'lucide-react'
import { searchExercises, getMuscleGroups, type Exercise, type MuscleGroup } from '../data/exercise-library'
import { getExercisesByMuscleGroup, getExerciseImageUrl, getExerciseName, type WgerExercise } from '../data/wger-api'
import { getPlaceholderImage } from '../data/exercisedb-api'
import { calculateMatchScore } from '../data/exercise-name-mapping'
import { Button } from './button'

type ExerciseLibraryModalProps = {
  onClose: () => void
  onSelectExercise: (exercise: Exercise) => void
}

export function ExerciseLibraryModal({ onClose, onSelectExercise }: ExerciseLibraryModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'all'>('all')
  const [exerciseImages, setExerciseImages] = useState<Record<string, string>>({})
  const [loadingImages, setLoadingImages] = useState(false)
  const [wgerCache, setWgerCache] = useState<Record<string, WgerExercise[]>>({})
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false)
  
  const muscleGroups = getMuscleGroups()
  
  // Filter exercises
  const searchResults = searchExercises(searchQuery)
  const filteredExercises = selectedMuscle === 'all' 
    ? searchResults 
    : searchResults.filter(ex => ex.musculos.includes(selectedMuscle))

  // Fetch Wger exercises ONCE when modal opens (for all muscle groups)
  useEffect(() => {
    if (hasFetchedInitial) return

    const fetchAllWgerData = async () => {
      setLoadingImages(true)
      console.log(`🎯 Initial fetch: Loading Wger data for all muscle groups...`)
      
      // Get all unique muscle groups from the library
      const allExercises = searchExercises('')
      const allMuscles = [...new Set(allExercises.map(ex => ex.musculos[0]))]
      
      console.log(`📚 Muscle groups to fetch: ${allMuscles.join(', ')}`)
      
      // Fetch each muscle group
      for (const muscle of allMuscles) {
        try {
          const wgerExercises = await getExercisesByMuscleGroup(muscle)
          setWgerCache(prev => ({ ...prev, [muscle]: wgerExercises }))
          console.log(`✅ Cached ${wgerExercises.length} exercises for ${muscle}`)
          
          // Small delay between muscle groups to be respectful
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (error) {
          console.error(`❌ Error fetching ${muscle}:`, error)
        }
      }
      
      setHasFetchedInitial(true)
      setLoadingImages(false)
      console.log(`✨ All Wger data cached!`)
    }

    fetchAllWgerData()
  }, [hasFetchedInitial])

  // Match exercises with Wger images
  useEffect(() => {
    if (Object.keys(wgerCache).length === 0) return

    console.log(`🔍 Starting image matching for ${filteredExercises.length} exercises`)

    const newImages: Record<string, string> = {}
    
    // Process ALL filtered exercises, not just first 30
    for (const exercise of filteredExercises) {
      // Skip if already has image (unless it's a placeholder)
      if (exerciseImages[exercise.id] && !exerciseImages[exercise.id].includes('placeholder')) {
        continue
      }
      
      const muscleGroup = exercise.musculos[0]
      const wgerExercises = wgerCache[muscleGroup] || []
      
      if (wgerExercises.length === 0) {
        console.warn(`⚠️ No Wger exercises with images for ${muscleGroup}, using placeholder`)
        newImages[exercise.id] = getPlaceholderImage(muscleGroup)
        continue
      }
      
      // Try to find matching exercise using the manual mapping
      let bestMatch = null
      let bestScore = 0
      
      for (const wgerEx of wgerExercises) {
        if (!wgerEx.images || wgerEx.images.length === 0) continue
        
        const wgerName = getExerciseName(wgerEx)
        const score = calculateMatchScore(exercise.id, wgerName)
        
        if (score > bestScore) {
          bestScore = score
          bestMatch = wgerEx
        }
      }
      
      // Only use match if score is good enough (at least 10 points)
      if (bestMatch && bestScore >= 10) {
        const imageUrl = getExerciseImageUrl(bestMatch)
        newImages[exercise.id] = imageUrl || getPlaceholderImage(muscleGroup)
        
        if (imageUrl) {
          console.log(`🖼️ "${exercise.nome}" → "${getExerciseName(bestMatch)}" (score: ${bestScore})`)
        } else {
          console.warn(`⚠️ "${exercise.nome}" matched to "${getExerciseName(bestMatch)}" but image extraction failed`)
          newImages[exercise.id] = getPlaceholderImage(muscleGroup)
        }
      } else {
        // Use placeholder if no good match
        console.warn(`⚠️ No good match for "${exercise.nome}" (best score: ${bestScore}), using placeholder`)
        newImages[exercise.id] = getPlaceholderImage(muscleGroup)
      }
    }
    
    if (Object.keys(newImages).length > 0) {
      setExerciseImages(prev => ({ ...prev, ...newImages }))
      console.log(`✨ Matched ${Object.keys(newImages).length} exercises with images`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wgerCache, filteredExercises.length])

  const handleSelectExercise = (exercise: Exercise) => {
    // Add image URL to exercise before passing it back
    const exerciseWithImage = {
      ...exercise,
      imagemUrl: exerciseImages[exercise.id] || getPlaceholderImage(exercise.musculos[0])
    }
    onSelectExercise(exerciseWithImage)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-61 bg-[rgba(0,0,0,0.5)] flex items-center justify-center px-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Dumbbell size={28} />
            Biblioteca de Exercícios
          </h2>
          <p className="text-gray-600 text-sm">Selecione um exercício para adicionar ao treino</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, músculo ou equipamento..."
            className="w-full border-2 border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#27AE60] focus:border-transparent"
            autoFocus
          />
        </div>

        {/* Muscle Group Filter */}
        <div className="mb-4 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            <button
              onClick={() => setSelectedMuscle('all')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedMuscle === 'all'
                  ? 'bg-[#27AE60] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {muscleGroups.map((muscle) => (
              <button
                key={muscle}
                onClick={() => setSelectedMuscle(muscle)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedMuscle === muscle
                    ? 'bg-[#27AE60] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {muscle}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto">
          {loadingImages && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#27AE60]"></div>
            </div>
          )}
          {filteredExercises.length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum exercício encontrado</p>
              <p className="text-gray-400 text-sm mt-2">Tente outro termo de busca</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredExercises.map((exercise) => {
                const imageUrl = exerciseImages[exercise.id] || getPlaceholderImage(exercise.musculos[0])
                
                return (
                  <button
                    key={exercise.id}
                    onClick={() => handleSelectExercise(exercise)}
                    className="text-left border-2 border-gray-200 rounded-lg overflow-hidden hover:border-[#27AE60] hover:bg-green-50 transition-all group"
                  >
                    {/* Exercise Image */}
                    <div className="w-full h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                      <img 
                        src={imageUrl} 
                        alt={exercise.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>

                    {/* Exercise Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-800 group-hover:text-[#27AE60] transition-colors">
                          {exercise.nome}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2 ${
                          exercise.dificuldade === 'Iniciante' 
                            ? 'bg-green-100 text-green-700'
                            : exercise.dificuldade === 'Intermediário'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {exercise.dificuldade}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-2">
                        {exercise.musculos.map((musculo, index) => (
                          <span
                            key={index}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                          >
                            {musculo}
                          </span>
                        ))}
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-1">
                        <strong>Equipamento:</strong> {exercise.equipamento}
                      </p>
                      
                      {exercise.instrucoes && (
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {exercise.instrucoes}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            {filteredExercises.length} exercício{filteredExercises.length !== 1 ? 's' : ''} encontrado{filteredExercises.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Close Button */}
        <Button
          type="button"
          className="bg-transparent hover:bg-transparent absolute top-2 right-2 rounded-full p-1"
          buttonTextColor="text-gray-700"
          onClick={onClose}
        >
          <X />
        </Button>
      </div>
    </div>
  )
}
