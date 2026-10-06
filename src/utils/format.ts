/** "YYYY-MM-DD" no fuso local */
export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 95 -> "01:35" */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds))
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

/** 45 -> "45s", 90 -> "1:30 min", 120 -> "2 min" */
export function formatRest(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest === 0 ? `${minutes} min` : `${minutes}:${String(rest).padStart(2, '0')} min`
}

/** Número sem casas decimais desnecessárias: 40 -> "40", 12.5 -> "12,5" */
export function formatWeight(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value).replace('.', ',')
}

/** Saudação pelo horário, como no app */
export function greeting(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

/** true se a data ISO está dentro dos últimos `days` dias */
export function isWithinLastDays(iso: string, days: number): boolean {
  return Date.now() - new Date(iso).getTime() <= days * 24 * 60 * 60 * 1000
}

export function formatDate(iso: string, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }) {
  return new Date(iso).toLocaleDateString('pt-BR', options)
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/** 82.5 -> "82,5" */
export function formatDecimal(value: number, digits = 1): string {
  return value.toFixed(digits).replace('.', ',')
}

/** "YYYY-MM-DD" -> Date no fuso local (sem o deslocamento do UTC) */
export function parseDateKey(key: string): Date | null {
  const [year, month, day] = key.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

/** "Hoje", "Ontem" ou "segunda-feira, 3 de outubro" */
export function formatRelativeDay(dateKey: string): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateKey === getLocalDateKey()) return 'Hoje'
  if (dateKey === getLocalDateKey(yesterday)) return 'Ontem'
  const date = parseDateKey(dateKey)
  if (!date) return dateKey
  const label = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}
