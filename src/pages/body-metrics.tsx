import { Activity, Minus, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { PremiumGate } from '../components/premium-gate'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { IconButton } from '../components/ui/icon-button'
import { Callout, EmptyState, LoadingState, StatTile } from '../components/ui/misc'
import { Page, SectionTitle, StackHeader } from '../components/ui/page'
import { WeightChart } from '../components/weight-chart'
import { useConfirm } from '../contexts/confirm-context'
import { useCurrentUser } from '../contexts/current-user-context'
import { useToast } from '../contexts/toast-context'
import { deleteMeasurement, getBmiCategory, subscribeMeasurements, type BodyMeasurement } from '../data/body-metrics'
import { MeasurementSheet } from '../features/profile/measurement-sheet'
import { formatDate, formatDecimal } from '../utils/format'

export function BodyMetrics() {
  const usuarioID = localStorage.getItem('usuarioId')
  const profile = useCurrentUser()
  const toast = useToast()
  const confirm = useConfirm()
  const isPremium = !!profile?.isPremium
  const [measurements, setMeasurements] = useState<BodyMeasurement[] | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!usuarioID || !isPremium) return
    return subscribeMeasurements(usuarioID, setMeasurements, () => setMeasurements([]))
  }, [usuarioID, isPremium])

  if (!usuarioID) return <Navigate to="/login" replace />

  const header = <StackHeader title="Métricas corporais" backTo="/profile" width="lg" />
  if (!profile) return <>{header}<LoadingState /></>
  if (!isPremium) {
    return (
      <>
        {header}
        <Page width="lg" className="pt-2">
          <PremiumGate title="Histórico exclusivo do Premium" description="Acompanhe a evolução do seu peso e IMC com gráfico e todas as medições." />
        </Page>
      </>
    )
  }
  if (!measurements) return <>{header}<LoadingState /></>

  const latest = measurements[0]
  const oldest = measurements[measurements.length - 1]
  const change = latest && oldest && measurements.length > 1 ? latest.peso - oldest.peso : 0
  const category = latest ? getBmiCategory(latest.imc) : null

  // Faixa de peso para IMC normal (18,5 a 24,9) na altura atual
  const heightM = (latest?.altura ?? 0) / 100
  const minIdeal = 18.5 * heightM * heightM
  const maxIdeal = 24.9 * heightM * heightM

  const confirmDelete = (measurement: BodyMeasurement) => {
    confirm({
      title: 'Excluir medição',
      message: `Excluir a medição de ${formatDate(measurement.data)}?`,
      confirmLabel: 'Excluir',
      icon: Trash2,
      onConfirm: () => deleteMeasurement(measurement.id).catch(() => toast.error('Não foi possível excluir a medição.')),
    })
  }

  const chronological = [...measurements].reverse()

  return (
    <>
      {header}
      <Page width="lg" className="pt-2">
        {measurements.length === 0 || !latest ? (
          <Card>
            <EmptyState
              icon={Activity}
              title="Nenhuma medição registrada"
              description="Registre seu peso e altura para acompanhar a evolução."
              actionLabel="Adicionar medição"
              onAction={() => setAdding(true)}
            />
          </Card>
        ) : (
          <>
            <div className="flex gap-2">
              <StatTile label="Peso atual" value={formatDecimal(latest.peso)} suffix="kg" />
              <StatTile label="IMC" value={formatDecimal(latest.imc)} />
              <StatTile
                label="Variação total"
                value={`${change > 0 ? '+' : ''}${formatDecimal(change)}`}
                suffix="kg"
                icon={change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus}
              />
            </div>

            {category && latest.imc > 0 && category.tone !== 'success' && (
              <Callout tone={category.tone === 'info' ? 'info' : 'warning'} title={`IMC: ${category.label}`}>
                {`Para a faixa de IMC normal na sua altura, o peso fica entre ${formatDecimal(minIdeal)} e ${formatDecimal(maxIdeal)} kg.`}
              </Callout>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
              {measurements.length > 1 ? (
                <Card className="flex flex-col gap-3 p-4">
                  <div className="flex flex-col gap-0.5">
                    <h2 className="text-base font-semibold">Evolução do peso</h2>
                    <p className="text-xs text-muted">{measurements.length} medições registradas</p>
                  </div>
                  <WeightChart
                    points={chronological.map(item => ({
                      value: item.peso,
                      label: formatDate(item.data, { day: '2-digit', month: '2-digit' }),
                      date: formatDate(item.data, { day: '2-digit', month: 'short', year: 'numeric' }),
                    }))}
                  />
                </Card>
              ) : (
                <Card className="p-4">
                  <p className="py-6 text-center text-sm text-muted">Registre mais uma medição para ver o gráfico de evolução.</p>
                </Card>
              )}

              <section className="flex flex-col gap-2">
                <SectionTitle
                  title="Medições"
                  action={<Button label="Nova" icon={Plus} variant="ghost" size="sm" className="-my-2 -mr-2" onClick={() => setAdding(true)} />}
                />
                <Card className="overflow-hidden">
                  {measurements.map((measurement, index) => (
                    <div key={measurement.id}>
                      {index > 0 && <div className="mx-4 h-px bg-border" />}
                      <div className="flex items-center gap-3 py-2.5 pl-4 pr-2">
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-base font-medium">{formatDate(measurement.data, { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                          <span className="truncate text-xs text-muted">
                            {formatDecimal(measurement.altura / 100, 2)} m · IMC {formatDecimal(measurement.imc)}
                            {measurement.notas ? ` · ${measurement.notas}` : ''}
                          </span>
                        </div>
                        <span className="text-base font-semibold tabular-nums">{formatDecimal(measurement.peso)} kg</span>
                        <IconButton icon={Trash2} size={36} iconSize={18} label="Excluir medição" className="text-subtle hover:text-danger" onClick={() => confirmDelete(measurement)} />
                      </div>
                    </div>
                  ))}
                </Card>
              </section>
            </div>
          </>
        )}
      </Page>
      {adding && <MeasurementSheet profile={profile} onClose={() => setAdding(false)} />}
    </>
  )
}
