'use client'

export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { ProfileCard } from '@/components/ProfileCard'
import { ProfileForm } from '@/components/ProfileForm'
import { SettingsPanel } from '@/components/SettingsPanel'
import { KYCVerification } from '@/components/KYCVerification'
import { ProfileTabs } from '@/components/profile/ProfileTabs'
import { PersonalInfo } from '@/components/profile/PersonalInfo'
import { GroupsTab } from '@/components/profile/GroupsTab'
import { AchievementGrid } from '@/components/AchievementGrid'
import type { ActivityItem } from '@/types/profile'

const TABS = [
  { id: 'personal', label: 'Personal Info', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'groups', label: 'Groups', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'achievements', label: 'Achievements', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
  { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
]

export default function ProfilePage() {
  const router = useRouter()
  const { isAuthenticated, address, logout } = useAuth()
  const { profile, activities, loading, updateProfile, updatePreferences } = useProfile(address)
  const [activeTab, setActiveTab] = useState('personal')

  React.useEffect(() => {
    if (!isAuthenticated) router.push('/dashboard')
  }, [isAuthenticated, router])

  if (!isAuthenticated || loading || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-slate-400">{!isAuthenticated ? 'Redirecting...' : 'Loading profile...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Profile</h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">Manage your account</p>
            </div>
          </div>
          <button onClick={logout} className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors font-medium">
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Profile card always visible */}
        <ProfileCard profile={profile} isLoading={loading} />

        {/* Tabbed content */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="px-6 pt-4">
            <ProfileTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
          </div>

          <div className="p-6">
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <PersonalInfo profile={profile} address={address ?? ''} />
                <KYCVerification />
              </div>
            )}

            {activeTab === 'groups' && <GroupsTab stats={profile.stats} />}

            {activeTab === 'achievements' && (
              <AchievementGrid />
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <ProfileForm profile={profile} onSave={updateProfile} isLoading={loading} />
                <SettingsPanel preferences={profile.preferences} onSave={updatePreferences} isLoading={loading} email={profile.email} />
              </div>
            )}
          </div>
        </div>

        {/* Activity feed shown on personal tab */}
        {activeTab === 'personal' && activities.length > 0 && (
          <ActivityHistory activities={activities} isLoading={loading} />
        )}
      </div>
    </div>
  )
}

const ActivityHistory: React.FC<{ activities: ActivityItem[]; isLoading: boolean }> = ({ activities, isLoading }) => {
  if (isLoading) return null

  const typeConfig: Record<ActivityItem['type'], { icon: string; bg: string; text: string }> = {
    contribution: { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
    payout: { icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
    group_joined: { icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
    group_created: { icon: 'M12 4v16m8-8H4', bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6">
      <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.map((activity) => {
          const cfg = typeConfig[activity.type]
          return (
            <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                <svg className={`w-4 h-4 ${cfg.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{activity.groupName}</p>
                {activity.amount && <p className="text-xs text-gray-500 dark:text-slate-400">${activity.amount.toFixed(2)}</p>}
                <p className="text-xs text-gray-400 dark:text-slate-500">{new Date(activity.timestamp).toLocaleString()}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activity.status === 'completed' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' :
                activity.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300' :
                'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
              }`}>
                {activity.status}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
