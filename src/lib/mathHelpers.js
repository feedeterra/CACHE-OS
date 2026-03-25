import { getDaysInMonth, getDate, eachDayOfInterval, startOfMonth, subDays, format } from 'date-fns'

export function computeCPA(spend, units) {
  if (!units || units === 0) return null
  return spend / units
}

export function computeROAS(spend, revenue) {
  if (!spend || spend === 0 || !revenue) return null
  return revenue / spend
}

export function formatCurrency(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatPercent(value, decimals = 2) {
  if (value == null) return '—'
  return `${Number(value).toFixed(decimals)}%`
}

export function getKpiStatus(actual, target, lowerIsBetter = false) {
  if (target == null || actual == null || target === 0) return 'neutral'
  const ratio = actual / target
  if (lowerIsBetter) {
    if (ratio <= 1.0) return 'good'
    if (ratio <= 1.25) return 'warning'
    return 'danger'
  } else {
    if (ratio >= 1.0) return 'good'
    if (ratio >= 0.75) return 'warning'
    return 'danger'
  }
}

/** CTR-specific status thresholds */
export function getCtrStatus(ctr) {
  if (ctr == null) return 'neutral'
  if (ctr >= 1.0)  return 'good'
  if (ctr >= 0.7)  return 'warning'
  return 'danger' // creative fatigue
}

/** ROAS-specific status thresholds (goal > 3.0, warn < 2.0) */
export function getRoasStatus(roas) {
  if (roas == null) return 'neutral'
  if (roas >= 3.0)  return 'good'
  if (roas >= 2.0)  return 'warning'
  return 'danger'
}

/** Compute WoW change: returns { thisWeek, lastWeek, delta, deltaPct } */
export function computeWoW(snapshots, field = 'spend', today = new Date()) {
  const thisWeekStart = format(subDays(today, 6), 'yyyy-MM-dd')
  const lastWeekStart = format(subDays(today, 13), 'yyyy-MM-dd')
  const lastWeekEnd   = format(subDays(today, 7),  'yyyy-MM-dd')

  const thisWeek = snapshots
    .filter((s) => s.date >= thisWeekStart)
    .reduce((acc, s) => acc + Number(s[field] || 0), 0)

  const lastWeek = snapshots
    .filter((s) => s.date >= lastWeekStart && s.date <= lastWeekEnd)
    .reduce((acc, s) => acc + Number(s[field] || 0), 0)

  const delta    = thisWeek - lastWeek
  const deltaPct = lastWeek > 0 ? (delta / lastWeek) * 100 : null
  return { thisWeek, lastWeek, delta, deltaPct }
}

/** Scale projection: what CPA do we get if budget scales X% */
export function computeScaleProjection(currentSpend, currentCPA, scalePct) {
  // Meta CPM typically increases ~15% per 2x spend (rough model)
  const multiplier   = 1 + scalePct / 100
  const newSpend     = currentSpend * multiplier
  const cpmDegradation = Math.pow(multiplier, 0.15) // log-scale degradation
  const projectedCPA = currentCPA * cpmDegradation
  const projectedConversions = projectedCPA > 0 ? newSpend / projectedCPA : 0
  return { newSpend, projectedCPA, projectedConversions, cpmDegradation }
}

/** Pacing alert level */
export function getPacingAlert(projectedUtilization) {
  if (projectedUtilization == null) return null
  if (projectedUtilization > 110) return { level: 'danger',  label: 'OVERSPENDING',  emoji: '🚨' }
  if (projectedUtilization > 105) return { level: 'warning', label: 'PACING ALTO',   emoji: '⚠️' }
  if (projectedUtilization < 80)  return { level: 'warning', label: 'UNDERSPENDING', emoji: '📉' }
  if (projectedUtilization < 70)  return { level: 'danger',  label: 'CRITICAL BAJO', emoji: '🚨' }
  return { level: 'good', label: 'ON TRACK', emoji: '🎯' }
}

export function projectMonthEnd(currentSpend, monthlyBudget, today = new Date()) {
  const daysElapsed = getDate(today)
  const totalDays = getDaysInMonth(today)
  const daysRemaining = totalDays - daysElapsed

  const dailyAvg = daysElapsed > 0 ? currentSpend / daysElapsed : 0
  const projected = currentSpend + dailyAvg * daysRemaining
  const idealDaily = monthlyBudget / totalDays
  const recommendedDaily = daysRemaining > 0 ? (monthlyBudget - currentSpend) / daysRemaining : 0

  const utilization = monthlyBudget > 0 ? (currentSpend / monthlyBudget) * 100 : 0
  const projectedUtilization = monthlyBudget > 0 ? (projected / monthlyBudget) * 100 : 0

  let status = 'on-track'
  if (projectedUtilization > 105) status = 'overspending'
  else if (projectedUtilization < 90) status = 'underspending'

  return { projected, idealDaily, recommendedDaily, daysElapsed, daysRemaining, totalDays, utilization, projectedUtilization, status }
}

export function fillDailyGaps(snapshots, today = new Date(), keys = ['spend']) {
  const start = startOfMonth(today)
  const end = today
  const map = {}
  for (const s of snapshots) map[s.date] = s

  return eachDayOfInterval({ start, end }).map((d) => {
    const dateKey = d.toISOString().slice(0, 10)
    const existing = map[dateKey]
    const row = { date: dateKey }
    for (const k of keys) {
      row[k] = existing ? (Number(existing[k]) || 0) : 0
    }
    return row
  })
}
