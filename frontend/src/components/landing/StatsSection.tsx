import React from 'react'

const stats = [
  { value: '10,000+', label: 'Active Members', icon: '👥' },
  { value: '$2M+', label: 'Total Saved', icon: '💰' },
  { value: '500+', label: 'Groups Created', icon: '🏦' },
  { value: '99.9%', label: 'Uptime', icon: '⚡' },
]

export const StatsSection: React.FC = () => (
  <section className="py-16 px-4 bg-gradient-to-r from-indigo-900 to-purple-900 border-y border-white/10">
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map(({ value, label, icon }) => (
          <div key={label} className="text-center">
            <div className="text-3xl mb-2">{icon}</div>
            <p className="text-3xl md:text-4xl font-extrabold text-white mb-1">{value}</p>
            <p className="text-white/50 text-sm">{label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
)
