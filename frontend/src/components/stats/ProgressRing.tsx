import React from 'react'

interface ProgressRingProps {
  value: number      // 0–100
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  label?: string
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 56,
  strokeWidth = 5,
  color = '#3b82f6',
  trackColor,
  label,
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor ?? 'currentColor'}
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-slate-600"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      {label && (
        <span className="absolute text-xs font-semibold text-gray-700 dark:text-slate-200">
          {label}
        </span>
      )}
    </div>
  )
}
