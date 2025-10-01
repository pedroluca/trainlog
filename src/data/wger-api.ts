// Wger Exercise API - FREE, Open Source, includes images!
// Docs: https://wger.de/en/software/api
// No API key required!

const WGER_BASE_URL = 'https://wger.de/api/v2'

export interface WgerExercise {
  id: number
  uuid: string
  category: {
    id: number
    name: string
  }
  muscles: Array<{
    id: number
    name: string
    name_en: string
  }>
  muscles_secondary: Array<{
    id: number
    name: string
    name_en: string
  }>
  equipment: Array<{
    id: number
    name: string
  }>
  license: {
    id: number
    full_name: string
    short_name: string
    url: string
  }
  license_author: string
  images: Array<{
    id: number
    uuid: string
    exercise: number
    exercise_uuid: string
    image: string
    is_main: boolean
    style: string
    license: number
    license_author: string
  }>
  translations: Array<{
    id: number
    uuid: string
    name: string
    exercise: number
    description: string
    language: number
  }>
  videos: Array<{
    id: number
    uuid: string
    exercise: number
    exercise_uuid: string
    video: string
    is_main: boolean
  }>
}

// Helper function to get the exercise name from translations (prefer English - language 2)
export function getExerciseName(exercise: WgerExercise): string {
  if (!exercise.translations || exercise.translations.length === 0) {
    return `Exercise ${exercise.id}`
  }
  
  // Try to find English translation first (language = 2)
  const englishTranslation = exercise.translations.find(t => t.language === 2)
  if (englishTranslation) {
    return englishTranslation.name
  }
  
  // Fall back to first available translation
  return exercise.translations[0].name
}

// Mapping from Portuguese muscle groups to Wger categories
const musculoToWgerCategory: Record<string, number> = {
  'Peito': 11, // Chest
  'Costas': 12, // Back
  'Ombros': 13, // Shoulders
  'Bíceps': 8, // Arms
  'Tríceps': 8, // Arms
  'Pernas': 9, // Legs
  'Quadríceps': 10, // Legs
  'Posteriores': 9, // Legs
  'Glúteos': 9, // Legs
  'Panturrilha': 14, // Calves
  'Abdômen': 10, // Abs
  'Antebraço': 8 // Arms
}

export async function getExercisesByMuscleGroup(musculoGrupo: string): Promise<WgerExercise[]> {
  try {
    const categoryId = musculoToWgerCategory[musculoGrupo]
    
    if (!categoryId) {
      console.warn(`No category mapping for ${musculoGrupo}`)
      return []
    }

    console.log(`🔍 Fetching Wger exercises for: "${musculoGrupo}" (category ${categoryId})`)

    // Use exerciseinfo endpoint which includes images directly - increase limit to get more results
    const response = await fetch(
      `${WGER_BASE_URL}/exerciseinfo/?category=${categoryId}&language=2&limit=50`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    )

    if (!response.ok) {
      console.error('Wger API error:', response.status)
      return []
    }

    const data = await response.json()
    console.log(`✅ Found ${data.results.length} total exercises from Wger for ${musculoGrupo}`)
    
    // IMPORTANT: Filter to only return exercises that have images
    const exercisesWithImages = data.results.filter((ex: WgerExercise) => 
      ex.images && ex.images.length > 0
    )
    
    console.log(`🖼️ ${exercisesWithImages.length} exercises have images (${data.results.length - exercisesWithImages.length} without images filtered out)`)

    return exercisesWithImages
  } catch (error) {
    console.error('Error fetching exercises from Wger:', error)
    return []
  }
}

export function getExerciseImageUrl(exercise: WgerExercise): string | null {
  // Get the main image or first image available
  if (exercise.images && exercise.images.length > 0) {
    const mainImage = exercise.images.find(img => img.is_main)
    const image = mainImage || exercise.images[0]
    return image.image
  }
  return null
}

export function getExerciseVideoUrl(exercise: WgerExercise): string | null {
  // Get the main video or first video available
  if (exercise.videos && exercise.videos.length > 0) {
    const mainVideo = exercise.videos.find(vid => vid.is_main)
    const video = mainVideo || exercise.videos[0]
    return video.video
  }
  return null
}
