import React from 'react'
import type { UserProfile } from '@/types/profile'

interface PersonalInfoProps {
  profile: UserProfile
  address: string
}

export const PersonalInfo: React.FC<PersonalInfoProps> = ({ profile, address }) => {
  const rows = [
    { label: 'Display Name', value: profile.displayName ?? '—' },
    { label: 'Email', value: profile.email ?? '—' },
    { label: 'Bio', value: profile.bio ?? '—' },
    { label: 'Member Since', value: new Date(profile.joinedAt).toLocaleDateString() },
    { label: 'Wallet', value: address },
  ]

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex items-start gap-4 px-6 py-4">
          <span className="w-36 flex-shrink-0 text-sm text-gray-500 dark:text-slate-400">{label}</span>
          <span className={`text-sm text-gray-900 dark:text-slate-100 break-all ${label === 'Wallet' ? 'font-mono' : ''}`}>
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}
