import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Raw data required to create a new notification.
 */
export interface NotificationPayload {
  id: string
  type:
    | 'contribution_due'
    | 'contribution_overdue'
    | 'contribution_received'
    | 'payout_received'
    | 'member_joined'
    | 'member_left'
    | 'cycle_completed'
    | 'group_created'
    | 'announcement'
  title: string
  message: string
  timestamp: number
  groupId?: string
  /** URI to redirect the user to when they interact with the notification */
  actionUrl?: string
  metadata?: Record<string, unknown>
}

export interface Notification extends NotificationPayload {
  read: boolean
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  inApp: boolean
  contributionDue24h: boolean
  contributionDue1h: boolean
  contributionOverdue: boolean
  payoutReceived: boolean
  memberJoined: boolean
  cycleCompleted: boolean
  announcements: boolean
}

interface NotificationState {
  notifications: Notification[]
  preferences: NotificationPreferences
  pushSubscription: PushSubscription | null
  addNotification: (notification: NotificationPayload) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void
  setPushSubscription: (subscription: PushSubscription | null) => void
  getUnreadCount: () => number
  requestBrowserPermission: () => Promise<NotificationPermission>
  showBrowserNotification: (title: string, body: string, tag?: string) => void
}

const defaultPreferences: NotificationPreferences = {
  email: false,
  push: true,
  inApp: true,
  contributionDue24h: true,
  contributionDue1h: true,
  contributionOverdue: true,
  payoutReceived: true,
  memberJoined: true,
  cycleCompleted: true,
  announcements: true,
}

/**
 * Primary state management hook for in-app and browser notifications.
 * Uses Zustand with persistent storage to track unread alerts and user preferences.
 * 
 * Includes methods for:
 * - Adding/Deleting notifications
 * - Marking as read
 * - Managing push service worker subscriptions
 * - Requesting browser notification permissions
 */
export const useNotifications = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      preferences: defaultPreferences,
      pushSubscription: null,

      addNotification: (payload: NotificationPayload) => {
        const notification: Notification = { ...payload, read: false }

        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 100),
        }))

        // Show browser notification if permitted and preference enabled
        const { preferences, showBrowserNotification } = get()
        if (preferences.inApp) {
          showBrowserNotification(payload.title, payload.message, payload.id)
        }
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }))
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }))
      },

      deleteNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
      },

      clearAll: () => set({ notifications: [] }),

      updatePreferences: (preferences) => {
        set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        }))
      },

      setPushSubscription: (subscription) => set({ pushSubscription: subscription }),

      getUnreadCount: () => get().notifications.filter((n) => !n.read).length,

      requestBrowserPermission: async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
          return 'denied'
        }
        if (Notification.permission === 'default') {
          return Notification.requestPermission()
        }
        return Notification.permission
      },

      showBrowserNotification: (title, body, tag) => {
        if (
          typeof window === 'undefined' ||
          !('Notification' in window) ||
          Notification.permission !== 'granted' ||
          document.visibilityState === 'visible'
        ) {
          return
        }
        try {
          new Notification(title, {
            body,
            tag,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
          })
        } catch {
          // Notification API may be blocked in some contexts
        }
      },
    }),
    {
      name: 'ajo-notifications',
      partialize: (state) => ({
        notifications: state.notifications,
        preferences: state.preferences,
      }),
    }
  )
)
