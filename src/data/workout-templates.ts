// Predefined workout templates
// These are workout IDs from actual workouts in your Firestore that can be cloned
// Format: "workoutId-userId"

export type WorkoutTemplate = {
  id: string // The sharing code (workoutId-userId)
  nome: string
  descricao: string
  categoria: 'push_pull_legs' | 'upper_lower' | 'full_body'
  icon: string
}

export const workoutTemplates: WorkoutTemplate[] = [
  {
    id: 'TEMPLATE_PUSH_001-system', // Replace with actual workout ID after creating in Firestore
    nome: 'Push A - Peito Foco',
    descricao: 'Treino de empurrão focado em peito, ombros e tríceps',
    categoria: 'push_pull_legs',
    icon: '💪'
  },
  {
    id: 'TEMPLATE_PULL_001-system',
    nome: 'Pull A - Costas Completo',
    descricao: 'Treino de puxada focado em costas e bíceps',
    categoria: 'push_pull_legs',
    icon: '🔙'
  },
  {
    id: 'TEMPLATE_LEGS_001-system',
    nome: 'Legs A - Completo',
    descricao: 'Treino de pernas completo com foco em quadríceps e posteriores',
    categoria: 'push_pull_legs',
    icon: '🦵'
  },
  {
    id: 'TEMPLATE_UPPER_001-system',
    nome: 'Upper Body A',
    descricao: 'Treino de superiores - peito, costas e ombros',
    categoria: 'upper_lower',
    icon: '🏋️'
  },
  {
    id: 'TEMPLATE_LOWER_001-system',
    nome: 'Lower Body A',
    descricao: 'Treino de inferiores - pernas e glúteos completo',
    categoria: 'upper_lower',
    icon: '🏃'
  },
  {
    id: 'TEMPLATE_FULL_001-system',
    nome: 'Full Body Iniciante',
    descricao: 'Treino de corpo inteiro para iniciantes',
    categoria: 'full_body',
    icon: '⚡'
  },
]

// Helper to get templates by category
export const getTemplatesByCategory = (categoria: WorkoutTemplate['categoria']) => {
  return workoutTemplates.filter(template => template.categoria === categoria)
}

// All categories
export const templateCategories = [
  { value: 'push_pull_legs', label: 'Push/Pull/Legs', emoji: '💪' },
  { value: 'upper_lower', label: 'Upper/Lower', emoji: '🔀' },
  { value: 'full_body', label: 'Full Body', emoji: '⚡' },
] as const
