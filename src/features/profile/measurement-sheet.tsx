import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Callout } from '../../components/ui/misc'
import { Sheet } from '../../components/ui/sheet'
import { StepperField } from '../../components/ui/stepper-field'
import { TextArea, TextField } from '../../components/ui/text-field'
import { useToast } from '../../contexts/toast-context'
import { addMeasurement, calculateBmi, getBmiCategory, InvalidMeasurementError } from '../../data/body-metrics'
import type { UserProfile } from '../../data/user-profile'
import { getLocalDateKey } from '../../utils/format'

const formatDecimal = (value: number, digits = 1) => value.toFixed(digits).replace('.', ',')

/** Nova medição (altura e peso). Começa com as últimas medidas para o usuário só ajustar */
export function MeasurementSheet({ profile, onClose, onSaved }: { profile: UserProfile; onClose: () => void; onSaved?: () => void }) {
  const toast = useToast()
  const [height, setHeight] = useState(profile.altura ? profile.altura / 100 : 1.7)
  const [weight, setWeight] = useState(profile.peso ?? 70)
  const [date, setDate] = useState(getLocalDateKey())
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const bmi = calculateBmi(weight, height * 100)
  const category = getBmiCategory(bmi)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      // Meio-dia evita que o fuso jogue a data para o dia anterior
      const measuredAt = new Date(`${date}T12:00:00`)
      await addMeasurement({ userId: profile.id, date: measuredAt, weightKg: weight, heightM: height, notes: profile.isPremium ? notes : undefined })
      toast.success('Medição salva')
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err instanceof InvalidMeasurementError ? err.message : 'Não foi possível salvar a medição.')
      setSaving(false)
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Nova medição"
      footer={(
        <div className="flex gap-2">
          <Button label="Cancelar" variant="secondary" className="flex-1" onClick={onClose} disabled={saving} />
          <Button label="Salvar medição" className="flex-1" loading={saving} onClick={save} />
        </div>
      )}
    >
      <div className="flex flex-col gap-5 pb-2">
        {error && <Callout tone="danger">{error}</Callout>}

        <StepperField label="Altura" value={height} onChange={setHeight} step={0.01} min={0.5} max={3} decimals={2} suffix="m" />
        <StepperField label="Peso" value={weight} onChange={setWeight} step={0.1} min={20} max={500} decimals={1} suffix="kg" />
        <TextField label="Data da medição" type="date" value={date} onChange={event => setDate(event.target.value)} max={getLocalDateKey()} />
        {profile.isPremium && (
          <TextArea label="Observações (opcional)" value={notes} onChange={event => setNotes(event.target.value)} placeholder="Ex.: medido em jejum" maxLength={300} rows={2} />
        )}

        <div className="flex items-center justify-between rounded-2xl border border-border bg-surface-2/50 p-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted">IMC calculado</span>
            <span className="text-2xl font-bold">{formatDecimal(bmi)}</span>
          </div>
          {category && <span className="text-sm font-medium text-muted">{category.label}</span>}
        </div>
      </div>
    </Sheet>
  )
}
