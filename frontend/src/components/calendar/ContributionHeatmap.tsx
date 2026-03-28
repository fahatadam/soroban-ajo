'use client'

import React, { useMemo } from 'react'
import { CalendarDay } from './CalendarDay'
import { buildCalendarGrid, getMonthLabels } from '@/utils/calendarHelpers'
import type { ContributionDay } from '@/utils/calendarHelpers'

interface ContributionHeatmapProps {
  contributions: ContributionDay[]
  weeks?: number
  title?: string
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const ContributionHeatmap: React.FC<ContributionHeatmapProps> = ({
  contributions,
  weeks = 52,
  title = 'Contribution Activity',
}) => {
  const grid = useMemo(() => buildCalendarGrid(contributions, weeks), [contributions, weeks])
  const monthLabels = useMemo(() => getMonthLabels(grid), [grid])
  const max = useMemo(
    () => Math.max(0, ...contributions.map((c) => c.count)),
    [contributions]
  )
  const totalContributions = contributions.reduce((s, c) => s + c.count, 0)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
        <span className="text-sm text-gray-500 dark:text-slate-400">
          {totalContributions} contribution{totalContributions !== 1 ? 's' : ''} in the last year
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-max">
          {/* Month labels */}
          <div className="flex mb-1 ml-8">
            {monthLabels.map(({ label, weekIndex }) => (
              <div
                key={`${label}-${weekIndex}`}
                className="text-xs text-gray-400 dark:text-slate-500"
                style={{ marginLeft: weekIndex === 0 ? 0 : `${(weekIndex - (monthLabels[monthLabels.indexOf({ label, weekIndex } as any) - 1]?.weekIndex ?? 0)) * 16}px` }}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Day-of-week labels */}
            <div className="flex flex-col gap-1 mr-1">
              {DAY_LABELS.map((d, i) => (
                <div key={d} className={`w-6 h-3 text-xs text-gray-400 dark:text-slate-500 leading-3 ${i % 2 === 0 ? 'invisible' : ''}`}>
                  {d.slice(0, 1)}
                </div>
              ))}
            </div>

            {/* Grid */}
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.days.map((day, di) => (
                  <CalendarDay key={di} day={day} max={max} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 justify-end">
        <span className="text-xs text-gray-400 dark:text-slate-500">Less</span>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <div
            key={level}
            className={`w-3 h-3 rounded-sm ${
              level === 0 ? 'bg-gray-100 dark:bg-slate-700' :
              level === 1 ? 'bg-green-200 dark:bg-green-900' :
              level === 2 ? 'bg-green-400 dark:bg-green-700' :
              level === 3 ? 'bg-green-500 dark:bg-green-500' :
              'bg-green-700 dark:bg-green-400'
            }`}
          />
        ))}
        <span className="text-xs text-gray-400 dark:text-slate-500">More</span>
      </div>
    </div>
  )
}
