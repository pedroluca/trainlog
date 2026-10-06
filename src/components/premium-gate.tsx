import { Crown } from 'lucide-react'
import { useState } from 'react'
import { PremiumUpgrade } from './premium-upgrade'
import { Card } from './ui/card'
import { EmptyState } from './ui/misc'

/** Bloqueio das telas exclusivas, com o convite para o Premium */
export function PremiumGate({ title, description }: { title: string; description: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Card>
        <EmptyState icon={Crown} title={title} description={description} actionLabel="Conhecer o Premium" onAction={() => setOpen(true)} />
      </Card>
      <PremiumUpgrade open={open} onClose={() => setOpen(false)} />
    </>
  )
}
