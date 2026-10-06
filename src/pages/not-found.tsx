import { ArrowLeft, Dumbbell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonClasses } from '../components/ui/button'

export function NotFound() {
  const home = localStorage.getItem('usuarioId') ? '/train' : '/'

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Dumbbell size={30} aria-hidden />
        </span>
        <p className="type-overline text-subtle">Erro 404</p>
        <h1 className="type-title">Página não encontrada</h1>
        <p className="text-sm leading-5 text-muted">Parece que você se perdeu na academia. Essa página não está na sua ficha de hoje.</p>
        <Link to={home} replace className={buttonClasses({ size: 'lg', fullWidth: true, className: 'mt-4' })}>
          <ArrowLeft size={20} aria-hidden />
          Voltar para o início
        </Link>
      </div>
    </main>
  )
}
