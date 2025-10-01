// Wger Exercise API - FREE, Open Source, includes images!
// Docs: https://wger.de/en/software/api
// No API key required!

// Fallback: Use a placeholder image if API fails
export function getPlaceholderImage(musculoGrupo: string): string {
  const placeholders: Record<string, string> = {
    'Peito': 'https://via.placeholder.com/150/27AE60/FFFFFF?text=Peito',
    'Costas': 'https://via.placeholder.com/150/3498DB/FFFFFF?text=Costas',
    'Ombros': 'https://via.placeholder.com/150/E74C3C/FFFFFF?text=Ombros',
    'Bíceps': 'https://via.placeholder.com/150/F39C12/FFFFFF?text=Biceps',
    'Tríceps': 'https://via.placeholder.com/150/9B59B6/FFFFFF?text=Triceps',
    'Pernas': 'https://via.placeholder.com/150/1ABC9C/FFFFFF?text=Pernas',
    'Abdômen': 'https://via.placeholder.com/150/E67E22/FFFFFF?text=Abdomen',
  }
  
  return placeholders[musculoGrupo] || 'https://via.placeholder.com/150/95A5A6/FFFFFF?text=Exercise'
}
