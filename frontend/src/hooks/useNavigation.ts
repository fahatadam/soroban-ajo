'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Return type for the navigation hook.
 */
interface UseNavigationReturn {
  /** True if the mobile/collapsible sidebar is currently visible */
  isSidebarOpen: boolean
  openSidebar: () => void
  closeSidebar: () => void
  toggleSidebar: () => void
  /** Checks if a given URL is active (matches current route) */
  isActive: (href: string) => boolean
}

/**
 * Custom hook to manage application-wide navigation state.
 * Handles sidebar visibility, automatic sidebar closing on route changes,
 * and identifying active navigation links.
 * 
 * @returns Navigation state and control functions
 */
export function useNavigation(): UseNavigationReturn {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSidebarOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isSidebarOpen])

  const openSidebar = useCallback(() => setIsSidebarOpen(true), [])
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])
  const toggleSidebar = useCallback(() => setIsSidebarOpen((v) => !v), [])

  const isActive = useCallback(
    (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href),
    [pathname],
  )

  return { isSidebarOpen, openSidebar, closeSidebar, toggleSidebar, isActive }
}
