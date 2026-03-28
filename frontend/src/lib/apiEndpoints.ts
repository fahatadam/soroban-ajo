/**
 * Central definitions for API paths used by the frontend.
 * Next.js route handlers use same-origin `/api/*`; the backend uses `NEXT_PUBLIC_API_URL`.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export const apiPaths = {
  auth: {
    token: '/api/auth/token',
    twoFactorStatus: '/api/auth/2fa/status',
    twoFactorSetup: '/api/auth/2fa/setup',
    twoFactorEnable: '/api/auth/2fa/enable',
    twoFactorDisable: '/api/auth/2fa/disable',
  },
  activity: {
    feed: (groupId?: string) =>
      groupId
        ? `/api/v1/groups/${groupId}/activity`
        : `/api/v1/activity`,
    summary: (groupId: string, days: number) =>
      `/api/v1/groups/${groupId}/activity/summary?days=${days}`,
  },
  kyc: {
    status: '/api/kyc/status',
    request: '/api/kyc/request',
    upload: '/api/kyc/upload',
  },
  bridge: {
    initiate: '/api/bridge/initiate',
    status: (id: string) => `/api/bridge/status/${id}`,
    history: '/api/bridge/history',
  },
  achievements: {
    followers: '/api/achievements/followers',
    following: '/api/achievements/following',
    stats: '/api/achievements/stats',
    follow: (walletAddress: string) =>
      `/api/achievements/follow/${walletAddress}`,
  },
  analytics: {
    post: '/api/analytics',
    stats: '/api/analytics/stats',
    advanced: (start: string, end: string) =>
      `/api/analytics/advanced?start=${start}&end=${end}`,
    predictive: '/api/analytics/predictive',
    funnel: '/api/analytics/funnel',
    export: '/api/analytics/export',
  },
  admin: {
    dashboard: '/api/admin/dashboard',
    config: '/api/admin/config',
    users: (query: string) => `/api/admin/users?${query}`,
    audit: (query: string) => `/api/admin/audit?${query}`,
    userSuspend: (userId: string) => `/api/admin/users/${userId}/suspend`,
    userBan: (userId: string) => `/api/admin/users/${userId}/ban`,
    userDelete: (userId: string) => `/api/admin/users/${userId}`,
    userReinstate: (userId: string) => `/api/admin/users/${userId}/reinstate`,
  },
} as const
