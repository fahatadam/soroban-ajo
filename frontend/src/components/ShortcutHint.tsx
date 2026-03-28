import React from 'react'
import clsx from 'clsx'
import { ShortcutDefinition, formatShortcut } from '../hooks/useKeyboardShortcuts'

export interface ShortcutHintProps {
  /** Pass a full ShortcutDefinition or just key + modifiers inline */
  shortcut: Pick<ShortcutDefinition, 'key' | 'modifiers'>
  className?: string
  size?: 'sm' | 'md'
}

/**
 * Renders individual keyboard key badges for a shortcut.
 * e.g. <ShortcutHint shortcut={{ key: 'k', modifiers: ['ctrl'] }} />
 * renders  ⌘  K  on Mac,  Ctrl  +  K  on Windows
 */
export const ShortcutHint: React.FC<ShortcutHintProps> = ({
  shortcut,
  className,
  size = 'sm',
}: ShortcutHintProps) => {
  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)
  const mods = shortcut.modifiers ?? []

  const keys: string[] = []
  if (mods.includes('ctrl')) keys.push(isMac ? '⌘' : 'Ctrl')
  if (mods.includes('meta')) keys.push('⌘')
  if (mods.includes('alt')) keys.push(isMac ? '⌥' : 'Alt')
  if (mods.includes('shift')) keys.push(isMac ? '⇧' : 'Shift')

  const mainKey =
    shortcut.key === ' ' ? 'Space' : shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key
  keys.push(mainKey)

  const kbdClass = clsx(
    'inline-flex items-center justify-center rounded border font-mono font-medium leading-none',
    'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600',
    'text-gray-600 dark:text-gray-400',
    size === 'sm' ? 'px-1.5 py-0.5 text-[10px] min-w-[18px]' : 'px-2 py-1 text-xs min-w-[22px]',
  )

  const separatorClass = clsx(
    'text-gray-400 dark:text-gray-600 select-none',
    size === 'sm' ? 'text-[10px]' : 'text-xs',
  )

  return (
    <span
      className={clsx('inline-flex items-center gap-0.5', className)}
      aria-label={formatShortcut(shortcut)}
    >
      {keys.map((k, i) => (
        <React.Fragment key={k}>
          {i > 0 && !isMac && <span className={separatorClass} aria-hidden="true">+</span>}
          <kbd className={kbdClass}>{k}</kbd>
        </React.Fragment>
      ))}
    </span>
  )
}
