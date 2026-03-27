export interface UserProfile {
  address: string
  displayName?: string
  email?: string
  avatar?: string
  bio?: string
  joinedAt: string
  preferences: UserPreferences
  stats: UserStats
}

export type EmailFrequency = 'instant' | 'daily' | 'weekly'

export interface EmailNotificationPreferences {
  /** Master switch — when false all email notifications are suppressed */
  enabled: boolean
  /** How often to batch and send emails */
  frequency: EmailFrequency
  /** Per-event-type toggles */
  events: {
    contributionDue24h: boolean
    contributionDue1h: boolean
    contributionOverdue: boolean
    payoutReceived: boolean
    memberJoined: boolean
    cycleCompleted: boolean
    announcements: boolean
    groupInvitation: boolean
    securityAlerts: boolean
  }
}

export const defaultEmailPreferences: EmailNotificationPreferences = {
  enabled: false,
  frequency: 'instant',
  events: {
    contributionDue24h: true,
    contributionDue1h: false,
    contributionOverdue: true,
    payoutReceived: true,
    memberJoined: false,
    cycleCompleted: true,
    announcements: false,
    groupInvitation: true,
    securityAlerts: true,
  },
}

export interface UserPreferences {
  notifications: {
    email: boolean
    push: boolean
    groupUpdates: boolean
    payoutReminders: boolean
    contributionReminders: boolean
  }
  emailNotifications: EmailNotificationPreferences
  privacy: {
    showProfile: boolean
    showActivity: boolean
    showStats: boolean
  }
  display: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    currency: string
  }
}

export interface UserStats {
  totalGroups: number
  activeGroups: number
  completedGroups: number
  totalContributions: number
  totalPayouts: number
  successRate: number
}

export interface ActivityItem {
  id: string
  type: 'contribution' | 'payout' | 'group_joined' | 'group_created'
  groupName: string
  amount?: number
  timestamp: string
  status: 'completed' | 'pending' | 'failed'
}
