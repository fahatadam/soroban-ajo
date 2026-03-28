'use client'

import React, { useState, useEffect, useRef } from 'react'

interface MobileNavProps {
  navItems: NavItem[]
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Trap focus inside drawer
  useEffect(() => {
    if (!isSidebarOpen || !drawerRef.current) return
    const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

  const handleNavigate = (view: string) => {
    onNavigate?.(view)
    setIsOpen(false)
    // Return focus to trigger after close
    triggerRef.current?.focus()
  }

  const handleClose = () => {
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus first menu item when opened
  useEffect(() => {
    if (isOpen) {
      const firstBtn = menuRef.current?.querySelector<HTMLButtonElement>('button')
      firstBtn?.focus()
    }
  }, [isOpen])

  return (
    <div className="lg:hidden">
      {/* Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-surface-900/50 backdrop-blur-sm animate-fade-in"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Slide-up drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={[
          'fixed bottom-0 left-0 right-0 z-50',
          'rounded-t-3xl border-t border-white/40 dark:border-white/10',
          'bg-white/90 dark:bg-surface-900/90',
          'supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:saturate-150',
          'shadow-2xl shadow-surface-900/20 dark:shadow-black/60',
          'transition-transform duration-300 ease-out',
          isSidebarOpen ? 'translate-y-0' : 'translate-y-full',
          'pb-safe', // safe-area-inset-bottom
        ].join(' ')}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1" aria-hidden="true">
          <div className="w-10 h-1 rounded-full bg-surface-300 dark:bg-surface-600" />
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-surface-100/60 dark:border-white/10">
          <span className="font-bold text-surface-900 dark:text-surface-50 text-lg">🪙 Ajo</span>
          <button
            onClick={closeSidebar}
            className="p-2 rounded-xl text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Close navigation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="px-4 py-3 space-y-1" aria-label="Mobile navigation">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                data-tour={item.dataTour}
                aria-current={active ? 'page' : undefined}
                className={[
                  'flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium',
                  'transition-all duration-200 outline-none',
                  'focus-visible:ring-2 focus-visible:ring-primary-500',
                  active
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-glow-sm'
                    : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800',
                ].join(' ')}
              >
                <svg
                  className={[
                    'w-5 h-5 flex-shrink-0 transition-transform duration-200',
                    active ? 'text-white' : 'text-surface-500 dark:text-surface-400',
                  ].join(' ')}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold flex items-center justify-center bg-primary-500 text-white animate-pulse-slow">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Wallet section */}
        <div className="px-5 py-4 border-t border-surface-100/60 dark:border-white/10">
          <div data-tour="wallet-connect">
            <WalletConnector />
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleClose}
            aria-hidden="true"
          />
          <nav
            id="mobile-nav-menu"
            ref={menuRef}
            className="fixed top-16 left-0 right-0 bg-white shadow-lg z-50 p-4"
            aria-label="Mobile navigation"
          >
            <div className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  aria-current={currentView === item.id ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    currentView === item.id
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span aria-hidden="true" className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </>
      )}
    </div>
  )
}
