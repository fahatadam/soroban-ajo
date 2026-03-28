import React from 'react'

interface StatsCardProps {
  label: string
  value: React.ReactNode
  icon: React.ReactNode
  gradient?: string
  trend?: { value: string; positive: boolean }
  isLoading?: boolean
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon,
  gradient = 'from-indigo-500 to-purple-600',
  trend,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl backdrop-blur-md bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 p-5 h-full">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="skeleton h-10 w-10 rounded-xl mb-4" />
        <div className="skeleton h-3 w-20 rounded mb-3" />
        <div className="skeleton h-8 w-24 rounded" />
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl backdrop-blur-md bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group h-full">
      {/* Gradient top bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient}`} />
      {/* Glow */}
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />

      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} mb-3`}>
        <span className="text-white w-5 h-5 flex items-center justify-center">{icon}</span>
      </div>

      <div>
        <p className="text-xs font-medium text-white/60 dark:text-white/50 mb-1">{label}</p>
        <p className="text-2xl font-extrabold text-white leading-none">{value}</p>
        {trend && (
          <p className={`mt-1 text-xs font-semibold flex items-center gap-1 ${trend.positive ? 'text-emerald-300' : 'text-red-300'}`}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d={trend.positive ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
            </svg>
            {trend.value}
          </p>
        )}
      </div>
    </div>
  )
}
