import React from 'react'

interface Tab {
  id: string
  label: string
  icon: string
}

interface ProfileTabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ tabs, activeTab, onChange }) => (
  <div className="border-b border-gray-200 dark:border-slate-700">
    <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Profile sections">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            activeTab === tab.id
              ? 'border-blue-600 text-blue-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-500'
          }`}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
          </svg>
          {tab.label}
        </button>
      ))}
    </nav>
  </div>
)
