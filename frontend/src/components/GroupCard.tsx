/**
 * @file GroupCard.tsx
 * @description A premium card component for displaying a summary of a savings group.
 * Supports multiple visual variants, status-based styling, and a skeleton loading state.
 */

import React from 'react'

/**
 * Props for the GroupCard component.
 */
interface GroupCardProps {
  /** Unique identifier for the group */
  groupId?: string
  /** Human-readable name of the group */
  groupName?: string
  /** Current number of members who have joined */
  memberCount?: number
  /** Maximum capacity of the group */
  maxMembers?: number
  /** Formatted date or description of the next payout event */
  nextPayout?: string
  /** Cumulative contribution amount for the current user or group */
  totalContributions?: number
  /** Current operational state of the group */
  status?: 'active' | 'completed' | 'paused'
  /** Visual layout and interaction style */
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive' | 'compact' | 'spacious'
  /** Optional click handler for navigation or selection */
  onClick?: () => void
  /** If true, renders a placeholder skeleton instead of content */
  isLoading?: boolean
}

/**
 * A versatile card component that represents a savings group with rich visual feedback.
 * Features:
 * - Dynamic color coding based on group status
 * - Member capacity progress bar
 * - Integrated skeleton loading state for async data fetching
 * - Accessibility support for interactive modes
 */
export const GroupCard: React.FC<GroupCardProps> = ({
  groupName = '',
  memberCount = 0,
  maxMembers = 1,
  nextPayout = '',
  totalContributions = 0,
  status = 'active',
  variant = 'interactive',
  onClick,
  isLoading = false,
}) => {
  const statusConfig = {
    active: {
      badge: 'badge badge-active',
      label: 'Active',
      dot: 'bg-emerald-500',
      accent: 'from-emerald-400 to-teal-500',
    },
    completed: {
      badge: 'badge badge-completed',
      label: 'Completed',
      dot: 'bg-primary-500',
      accent: 'from-primary-400 to-accent-500',
    },
    paused: {
      badge: 'badge badge-paused',
      label: 'Paused',
      dot: 'bg-amber-500',
      accent: 'from-amber-400 to-orange-500',
    },
  }

  const cardVariants = {
    default: 'glass-card p-5',
    elevated: 'glass-card glass-card-elevated p-6',
    outlined: 'glass-card border-2 p-5',
    interactive: 'glass-card glass-card-interactive p-5',
    compact: 'glass-card glass-card-interactive p-4',
    spacious: 'glass-card glass-card-elevated p-8',
  }

  const cardClass = cardVariants[variant]
  const isCompact = variant === 'compact'
  const isSpaciousOrElevated = variant === 'spacious' || variant === 'elevated'
  const memberPercent = Math.round((memberCount / maxMembers) * 100)
  const config = statusConfig[status]

  // --- SKELETON LOADING STATE ---
  if (isLoading) {
    return (
      <div className={`${cardClass} pointer-events-none relative overflow-hidden`} aria-busy="true" aria-label="Loading group">
        {/* Top Accent Bar Skeleton */}
        <div className="absolute top-0 left-0 right-0 h-1 glass-skeleton" />

        {/* Header Skeleton */}
        <div className={`flex justify-between items-start ${isCompact ? 'mb-3' : 'mb-5'} pt-1`}>
          <div
            className={`skeleton rounded-lg ${isCompact ? 'h-5 w-1/2' : isSpaciousOrElevated ? 'h-7 w-2/3' : 'h-6 w-1/2'}`}
          />
          <div className="skeleton h-6 w-16 rounded-full" />
        </div>

        {/* Body Skeleton */}
        <div className={`${isCompact ? 'space-y-3' : 'space-y-4'}`}>
          <div className="flex justify-between items-center">
            <div className="glass-skeleton h-3.5 w-14 rounded" />
            <div className="glass-skeleton h-3.5 w-10 rounded" />
          </div>
          <div className="h-2 rounded-full glass-skeleton" />
          <div className="flex justify-between items-center">
            <div className="glass-skeleton h-3.5 w-24 rounded" />
            <div className="glass-skeleton h-3.5 w-16 rounded" />
          </div>
          <div className="flex justify-between items-center">
            <div className="glass-skeleton h-3.5 w-20 rounded" />
            <div className="glass-skeleton h-3.5 w-24 rounded" />
          </div>
        </div>

        {/* Button Skeleton */}
        <div className={`glass-skeleton w-full rounded-xl ${isCompact ? 'mt-4 h-9' : 'mt-5 h-10'}`} />
      </div>
    )
  }

  // --- RENDER STATE ---
  return (
    <div
      className={`${cardClass} relative overflow-hidden group`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : -1}
      aria-label={onClick ? `${groupName} group, ${config.label} status` : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
    >
      {/* Top Accent Bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.accent} opacity-80 group-hover:opacity-100 transition-opacity duration-300`}
      />

      {/* Header */}
      <div className={`flex justify-between items-start ${isCompact ? 'mb-3' : 'mb-5'} pt-1`}>
        <h3
          className={`font-bold text-surface-900 leading-tight ${isCompact ? 'text-base' : isSpaciousOrElevated ? 'text-xl' : 'text-lg'}`}
        >
          {groupName}
        </h3>
        <span className={config.badge}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${config.dot}`} />
          {config.label}
        </span>
      </div>

      {/* Body */}
      <div className={`${isCompact ? 'space-y-3' : 'space-y-4'}`}>
        {/* Members */}
        <div className="flex justify-between items-center">
          <span className={`text-surface-500 font-medium ${isCompact ? 'text-xs' : 'text-sm'}`}>
            Members
          </span>
          <span className={`font-semibold text-surface-800 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            {memberCount}/{maxMembers}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar" role="progressbar" aria-valuenow={memberPercent} aria-valuemin={0} aria-valuemax={100} aria-label={`${memberCount} of ${maxMembers} members`}>
          <div
            className="progress-bar-fill"
            style={{ width: `${memberPercent}%` }}
          />
        </div>

        {/* Contributions */}
        <div className={`flex justify-between items-center ${isCompact ? 'text-xs' : 'text-sm'}`}>
          <span className="text-surface-500 font-medium">Contributed</span>
          <span className="font-bold text-surface-900">${totalContributions.toFixed(2)}</span>
        </div>

        {/* Next Payout */}
        <div className={`flex justify-between items-center ${isCompact ? 'text-xs' : 'text-sm'}`}>
          <span className="text-surface-500 font-medium">Next Payout</span>
          <span className="font-semibold text-primary-600">{nextPayout}</span>
        </div>
      </div>

      {/* Action Button */}
      <button
        className={`btn-primary w-full ${isCompact ? 'mt-4 py-2 text-xs' : 'mt-5 py-2.5 text-sm'}`}
        aria-label={`View details for ${groupName}`}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.()
        }}
      >
        View Details
        <svg
          className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
