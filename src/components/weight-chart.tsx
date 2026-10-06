import { useId } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
import { formatWeight } from '../utils/format'

export type ChartPoint = {
  value: number
  /** Rótulo curto do eixo X (ex.: 05/10) */
  label: string
  /** Data por extenso para o tooltip */
  date: string
}

type WeightChartProps = {
  points: ChartPoint[]
  unit?: string
  height?: number
}

/** Gráfico de linha com área (evolução de carga e de peso corporal), mesmo desenho do app */
export function WeightChart({ points, unit = 'kg', height = 220 }: WeightChartProps) {
  // useId pode gerar caracteres que não valem dentro de url(#...)
  const gradientId = `chart-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  if (points.length === 0) return null

  const values = points.map(point => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(max - min, 1)

  // Eixo Y começa perto do menor valor (começar do zero achata a curva de quem levanta 40-60 kg)
  const step = range > 40 ? 10 : range > 12 ? 5 : range > 4 ? 2 : 1
  const bottom = Math.max(0, Math.floor((min - range * 0.25) / step) * step)
  // Marcações em números redondos: no máximo 5 intervalos, sempre múltiplos do passo
  let tickStep = step
  while (Math.ceil((max + range * 0.15 - bottom) / tickStep) > 5) tickStep *= 2
  const sections = Math.ceil((max + range * 0.15 - bottom) / tickStep)
  const top = bottom + sections * tickStep
  const ticks = Array.from({ length: sections + 1 }, (_, index) => bottom + index * tickStep)

  const renderTooltip = ({ active, payload }: TooltipContentProps<number, string>) => {
    const point = payload?.[0]?.payload as ChartPoint | undefined
    if (!active || !point) return null
    return (
      <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-lg">
        <p className="text-base font-bold">{formatWeight(point.value)} {unit}</p>
        <p className="text-xs text-muted">{point.date}</p>
      </div>
    )
  }

  return (
    <div style={{ height }} className="-ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--color-border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border)' }}
            tick={{ fill: 'var(--color-subtle)', fontSize: 11 }}
            minTickGap={16}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[bottom, top]}
            ticks={ticks}
            tickLine={false}
            axisLine={false}
            width={40}
            tick={{ fill: 'var(--color-subtle)', fontSize: 11 }}
            allowDecimals={false}
          />
          <Tooltip content={renderTooltip} cursor={{ stroke: 'var(--color-subtle)', strokeDasharray: '3 3' }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-primary)"
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={points.length > 30 ? false : { r: 3.5, fill: 'var(--color-primary)', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: 'var(--color-primary)', stroke: 'var(--color-surface)', strokeWidth: 2 }}
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
