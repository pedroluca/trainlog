import { Outlet } from 'react-router-dom'
import { FloatingTabBar } from '../components/navigation/floating-tab-bar'
import { Sidebar } from '../components/navigation/sidebar'
import { CurrentUserProvider } from '../contexts/current-user-context'

/**
 * Estrutura das telas logadas: barra lateral no desktop e cápsula flutuante no celular.
 * Cada tela desenha o próprio cabeçalho (PageHeader nas abas, StackHeader nas telas internas).
 */
export function AppLayout() {
  return (
    <CurrentUserProvider>
      {/* Cobre a área da barra de status no PWA do iPhone (status bar translúcida) */}
      <div aria-hidden className="fixed inset-x-0 top-0 z-40 h-[env(safe-area-inset-top)] bg-background lg:hidden" />

      <Sidebar />
      <main className="min-h-dvh pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)_+_104px)] lg:pl-64 lg:pb-12">
        <Outlet />
      </main>
      <FloatingTabBar />
    </CurrentUserProvider>
  )
}
