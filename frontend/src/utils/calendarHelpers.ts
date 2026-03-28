export interface ContributionDay {
  date: string // YYYY-MM-DD
  count: number
  amount: number
}

export interface CalendarWeek {
  days: (ContributionDay | null)[]
}

export function getIntensityLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0 || max === 0) return 0
  const ratio = count / max
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

export function buildCalendarGrid(
  contributions: ContributionDay[],
  weeks = 52
): CalendarWeek[] {
  const map = new Map(contributions.map((c) => [c.date, c]))
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Start from Sunday of the week `weeks` ago
  const start = new Date(today)
  start.setDate(today.getDate() - weeks * 7 + 1)
  start.setDate(start.getDate() - start.getDay()) // back to Sunday

  const grid: CalendarWeek[] = []
  const cursor = new Date(start)

  for (let w = 0; w < weeks; w++) {
    const days: (ContributionDay | null)[] = []
    for (let d = 0; d < 7; d++) {
      const dateStr = cursor.toISOString().slice(0, 10)
      if (cursor > today) {
        days.push(null)
      } else {
        days.push(map.get(dateStr) ?? { date: dateStr, count: 0, amount: 0 })
      }
      cursor.setDate(cursor.getDate() + 1)
    }
    grid.push({ days })
  }

  return grid
}

export function getMonthLabels(weeks: CalendarWeek[]): { label: string; weekIndex: number }[] {
  const labels: { label: string; weekIndex: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, i) => {
    const firstDay = week.days.find((d) => d !== null)
    if (!firstDay) return
    const date = new Date(firstDay.date)
    const month = date.getMonth()
    if (month !== lastMonth) {
      labels.push({ label: date.toLocaleString('default', { month: 'short' }), weekIndex: i })
      lastMonth = month
    }
  })
  return labels
}
