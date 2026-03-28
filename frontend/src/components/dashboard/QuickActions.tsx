'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

interface QuickAction {
  label: string
  icon: React.ReactNode
  href: string
  gradient: string
}

const actions: QuickAction[] = [
  {
    label: 'Create Group',
    href: '/groups/create',
    gradient: 'from-indigo-500 to-purple-600',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    label: 'Explore Groups',
    href: '/groups',
    gradient: 'from-pink-500 to-rose-500',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    label: 'Transactions',
    href: '/transactions',
    gradient: 'from-amber-500 to-orange-500',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    href: '/analytics',
    gradient: 'from-teal-500 to-cyan-500',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

export const QuickActions: React.FC = () => {
  const router = useRouter()

  return (
    <div className="rounded-2xl backdrop-blur-md bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 p-5">
      <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => router.push(action.href)}
            className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br ${action.gradient} text-white font-medium text-sm hover:opacity-90 hover:scale-[1.02] transition-all duration-200 shadow-sm`}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
