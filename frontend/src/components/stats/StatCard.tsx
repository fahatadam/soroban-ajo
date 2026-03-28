'use client'

import React, { useRef, useState, useEffect } from 'react'
import { useCountUp } from '@/hooks/useCountUp'
import { ProgressRing } from './ProgressRing'
import { TrendIndicator } from './TrendIndicator'

interface StatCardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  progress?: number       // 0–100, shows ring if provided
  trend?: number          // % change, shows indicator if provided
  icon?: React.ReactNode
  color?: string          // hex for ring
  formatValue?: (v: number) => string
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  prefix = '',
  suffix = '',
  progress,
  trend,
  icon,
  color = '#3b82f6',
  formatValue,
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const animated = useCountUp(value, 1200, visible)
  const display = formatValue ? formatValue(animated) : `${prefix}${animated.toLocaleString()}${suffix}`

  return (
    <div
      ref={ref}
      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 flex items-center gap-4 shadow-sm"
    >
      {progress !== undefined ? (
        <ProgressRing value={visible ? progress : 0} color={color} label={`${Math.round(progress)}%`} />
      ) : icon ? (
        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      ) : null}

      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 tabular-nums">{display}</p>
        {trend !== undefined && (
          <div className="mt-1">
            <TrendIndicator value={trend} />
            <span className="text-xs text-gray-400 dark:text-slate-500 ml-1">vs last period</span>
          </div>
        )}
      </div>
    </div>
  )
}
