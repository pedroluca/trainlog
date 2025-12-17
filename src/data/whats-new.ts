// What's New - Release Notes Configuration
// Add new features here for each version

export type WhatsNewItem = {
  id: string
  icon: string // Emoji or icon
  title: string
  description: string
  action?: {
    label: string
    route: string // Route to navigate when clicked
  }
}

export type WhatsNewRelease = {
  version: string
  date: string // YYYY-MM-DD
  title: string
  items: WhatsNewItem[]
}

// Current release notes (shown to users)
export const currentRelease: WhatsNewRelease = {
  version: '1.15.0',
  date: '2025-11-03',
  title: 'Novidades da Versão 1.15.0',
  items: [
    {
      id: 'progressive-weight',
      icon: '📈',
      title: 'Peso Progressivo (Séries Piramidais)',
      description: 'Configure cada série com peso e repetições diferentes! Perfeito para treinos piramidais (ex: Série 1: 15 reps × 15kg, Série 2: 13 reps × 17kg, Série 3: 10 reps × 20kg)',
      action: {
        label: 'Adicionar Exercício',
        route: '/training'
      }
    },
    {
      id: 'exercise-notes',
      icon: '📝',
      title: 'Notas nos Exercícios',
      description: 'Adicione notas personalizadas em cada exercício! Anote lembretes sobre forma, técnica ou qualquer observação importante',
      action: {
        label: 'Ver Treinos',
        route: '/training'
      }
    },
    {
      id: 'workout-streak',
      icon: '🔥',
      title: 'Sequência de Treinos (Streak)',
      description: 'Mantenha sua motivação! Acompanhe sua sequência de dias consecutivos de treino',
      action: {
        label: 'Ver no Perfil',
        route: '/profile'
      }
    },
    {
      id: 'premium-calendar',
      icon: '📅',
      title: 'Calendário de Treinos Premium',
      description: 'Visualize todo seu histórico de treinos em um calendário mensal interativo (exclusivo para usuários premium)',
      action: {
        label: 'Ver Calendário',
        route: '/profile/streak-calendar'
      }
    }
  ]
}

// Historical releases (for reference)
export const releaseHistory: WhatsNewRelease[] = [
  currentRelease,
  {
    version: '1.12.1',
    date: '2025-10-08',
    title: 'Novidades da Versão 1.12.1',
    items: [
      {
        id: 'new-interface',
        icon: '✨',
        title: 'Nova Interface',
        description: 'Interface completamente redesenhada com melhor experiência de uso'
      },
      {
        id: 'workout-streak',
        icon: '🔥',
        title: 'Sequência de Treinos (Streak)',
        description: 'Mantenha sua motivação! Agora você pode acompanhar sua sequência de dias consecutivos de treino',
        action: {
          label: 'Ver no Perfil',
          route: '/profile'
        }
      },
      {
        id: 'dark-mode',
        icon: '🌙',
        title: 'Modo Escuro',
        description: 'Ative o modo escuro nas configurações para uma experiência mais confortável à noite',
        action: {
          label: 'Ir para Configurações',
          route: '/profile/settings'
        }
      },
      {
        id: 'premium-calendar',
        icon: '📅',
        title: 'Calendário de Treinos Premium',
        description: 'Visualize todo seu histórico de treinos em um calendário mensal interativo (exclusivo para usuários premium)',
        action: {
          label: 'Ver Calendário',
          route: '/profile/streak-calendar'
        }
      }
    ]
  },
  {
    version: '1.10.1',
    date: '2025-10-06',
    title: 'Novidades da Versão 1.10.1',
    items: [
      {
        id: 'dark-mode',
        icon: '🌙',
        title: 'Modo Escuro',
        description: 'Ative o modo escuro nas configurações para uma experiência mais confortável à noite',
        action: {
          label: 'Ir para Configurações',
          route: '/settings'
        }
      },
      {
        id: 'audio-notification',
        icon: '🔔',
        title: 'Apito ao Finalizar Intervalo',
        description: 'Configure notificações sonoras quando o tempo de descanso terminar',
        action: {
          label: 'Configurar',
          route: '/profile/settings'
        }
      },
      {
        id: 'new-interface',
        icon: '✨',
        title: 'Nova Interface',
        description: 'Interface completamente redesenhada com melhor experiência de uso'
      },
      {
        id: 'progress-tab',
        icon: '📈',
        title: 'Aba de Progresso',
        description: 'Acompanhe sua evolução com gráficos e estatísticas detalhadas dos seus treinos'
      }
    ]
  }
]