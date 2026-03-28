/**
 * @file EmptyGroupState.tsx
 * @description Specialized empty state component for the groups dashboard.
 * Encourages users to start their first savings pool with interactive calls to action.
 */

import React from 'react'
import { EmptyState } from './EmptyState'

/**
 * Props for the EmptyGroupState component.
 */
interface EmptyGroupStateProps {
  /** Callback fired when the user clicks the primary group creation button */
  onCreateGroup: () => void
  /** Optional callback for an educational "Learn More" action */
  onLearnMore?: () => void
}

/**
 * A pre-configured empty state for the my-groups section.
 * Provides context-aware heading, description, and actions to reduce friction for new users.
 */
export const EmptyGroupState: React.FC<EmptyGroupStateProps> = ({ onCreateGroup, onLearnMore }) => {
  return (
    <EmptyState
      icon="social-users"
      illustrationSize="lg"
      heading="Start Your First Savings Group"
      message="Create a group to save together with friends, family, or community members. Everyone contributes, and members take turns receiving the pool."
      primaryAction={{
        label: 'Create Your First Group',
        onClick: onCreateGroup,
        icon: 'action-add',
      }}
      secondaryAction={
        onLearnMore
          ? {
              label: 'Learn How Ajo Works',
              onClick: onLearnMore,
            }
          : undefined
      }
    />
  )
}
