import React from 'react'

interface DashboardCardProps {
  children: React.ReactNode
  className?: string
  glass?: boolean
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  children,
  className = '',
  glass = false,
}) => {
  const base = glass
    ? 'backdrop-blur-md bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10'
    : 'bg-white dark:bg-slate-800 border border-surface-200/80 dark:border-slate-700'

  return (
    <div className={`rounded-2xl ${base} p-5 ${className}`}>
      {children}
    </div>
  )
}
