import { useEffect, useCallback, useRef } from 'react'

export type ModifierKey = 'ctrl' | 'meta' | 'shift' | 'alt'

export interface ShortcutDefinition {
  /** Key label shown in the UI, e.g. 'K', '/', 'Escape' */
  key: string
  /** Modifier keys required */
  modifiers?: ModifierKey[]
  /** Human-readable description shown in the shortcut modal */
  description: string
  /** Grouping label for the shortcut modal */
  group?: string
  /** Handler to invoke */
  handler: () => void
  /** Skip when focus is inside an input/textarea/select */
  ignoreInInputs?: boolean
  /** Whether the shortcut is currently enabled */
  enabled?: boolean
}

export interface UseKeyboardShortcutsOptions {
  /** Set to false to disable all shortcuts (e.g. when a modal is open) */
  enabled?: boolean
}

function matchesEvent(e: KeyboardEvent, def: ShortcutDefinition): boolean {
  const mods = def.modifiers ?? []
  const needsCtrl = mods.includes('ctrl')
  const needsMeta = mods.includes('meta')
  const needsShift = mods.includes('shift')
  const needsAlt = mods.includes('alt')

  // On Mac, treat Cmd (meta) as equivalent to Ctrl when ctrl is specified
  const ctrlOrMeta = needsCtrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey
  const metaMatch = needsMeta ? e.metaKey : !needsCtrl && !e.metaKey
  const shiftMatch = needsShift ? e.shiftKey : !e.shiftKey
  const altMatch = needsAlt ? e.altKey : !e.altKey

  const keyMatch = e.key.toLowerCase() === def.key.toLowerCase()

  if (needsCtrl) return keyMatch && ctrlOrMeta && shiftMatch && altMatch
  return keyMatch && metaMatch && shiftMatch && altMatch
}

function isInputFocused(): boolean {
  const tag = document.activeElement?.tagName.toLowerCase()
  const isContentEditable = (document.activeElement as HTMLElement)?.isContentEditable
  return tag === 'input' || tag === 'textarea' || tag === 'select' || !!isContentEditable
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutDefinition[],
  options: UseKeyboardShortcutsOptions = {},
) {
  const { enabled = true } = options
  // Keep a stable ref so the event listener doesn't need to re-register on every render
  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    for (const def of shortcutsRef.current) {
      if (def.enabled === false) continue
      if (def.ignoreInInputs !== false && isInputFocused()) continue
      if (matchesEvent(e, def)) {
        e.preventDefault()
        def.handler()
        break
      }
    }
  }, [enabled])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/** Format a shortcut definition into a display string, e.g. "⌘K" or "Ctrl+K" */
export function formatShortcut(def: Pick<ShortcutDefinition, 'key' | 'modifiers'>): string {
  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)
  const parts: string[] = []
  const mods = def.modifiers ?? []

  if (mods.includes('ctrl')) parts.push(isMac ? '⌘' : 'Ctrl')
  if (mods.includes('meta')) parts.push('⌘')
  if (mods.includes('alt')) parts.push(isMac ? '⌥' : 'Alt')
  if (mods.includes('shift')) parts.push(isMac ? '⇧' : 'Shift')

  const key = def.key === ' ' ? 'Space' : def.key.length === 1 ? def.key.toUpperCase() : def.key
  parts.push(key)

  return isMac ? parts.join('') : parts.join('+')
}
