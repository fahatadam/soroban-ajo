import React from 'react'
import type { UserProfile } from '@/types/profile'

interface ProfileCardProps {
  profile: UserProfile
  isLoading?: boolean
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile, isLoading = false }) => {
  if (isLoading) {
    return (
      <div
        className="glass-card glass-card-elevated p-8 relative overflow-hidden"
        aria-busy="true"
        aria-label="Loading profile"
      >
        {/* Shimmer overlay */}
        <div className="absolute inset-0 glass-skeleton opacity-40 z-10 pointer-events-none" />
        <div className="flex items-start gap-6">
          <div className="glass-skeleton w-24 h-24 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="glass-skeleton h-8 w-48 rounded" />
            <div className="glass-skeleton h-4 w-64 rounded" />
            <div className="glass-skeleton h-4 w-32 rounded" />
            <div className="glass-skeleton h-4 w-40 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/20 dark:border-white/10">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="glass-skeleton h-8 w-16 rounded mx-auto" />
              <div className="glass-skeleton h-3.5 w-20 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const getAvatarInitials = () => {
    if (profile.displayName) {
      return profile.displayName.slice(0, 2).toUpperCase()
    }
    return profile.address.slice(0, 2).toUpperCase()
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="glass-card glass-card-elevated p-8">
      <div className="flex items-start gap-6">
        {/* Avatar */}
        <div className="relative">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.displayName || 'User avatar'}
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-4 border-blue-100">
              <span className="text-3xl font-bold text-white">{getAvatarInitials()}</span>
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-white" />
        </div>

        {/* Profile Info */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-1">
            {profile.displayName || 'Anonymous User'}
          </h2>
          <p className="text-surface-500 dark:text-surface-400 mb-2 font-mono text-sm">
            {formatAddress(profile.address)}
          </p>
          {profile.bio && (
            <p className="text-surface-700 dark:text-surface-300 mt-3">{profile.bio}</p>
          )}
          <div className="flex items-center gap-2 mt-3 text-sm text-surface-500 dark:text-surface-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Joined {new Date(profile.joinedAt).toLocaleDateString()}</span>
          </div>
          {profile.kycLevel !== undefined && (
            <div className="mt-2">
              <span className="inline-block bg-warning-100 dark:bg-warning-500/20 text-warning-700 dark:text-warning-400 text-xs px-2 py-1 rounded">
                KYC L{profile.kycLevel} ({profile.kycStatus || 'none'})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/30 dark:border-white/10">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{profile.stats.totalGroups}</div>
          <div className="text-sm text-surface-500 dark:text-surface-400 mt-1">Total Groups</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-success-600 dark:text-success-500">${profile.stats.totalContributions.toFixed(2)}</div>
          <div className="text-sm text-surface-500 dark:text-surface-400 mt-1">Contributed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-accent-600 dark:text-accent-400">{profile.stats.successRate}%</div>
          <div className="text-sm text-surface-500 dark:text-surface-400 mt-1">Success Rate</div>
        </div>
      </div>
    </div>
  )
}
