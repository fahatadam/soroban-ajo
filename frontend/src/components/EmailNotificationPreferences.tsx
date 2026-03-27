'use client'

import React from 'react'
import { Mail, ShieldAlert, Info } from 'lucide-react'
import type {
  EmailNotificationPreferences as EmailPrefs,
  EmailFrequency,
} from '@/types/profile'
import { defaultEmailPreferences } from '@/types/profile'

interface Props {
  value: EmailPrefs | undefined
  onChange: (value: EmailPrefs) => void
  /** User's verified email address — shown as context */
  email?: string
}

// ─── Event definitions ────────────────────────────────────────────────────────

type EventKey = keyof EmailPrefs['events']

interface EventDef {
  key: EventKey
  label: string
  description: string
  icon: string
  category: 'contributions' | 'groups' | 'account'
}

const EVENT_DEFS: EventDef[] = [
  // Contributions
  { key: 'contributionDue24h',  label: 'Contribution due in 24 hours', description: 'Reminder the day before your contribution is due',       icon: '⏰', category: 'contributions' },
  { key: 'contributionDue1h',   label: 'Contribution due in 1 hour',   description: 'Last-minute reminder before your contribution is due',   icon: '⚡', category: 'contributions' },
  { key: 'contributionOverdue', label: 'Contribution overdue',         description: 'Alert when a contribution deadline has passed',          icon: '⚠️', category: 'contributions' },
  { key: 'payoutReceived',      label: 'Payout received',              description: 'Confirmation when you receive a group payout',           icon: '💰', category: 'contributions' },
  // Groups
  { key: 'memberJoined',        label: 'New member joined',            description: 'When someone joins one of your groups',                  icon: '👥', category: 'groups' },
  { key: 'cycleCompleted',      label: 'Cycle completed',              description: 'When a group savings cycle finishes',                    icon: '✅', category: 'groups' },
  { key: 'announcements',       label: 'Group announcements',          description: 'Messages posted by group admins',                        icon: '📢', category: 'groups' },
  { key: 'groupInvitation',     label: 'Group invitation',             description: 'When you are invited to join a savings group',           icon: '✉️', category: 'groups' },
  // Account
  { key: 'securityAlerts',      label: 'Security alerts',              description: 'Important account security notifications (recommended)', icon: '🔒', category: 'account' },
]

const CATEGORIES: { id: EventDef['category']; label: string }[] = [
  { id: 'contributions', label: 'Contributions' },
  { id: 'groups',        label: 'Groups' },
  { id: 'account',       label: 'Account' },
]

const FREQUENCY_OPTIONS: { value: EmailFrequency; label: string; description: string }[] = [
  { value: 'instant', label: 'Instant',       description: 'Send each email as events happen' },
  { value: 'daily',   label: 'Daily digest',  description: 'Bundle all events into one daily email' },
  { value: 'weekly',  label: 'Weekly digest', description: 'Bundle all events into one weekly email' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
        checked ? 'bg-blue-600 dark:bg-indigo-500' : 'bg-gray-300 dark:bg-slate-600'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EmailNotificationPreferences({ value, onChange, email }: Props) {
  const prefs: EmailPrefs = value ?? defaultEmailPreferences

  const update = (patch: Partial<EmailPrefs>) => onChange({ ...prefs, ...patch })

  const toggleEvent = (key: EventKey) => {
    // Security alerts cannot be disabled
    if (key === 'securityAlerts') return
    update({ events: { ...prefs.events, [key]: !prefs.events[key] } })
  }

  const allInCategory = (cat: EventDef['category']) =>
    EVENT_DEFS.filter((e) => e.category === cat && e.key !== 'securityAlerts').every(
      (e) => prefs.events[e.key]
    )

  const toggleCategory = (cat: EventDef['category']) => {
    const keys = EVENT_DEFS.filter((e) => e.category === cat && e.key !== 'securityAlerts').map((e) => e.key)
    const next = !allInCategory(cat)
    const patch = Object.fromEntries(keys.map((k) => [k, next])) as Partial<EmailPrefs['events']>
    update({ events: { ...prefs.events, ...patch } })
  }

  return (
    <div className="space-y-6">

      {/* Master toggle + email address */}
      <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 dark:bg-slate-700/40 rounded-xl border border-gray-200 dark:border-slate-600">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">Email Notifications</p>
            {email ? (
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Sending to <span className="font-medium text-gray-700 dark:text-slate-300">{email}</span>
              </p>
            ) : (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                <Info className="w-3 h-3" /> Add an email address in your profile to enable
              </p>
            )}
          </div>
        </div>
        <Toggle
          checked={prefs.enabled}
          onChange={() => update({ enabled: !prefs.enabled })}
          disabled={!email}
        />
      </div>

      {/* Frequency selector */}
      <div className={prefs.enabled && email ? '' : 'opacity-40 pointer-events-none'}>
        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Delivery frequency</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FREQUENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ frequency: opt.value })}
              className={`text-left p-3 rounded-xl border-2 transition-colors ${
                prefs.frequency === opt.value
                  ? 'border-blue-500 dark:border-indigo-400 bg-blue-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
              }`}
            >
              <p className={`text-sm font-semibold ${prefs.frequency === opt.value ? 'text-blue-700 dark:text-indigo-300' : 'text-gray-900 dark:text-slate-100'}`}>
                {opt.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Per-event toggles grouped by category */}
      <div className={`space-y-5 ${prefs.enabled && email ? '' : 'opacity-40 pointer-events-none'}`}>
        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">Notify me about</p>

        {CATEGORIES.map((cat) => {
          const events = EVENT_DEFS.filter((e) => e.category === cat.id)
          const nonSecurity = events.filter((e) => e.key !== 'securityAlerts')

          return (
            <div key={cat.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
              {/* Category header with select-all */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  {cat.label}
                </p>
                {nonSecurity.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className="text-xs text-blue-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    {allInCategory(cat.id) ? 'Disable all' : 'Enable all'}
                  </button>
                )}
              </div>

              {/* Events */}
              <div className="divide-y divide-gray-100 dark:divide-slate-700">
                {events.map((ev) => (
                  <div
                    key={ev.key}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-base flex-shrink-0">{ev.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                          {ev.label}
                          {ev.key === 'securityAlerts' && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400">
                              <ShieldAlert className="w-3 h-3" /> always on
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{ev.description}</p>
                      </div>
                    </div>
                    <Toggle
                      checked={prefs.events[ev.key]}
                      onChange={() => toggleEvent(ev.key)}
                      disabled={ev.key === 'securityAlerts'}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
