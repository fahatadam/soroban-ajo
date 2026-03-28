/**
 * @file GroupsGrid.tsx
 * @description A responsive grid component for displaying multiple savings groups.
 * Handles staggered animations for entry and provides a skeleton loading state.
 */

import React from 'react'
import { Group } from '@/types'
import { GroupCard } from './GroupCard'

/**
 * Props for the GroupsGrid component.
 */
interface GroupsGridProps {
  /** Array of group objects to be rendered as cards */
  groups?: Group[]
  /** If true, renders a set of skeleton cards */
  isLoading?: boolean
  /** Callback fired when a specific group card is clicked */
  onGroupClick?: (groupId: string) => void
}

/**
 * A responsive grid that displays GroupCard components.
 * Automatically handles empty states (via the length check in parent) 
 * and provides a professional loading experience with staggered skeletons.
 */
export const GroupsGrid: React.FC<GroupsGridProps> = ({
  groups,
  isLoading = false,
  onGroupClick
}) => {
  const list = groups ?? []
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
            <GroupCard isLoading />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {list.map((group, i) => (
        <div key={group.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
          <GroupCard
            groupId={group.id}
            groupName={group.name}
            memberCount={group.currentMembers}
            maxMembers={group.maxMembers}
            nextPayout={group.nextPayoutDate}
            totalContributions={group.totalContributions}
            status={group.status}
            onClick={() => onGroupClick?.(group.id)}
          />
        </div>
      ))}
    </div>
  )
}
