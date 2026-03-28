import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { X } from 'lucide-react'
import { ShortcutDefinition } from '../hooks/useKeyboardShortcuts'
import { ShortcutHint } from './ShortcutHint'

export interface ShortcutModalProps {
  isOpen: boolean
  onClose: () => void
  shortcuts: ShortcutDefinition[]
}

/**
 * Full-screen modal listing all registered keyboard shortcuts grouped by category.
 * Triggered by pressing ? (or whatever shortcut you wire up).
 */
export const ShortcutModal: React.FC<ShortcutModalProps> = ({ isOpen, onClose, shortcuts }: ShortcutModalProps) => {
  const closeRef = useRef<HTMLButtonElement>(null)

  // Focus close button on open, restore focus on close
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => closeRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Group shortcuts by their `group` field
  const groups = React.useMemo(() => {
    const map = new Map<string, ShortcutDefinition[]>()
    for (const s of shortcuts) {
      const g = s.group ?? 'General'
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(s)
    }
    return map
  }, [shortcuts])

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcut-modal-title"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            className={clsx(
              'relative z-10 w-full max-w-lg max-h-[80vh] overflow-y-auto',
              'bg-white dark:bg-gray-900 rounded-2xl shadow-2xl',
              'border border-gray-200 dark:border-gray-700',
            )}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2
                id="shortcut-modal-title"
                className="text-base font-semibold text-gray-900 dark:text-gray-100"
              >
                Keyboard Shortcuts
              </h2>
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Close shortcuts"
                className={clsx(
                  'p-1.5 rounded-lg transition-colors',
                  'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                )}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Shortcut groups */}
            <div className="px-5 py-4 space-y-6">
              {Array.from(groups.entries()).map(([group, defs]: [string, ShortcutDefinition[]]) => (
                <div key={group}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                    {group}
                  </h3>
                  <ul className="space-y-1" role="list">
                    {defs.map((def: ShortcutDefinition) => (
                      <li
                        key={`${def.key}-${(def.modifiers ?? []).join('-')}`}
                        className={clsx(
                          'flex items-center justify-between gap-4',
                          'px-3 py-2 rounded-lg',
                          'hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors',
                        )}
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {def.description}
                        </span>
                        <ShortcutHint shortcut={def} size="md" className="flex-shrink-0" />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Footer hint */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <ShortcutHint shortcut={{ key: '?' }} size="sm" />
              <span className="text-xs text-gray-400 dark:text-gray-500">to toggle this panel</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
