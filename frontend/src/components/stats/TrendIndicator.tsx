import React from 'react'

interface TrendIndicatorProps {
  value: number   // positive = up, negative = down
  suffix?: string
  className?: string
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({ value, suffix = '%', className = '' }) => {
  const isUp = value >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isUp ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
      } ${className}`}
    >
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
        {isUp ? (
          <path d="M6 2l4 6H2l4-6z" />
        ) : (
          <path d="M6 10L2 4h8l-4 6z" />
        )}
      </svg>
      {Math.abs(value).toFixed(1)}{suffix}
    </span>
  )
}
