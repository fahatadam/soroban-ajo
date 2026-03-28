/**
 * Theme utility helpers
 * Issue #321: Polished dark mode with smooth transitions
 */

export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'soroban-ajo-theme'

/**
 * Read the stored theme preference from localStorage.
 * 
 * @returns 'light', 'dark', or 'system'
 */
export function getStoredTheme(): 'light' | 'dark' | 'system' {
  if (typeof window === 'undefined') return 'system'
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    // ignore
  }
  return 'system'
}

/**
 * Detect the OS-level color scheme preference using matchMedia.
 * 
 * @returns 'light' or 'dark'
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Apply the selected theme to the document and persist the choice.
 * Manages the 'light'/'dark' classes on the root element.
 * 
 * @param theme - The theme to apply
 * @returns The resolved theme ('light' or 'dark')
 */
export function applyTheme(theme: 'light' | 'dark' | 'system'): ResolvedTheme {
  const resolved = theme === 'system' ? getSystemTheme() : theme
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // ignore
  }
  return resolved
}

/**
 * Returns Tailwind classes for a surface that adapts to dark mode.
 * Useful for components where standard utility classes are insufficient.
 * 
 * @param elevated - Whether the surface should appear raised
 * @returns String of Tailwind classes
 */
export function surfaceClasses(elevated = false): string {
  return elevated
    ? 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700'
    : 'bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border'
}

/**
 * Returns Tailwind text color classes based on importance.
 * 
 * @param variant - 'primary', 'secondary', or 'muted'
 * @returns Tailwind text color class
 */
export function textClasses(variant: 'primary' | 'secondary' | 'muted' = 'primary'): string {
  const map = {
    primary: 'text-gray-900 dark:text-slate-100',
    secondary: 'text-gray-600 dark:text-slate-400',
    muted: 'text-gray-400 dark:text-slate-500',
  }
  return map[variant]
}
