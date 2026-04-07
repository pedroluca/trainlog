// What's New - Release Notes Configuration
// Add new features here for each version

export type WhatsNewItem = {
  id: string
  icon: string
  title: string
  description: string
  action?: {
    label: string
    route: string
  }
}

export type WhatsNewRelease = {
  version: string
  date: string // YYYY-MM-DD
  title: string
  items: WhatsNewItem[]
  /** Previous highlights shown below a divider (optional) */
  previousItems?: WhatsNewItem[]
}

// Current release notes (shown to users)
export const currentRelease: WhatsNewRelease = {
  version: '1.17.9',
  date: '2026-04-06',
  title: 'Novidades da Versão 1.17.9',
  items: [
    {
      id: 'badge-system',
      icon: '🏅',
      title: 'Sistema de Badges',
      description: 'Seu perfil agora exibe conquistas como Fundador, Premium, Treinador e Alpha User. Toque em qualquer badge para ver o que ela significa!',
      action: {
        label: 'Ver meu Perfil',
        route: '/profile'
      }
    }
  ],
  previousItems: [
    {
      id: 'trainer-student-flow',
      icon: '🧑‍🏫',
      title: 'Novo Fluxo Treinador/Aluno',
      description: 'Conecte-se como treinador ou aluno, envie solicitações com consentimento e gerencie treinos por vínculo.',
      action: {
        label: 'Abrir Treinador/Aluno',
        route: '/profile/connections'
      }
    },
    {
      id: 'friendships-kept',
      icon: '🤝',
      title: 'Amizades Mantidas',
      description: 'O sistema de amizade continua ativo com solicitações, perfil de amigos e privacidade.',
      action: {
        label: 'Ver Amigos',
        route: '/friends'
      }
    },
    {
      id: 'android-push-kept',
      icon: '📲',
      title: 'Push no Android Continua',
      description: 'As notificações push para Android permanecem ativas no app.'
    }
  ]
}

// Historical releases (for reference)
export const releaseHistory: WhatsNewRelease[] = [
  currentRelease,
  {
    version: '1.16.0',
    date: '2026-03-22',
    title: 'Novidades da Versão 1.16.0',
    items: [
      {
        id: 'friendships',
        icon: '🤝',
        title: 'Sistema de Amizades',
        description: 'Agora você pode adicionar amigos, ver as atividades e os treinos deles! Acompanhe o progresso de quem treina com você e mantenham a motivação juntos.',
        action: {
          label: 'Ver Amigos',
          route: '/friends'
        }
      },
      {
        id: 'friend-privacy',
        icon: '🔒',
        title: 'Sua Privacidade Importa',
        description: 'Você tem controle total sobre o que seus amigos podem ver. Acesse as Configurações para ocultar seu peso, altura, treinos ou atividades.',
        action: {
          label: 'Ver Configurações',
          route: '/profile/settings'
        }
      },
      {
        id: 'ui-scrollbars',
        icon: '🎨',
        title: 'Refinamentos na Interface',
        description: 'Melhoramos o design de vários componentes, como as barras de rolagem nos modais, para deixar o app cada vez mais bonito e fluido no seu uso diário.'
      }
    ]
  },
  {
    version: '1.15.5',
    date: '2026-03-21',
    title: 'Novidades da Versão 1.15.5',
    items: [
      {
        id: 'ui-improvements',
        icon: '✨',
        title: 'Novidade Visual',
        description: 'Aprimoramos o design do aplicativo nas telas de Perfil e Treino. Agora os grids foram refinados para dispositivos tablet e a experiência está ainda mais fluída e adaptável!',
        action: {
          label: 'Ver Perfil',
          route: '/profile'
        }
      },
      {
        id: 'streak-bugfix',
        icon: '🛠️',
        title: 'Correção no Contador de Sequência',
        description: 'Corrigimos um erro onde noites de virada ou a adição de novos exercícios no mesmo dia faziam você "perder" sua sequência diária (streak). Seu progresso agora está blindado contra fuso-horários independentemente de edições no final do dia!'
      },
      {
        id: 'progressive-weight',
        icon: '📈',
        title: 'Peso Progressivo (Lembrete)',
        description: 'Lembrando que na versão anterior trouxemos treinos piramidais para configurar cada série com peso diferente!',
        action: {
          label: 'Adicionar Caminho',
          route: '/training'
        }
      }
    ]
  },
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