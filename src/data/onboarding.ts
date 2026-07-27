// Onboarding - Steps shown to users on their first login
// Add/edit steps here to change the walkthrough new users see

export type OnboardingStep = {
  id: string
  icon: string
  title: string
  description: string
  /** Only shown to users who aren't Premium yet */
  premiumOnly?: boolean
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    icon: '👋',
    title: 'Bem-vindo ao Tractus!',
    description:
      'Seu companheiro para organizar treinos, registrar cada série e acompanhar sua evolução. Vamos te mostrar rapidinho como tudo funciona.',
  },
  {
    id: 'workouts',
    icon: '🏋️',
    title: 'Monte seus treinos por dia',
    description:
      'Na aba Treino, crie um treino para cada dia da semana e adicione os exercícios com séries, repetições e peso. Na hora de treinar, é só marcar o que você fez.',
  },
  {
    id: 'streak',
    icon: '🔥',
    title: 'Mantenha sua sequência',
    description:
      'Treine nos dias programados e acompanhe sua sequência (streak) de consistência. Perder um dia programado sem treinar quebra a sequência, então não vacile!',
  },
  {
    id: 'progress',
    icon: '📈',
    title: 'Acompanhe sua evolução',
    description:
      'Na aba Progresso, veja gráficos com a evolução da sua carga e desempenho em cada exercício ao longo do tempo.',
  },
  {
    id: 'friends',
    icon: '🤝',
    title: 'Treine acompanhado',
    description:
      'Adicione amigos para ver os treinos e conquistas deles, ou conecte-se como treinador e aluno para gerenciar treinos juntos.',
  },
  {
    id: 'premium',
    icon: '👑',
    title: 'Turbine com o Premium',
    description:
      'Desbloqueie o calendário de streaks, personalização de cores do app, métricas corporais avançadas, histórico completo dos amigos e o selo exclusivo no seu perfil.',
    premiumOnly: true,
  },
]
