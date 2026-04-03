/**
 * Date range helpers — zona horaria Buenos Aires (UTC-3)
 */

/** Retorna la fecha de hoy en Buenos Aires (UTC-3) como string YYYY-MM-DD */
function todayBA() {
  const now = new Date()
  // Buenos Aires es UTC-3 (sin DST)
  const ba = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  return ba.toISOString().slice(0, 10)
}

/** Resta N días a un string YYYY-MM-DD */
function subtractDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

/** Lunes de la semana que contiene el dateStr */
function weekStart(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay() // 0=Dom
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

/** Domingo de la semana que contiene el dateStr */
function weekEnd(dateStr) {
  const start = weekStart(dateStr)
  const d = new Date(start + 'T12:00:00')
  d.setDate(d.getDate() + 6)
  return d.toISOString().slice(0, 10)
}

/** Primer día del mes de un dateStr */
function monthStart(dateStr) {
  return dateStr.slice(0, 7) + '-01'
}

/** Último día del mes de un dateStr */
function monthEnd(dateStr) {
  const [y, m] = dateStr.split('-').map(Number)
  const last = new Date(y, m, 0)
  return last.toISOString().slice(0, 10)
}

export const RANGE_OPTIONS = [
  { key: 'this_week',   label: 'Esta semana' },
  { key: 'last_week',   label: 'Semana pasada' },
  { key: 'last_2w',     label: 'Últimas 2 semanas' },
  { key: 'this_month',  label: 'Este mes' },
  { key: 'last_month',  label: 'Mes pasado' },
  { key: 'last_30',     label: 'Últimos 30 días' },
  { key: 'last_90',     label: 'Últimos 90 días' },
  { key: 'custom',      label: 'Personalizado' },
]

/**
 * Dado un key de RANGE_OPTIONS, retorna { from, to } como strings YYYY-MM-DD
 * customFrom/customTo se usan solo cuando key === 'custom'
 */
export function resolveRange(key, customFrom, customTo) {
  const today = todayBA()

  switch (key) {
    case 'this_week':
      return { from: weekStart(today), to: today }

    case 'last_week': {
      const lastMon = subtractDays(weekStart(today), 7)
      return { from: lastMon, to: weekEnd(lastMon) }
    }

    case 'last_2w':
      return { from: subtractDays(today, 13), to: today }

    case 'this_month':
      return { from: monthStart(today), to: today }

    case 'last_month': {
      const firstOfThis = monthStart(today)
      const lastDayPrev = subtractDays(firstOfThis, 1)
      return { from: monthStart(lastDayPrev), to: lastDayPrev }
    }

    case 'last_30':
      return { from: subtractDays(today, 29), to: today }

    case 'last_90':
      return { from: subtractDays(today, 89), to: today }

    case 'custom':
      return { from: customFrom || monthStart(today), to: customTo || today }

    default:
      return { from: monthStart(today), to: today }
  }
}
