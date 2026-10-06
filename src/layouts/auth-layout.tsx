import { CalendarCheck, Flame, LineChart, UsersRound, type LucideIcon } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import logo from '../assets/nova-logo-white.svg'
import { getVersionWithPrefix } from '../version'

export const WELCOME_FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: CalendarCheck, title: 'Treinos por dia da semana', description: 'Monte sua rotina e marque cada série na hora.' },
  { icon: Flame, title: 'Streak semanal', description: 'Mantenha a consistência treinando toda semana.' },
  { icon: LineChart, title: 'Evolução de carga', description: 'Veja seu progresso em cada exercício.' },
  { icon: UsersRound, title: 'Amigos e treinadores', description: 'Treine junto e receba treinos do seu personal.' },
]

export function BrandMark({ size = 64 }: { size?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-2xl bg-primary" style={{ width: size, height: size }}>
      <img src={logo} alt="Logo do Tractus" style={{ width: size * 0.62, height: size * 0.62 }} />
    </span>
  )
}

export function FeatureList() {
  return (
    <ul className="flex flex-col gap-5">
      {WELCOME_FEATURES.map(({ icon: Icon, title, description }) => (
        <li key={title} className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon size={20} aria-hidden />
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-base font-semibold">{title}</span>
            <span className="text-sm leading-5 text-muted">{description}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Telas sem login (boas-vindas, entrar, criar conta, redefinir senha).
 * No celular só o conteúdo, como no app; no desktop um painel da marca ao lado.
 */
export function AuthLayout() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between border-r border-border bg-surface px-12 py-12 lg:flex xl:px-20">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-5">
            <BrandMark />
            <div className="flex flex-col gap-2">
              <h1 className="type-display">Tractus</h1>
              <p className="max-w-sm text-base leading-6 text-muted">Organize seus treinos, registre cada série e acompanhe sua evolução.</p>
            </div>
          </div>
          <FeatureList />
        </div>
        <p className="text-xs text-subtle">
          {getVersionWithPrefix()} · Desenvolvido por{' '}
          <a href="https://pedroluca.dev.br" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Pedro Luca Prates</a>
        </p>
      </aside>

      <main className="flex min-h-dvh flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] lg:items-center lg:justify-center">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-6 lg:flex-none lg:py-12">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
