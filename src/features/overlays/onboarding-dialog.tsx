import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { onboardingSteps } from '../../data/onboarding'
import { cn } from '../../utils/cn'
import { contentIcon } from './content-icons'

type Props = {
  open: boolean
  isPremium: boolean
  onComplete: () => void
}

/** Passo a passo da primeira entrada (mesmo desenho do app nativo) */
export function OnboardingDialog({ open, isPremium, onComplete }: Props) {
  const steps = useMemo(() => onboardingSteps.filter(step => !step.premiumOnly || !isPremium), [isPremium])
  const [index, setIndex] = useState(0)
  const step = steps[index]
  const isLast = index === steps.length - 1
  const Icon = contentIcon(step.id)

  return (
    <Dialog open={open} label="Bem-vindo ao Tractus">
      <div className="flex flex-col gap-5">
        <div className="-mr-2 -mt-2 flex justify-end">
          <Button label="Pular" variant="ghost" size="sm" onClick={onComplete} />
        </div>
        <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-center">
          <div className="mb-1 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon size={30} aria-hidden />
          </div>
          <h2 className="type-title">{step.title}</h2>
          <p className="text-sm leading-5 text-muted">{step.description}</p>
        </div>
        <div className="flex justify-center gap-1.5" aria-label={`Passo ${index + 1} de ${steps.length}`}>
          {steps.map((item, dotIndex) => (
            <span key={item.id} className={cn('h-1.5 rounded-full transition-all', dotIndex === index ? 'w-5 bg-primary' : 'w-1.5 bg-surface-3')} />
          ))}
        </div>
        <div className="flex gap-2">
          {index > 0 && <Button label="Voltar" icon={ChevronLeft} variant="secondary" onClick={() => setIndex(value => value - 1)} />}
          <Button
            label={isLast ? 'Começar a treinar' : 'Próximo'}
            icon={isLast ? undefined : ChevronRight}
            className="flex-1"
            onClick={() => (isLast ? onComplete() : setIndex(value => value + 1))}
          />
        </div>
      </div>
    </Dialog>
  )
}
