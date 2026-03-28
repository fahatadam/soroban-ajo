import React from 'react'
import type { ContributionDay } from '@/utils/calendarHelpers'
import { getIntensityLevel } from '@/utils/calendarHelpers'

interface CalendarDayProps {
  day: ContributionDay | null
  max: number
}

const intensityClasses: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-gray-100 dark:bg-slate-700',
  1: 'bg-green-200 dark:bg-green-900',
  2: 'bg-green-400 dark:bg-green-700',
  3: 'bg-green-500 dark:bg-green-500',
  4: 'bg-green-700 dark:bg-green-400',
}

export const CalendarDay: React.FC<CalendarDayProps> = ({ day, max }) => {
  if (!day) return <div className="w-3 h-3 rounded-sm" />

  const level = getIntensityLevel(day.count, max)
  const title = day.count > 0
    ? `${day.date}: ${day.count} contribution${day.count > 1 ? 's' : ''} ($${day.amount.toFixed(2)})`
    : `${day.date}: No contributions`

  return (
    <div
      title={title}
      aria-label={title}
      className={`w-3 h-3 rounded-sm cursor-default transition-transform hover:scale-125 ${intensityClasses[level]}`}
    />
  )
}
