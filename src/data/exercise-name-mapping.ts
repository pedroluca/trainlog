/**
 * Manual mapping between Portuguese exercise names and English keywords
 * to improve matching with Wger API exercises
 */

export const exerciseNameMapping: Record<string, string[]> = {
  // PEITO
  'supino-reto': ['bench press', 'barbell bench', 'flat bench'],
  'supino-inclinado': ['incline bench', 'incline press', 'incline barbell'],
  'supino-declinado': ['decline bench', 'decline press'],
  'crucifixo-reto': ['dumbbell fly', 'dumbbell flys', 'fly', 'flyes'],
  'crucifixo-inclinado': ['incline fly', 'incline dumbbell fly'],
  'flexao': ['push up', 'push-up', 'pushup'],
  'crossover': ['cable crossover', 'cable fly', 'crossover'],
  
  // COSTAS
  'barra-fixa': ['pull up', 'pull-up', 'pullup', 'chin up'],
  'remada-curvada': ['barbell row', 'bent over row', 'bent-over row'],
  'remada-unilateral': ['dumbbell row', 'one arm row', 'single arm row'],
  'puxada-frontal': ['lat pulldown', 'pulldown', 'front pulldown'],
  'levantamento-terra': ['deadlift', 'dead lift'],
  'pulldown': ['pulldown', 'lat pulldown'],
  'remada-baixa': ['seated row', 'cable row', 'low row'],
  'remada-alta': ['upright row', 'high row'],
  
  // OMBROS
  'desenvolvimento': ['shoulder press', 'overhead press', 'military press'],
  'desenvolvimento-arnold': ['arnold press', 'arnold shoulder'],
  'elevacao-lateral': ['lateral raise', 'side raise', 'dumbbell lateral'],
  'elevacao-frontal': ['front raise', 'front dumbbell'],
  'crucifixo-inverso': ['reverse fly', 'rear delt fly', 'bent over fly'],
  'remada-alta-ombro': ['upright row'],
  
  // BÍCEPS
  'rosca-direta': ['barbell curl', 'standing curl', 'bicep curl'],
  'rosca-alternada': ['alternating curl', 'dumbbell curl', 'alternate curl'],
  'rosca-martelo': ['hammer curl', 'neutral grip curl'],
  'rosca-concentrada': ['concentration curl', 'concentrated curl'],
  'rosca-scott': ['preacher curl', 'scott curl'],
  
  // TRÍCEPS
  'triceps-testa': ['skull crusher', 'lying tricep', 'french press'],
  'triceps-corda': ['rope pushdown', 'tricep pushdown', 'cable pushdown'],
  'mergulho': ['dip', 'tricep dip', 'parallel bar dip'],
  'triceps-coice': ['kickback', 'tricep kickback'],
  'frances': ['french press', 'overhead extension'],
  
  // PERNAS
  'agachamento': ['squat', 'back squat', 'barbell squat'],
  'leg-press': ['leg press'],
  'cadeira-extensora': ['leg extension', 'knee extension'],
  'cadeira-flexora': ['leg curl', 'hamstring curl', 'lying leg curl'],
  'afundo': ['lunge', 'walking lunge', 'forward lunge'],
  'stiff': ['stiff leg deadlift', 'romanian deadlift', 'rdl'],
  'agachamento-sumô': ['sumo squat'],
  
  // PANTURRILHA
  'panturrilha-em-pe': ['standing calf', 'calf raise standing'],
  'panturrilha-sentada': ['seated calf', 'calf raise seated'],
  
  // ABDÔMEN
  'abdominal': ['crunch', 'sit up', 'sit-up', 'abdominal'],
  'prancha': ['plank'],
  'elevacao-pernas': ['leg raise', 'hanging leg raise', 'lying leg raise'],
  'abdominal-bicicleta': ['bicycle crunch', 'bicycle'],
  'abdominal-canivete': ['jackknife', 'v-up'],
}

/**
 * Get English keywords for a Portuguese exercise ID
 */
export function getEnglishKeywords(exerciseId: string): string[] {
  return exerciseNameMapping[exerciseId] || []
}

/**
 * Check if a Wger exercise name matches any of the keywords
 */
export function matchesKeywords(wgerName: string, keywords: string[]): boolean {
  const lowerWgerName = wgerName.toLowerCase()
  return keywords.some(keyword => lowerWgerName.includes(keyword.toLowerCase()))
}

/**
 * Calculate match score between exercise and Wger exercise
 */
export function calculateMatchScore(exerciseId: string, wgerName: string): number {
  const keywords = getEnglishKeywords(exerciseId)
  if (keywords.length === 0) return 0
  
  const lowerWgerName = wgerName.toLowerCase()
  let score = 0
  
  for (const keyword of keywords) {
    if (lowerWgerName.includes(keyword.toLowerCase())) {
      // Exact phrase match gets higher score
      if (lowerWgerName === keyword.toLowerCase()) {
        score += 100
      } else if (lowerWgerName.startsWith(keyword.toLowerCase())) {
        score += 50
      } else {
        score += 10
      }
    }
  }
  
  return score
}
