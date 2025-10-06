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
        route: '/settings'
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

// Historical releases (for reference)
export const releaseHistory: WhatsNewRelease[] = [
  currentRelease,
  // Add previous versions here as you release new ones
  // {
  //   version: '1.2.0',
  //   date: '2025-09-15',
  //   title: 'Novidades da Versão 1.2.0',
  //   items: [...]
  // }
]
