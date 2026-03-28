'use client'

/**
 * FloatingSidebar
 *
 * Desktop-only floating sidebar (lg+). Fixed to the left edge with
 * glassmorphism background, gradient active states, icon micro-animations,
 * and notification badge pulse. Hidden below lg breakpoint.
 */

import React, { useId } from 'react'
import Link from 'next/link'
import { useNavigation } from '@/hooks/useNavigation'
import { NotificationBell } from './NotificationBell'
import { WalletConnector } from './WalletConnector'

interface NavItem {
  href: string
  label: string
  icon: string          // SVG path d= value
  dataTour?: string
  badge?: number | string
}

interface FloatingSidebarProps {
  navItems: NavItem[]
}

export const FloatingSidebar: React.FC<FloatingSidebarProps> = ({ navItems }) => {
  const { isActive } = useNavigation()
  const navId = useId()

  return (
    <aside
      id="floating-sidebar"
      aria-label="Main navigation"
      className={[
        // Layout
        'hidden lg:flex lg:flex-col',
        'fixed left-4 top-4 bottom-4 w-64 z-40',
        // Glassmorphism
        'rounded-2xl border border-white/50 dark:border-white/10',
        'bg-white/80 dark:bg-surface-900/80',
        'shadow-xl shadow-surface-900/10 dark:shadow-black/40',
        // Backdrop blur with solid fallback
        'supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:saturate-150',
        // Smooth entrance
        'animate-fade-in-up',
      ].join(' ')}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4 border-b border-surface-100/60 dark:border-white/10">
        <Link
          href="/"
          className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
          aria-label="Ajo home"
        >
          <span
            className="text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
            aria-hidden="true"
          >
            🪙
          </span>
          <div>
            <p className="font-bold text-surface-900 dark:text-surface-50 leading-none">Ajo</p>
            <p className="text-xs text-surface-400 dark:text-surface-500 leading-none mt-0.5">
              Decentralized Savings
            </p>
          </div>
        </Link>
      </div>

      {/* Nav items */}
      <nav
        id={navId}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
        aria-label="Site navigation"
      >
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.dataTour}
              aria-current={active ? 'page' : undefined}
              className={[
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                'transition-all duration-200 outline-none',
                'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
                active
                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-glow-sm'
                  : [
                      'text-surface-600 dark:text-surface-400',
                      'hover:bg-gradient-to-r hover:from-primary-500/10 hover:to-accent-500/10',
                      'hover:text-surface-900 dark:hover:text-surface-100',
                    ].join(' '),
              ].join(' ')}
            >
              {/* Icon */}
              <svg
                className={[
                  'w-5 h-5 flex-shrink-0 transition-transform duration-200',
                  'group-hover:scale-110',
                  active ? 'text-white' : 'text-surface-500 dark:text-surface-400 group-hover:text-primary-500',
                ].join(' ')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>

              {/* Label */}
              <span className="flex-1">{item.label}</span>

              {/* Badge */}
              {item.badge !== undefined && (
                <span
                  className="ml-auto min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold flex items-center justify-center bg-primary-500 text-white animate-pulse-slow"
                  aria-label={`${item.badge} notifications`}
                >
                  {item.badge}
                </span>
              )}

              {/* Active indicator bar */}
              {active && (
                <span
                  className="absolute right-0 w-1 h-6 rounded-l-full bg-white/60"
                  aria-hidden="true"
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: wallet + notifications */}
      <div className="px-4 pb-5 pt-3 border-t border-surface-100/60 dark:border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider">
            Wallet
          </span>
          <NotificationBell />
        </div>
        <div data-tour="wallet-connect">
          <WalletConnector />
        </div>
      </div>
    </aside>
  )
}
