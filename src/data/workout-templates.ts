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
    id: '8ljBR0ocfUkxhoWEY2kk-IIbUcDeq32Swfqfg5h9h8KL8iC63',
    nome: 'Push A - Peito Foco',
    descricao: 'Treino de empurrão focado em peito, ombros e tríceps',
    categoria: 'push_pull_legs',
    icon: '💪'
  },
  {
    id: 'AFWuEBYjgTVBIRdLAKMw-IIbUcDeq32Swfqfg5h9h8KL8iC63',
    nome: 'Pull A - Costas Completo',
    descricao: 'Treino de puxada focado em costas e bíceps',
    categoria: 'push_pull_legs',
    icon: '🔙'
  },
  {
    id: 'C71ZYmqHqzlZ8ShHZZkD-IIbUcDeq32Swfqfg5h9h8KL8iC63',
    nome: 'Legs A - Completo',
    descricao: 'Treino de pernas completo com foco em quadríceps e posteriores',
    categoria: 'push_pull_legs',
    icon: '🦵'
  },
  {
    id: 'pDJG7caKrhSCvFqABWpo-IIbUcDeq32Swfqfg5h9h8KL8iC63',
    nome: 'Upper Body A',
    descricao: 'Treino de superiores - peito, costas e ombros',
    categoria: 'upper_lower',
    icon: '🏋️'
  },
  {
    id: 'NZd0ZOWmPx0rdgE0fVU0-IIbUcDeq32Swfqfg5h9h8KL8iC63',
    nome: 'Lower Body A',
    descricao: 'Treino de inferiores - pernas e glúteos completo',
    categoria: 'upper_lower',
    icon: '🏃'
  },
  {
    id: 'vImy9uIt9WEJjHY6d1Ek-IIbUcDeq32Swfqfg5h9h8KL8iC63',
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
