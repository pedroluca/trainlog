import { Link, Navigate } from 'react-router-dom'
import { buttonClasses } from '../components/ui/button'
import { BrandMark, FeatureList } from '../layouts/auth-layout'
import { getVersionWithPrefix } from '../version'

/** Boas-vindas (mesma tela do app). No desktop os recursos ficam no painel ao lado */
export function Home() {
  if (localStorage.getItem('usuarioId')) return <Navigate to="/train" replace />

  return (
    <div className="flex flex-1 flex-col justify-between gap-10 pt-6 lg:justify-center lg:pt-0">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 lg:hidden">
          <BrandMark />
          <div className="flex flex-col gap-2">
            <h1 className="type-display">Tractus</h1>
            <p className="text-base leading-6 text-muted">Organize seus treinos, registre cada série e acompanhe sua evolução.</p>
          </div>
        </div>
        <div className="lg:hidden">
          <FeatureList />
        </div>
        <div className="hidden flex-col gap-1.5 lg:flex">
          <h2 className="type-display">Pronto para evoluir?</h2>
          <p className="text-muted">Entre na sua conta ou crie uma grátis em menos de um minuto.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link to="/login" className={buttonClasses({ size: 'lg' })}>Entrar</Link>
        <Link to="/cadastro" className={buttonClasses({ size: 'lg', variant: 'secondary' })}>Criar conta grátis</Link>
        <p className="mt-2 text-center text-xs text-subtle lg:hidden">{getVersionWithPrefix()}</p>
      </div>
    </div>
  )
}
