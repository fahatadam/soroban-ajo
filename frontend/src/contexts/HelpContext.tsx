'use client'

import React, { createContext, useCallback, useContext, useState } from 'react'

export interface HelpTopic {
  id: string
  title: string
  content: string
  learnMoreUrl?: string
}

interface HelpContextValue {
  /** Currently open panel topic, null when panel is closed */
  activeTopic: HelpTopic | null
  openHelp: (topic: HelpTopic) => void
  closeHelp: () => void
  /** Whether the global help mode is on (highlights all help bubbles) */
  helpModeActive: boolean
  toggleHelpMode: () => void
}

const HelpContext = createContext<HelpContextValue | null>(null)

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const [activeTopic, setActiveTopic] = useState<HelpTopic | null>(null)
  const [helpModeActive, setHelpModeActive] = useState(false)

  const openHelp = useCallback((topic: HelpTopic) => setActiveTopic(topic), [])
  const closeHelp = useCallback(() => setActiveTopic(null), [])
  const toggleHelpMode = useCallback(() => setHelpModeActive((v: boolean) => !v), [])

  return (
    <HelpContext.Provider value={{ activeTopic, openHelp, closeHelp, helpModeActive, toggleHelpMode }}>
      {children}
    </HelpContext.Provider>
  )
}

export function useHelp(): HelpContextValue {
  const ctx = useContext(HelpContext)
  if (!ctx) throw new Error('useHelp must be used within a HelpProvider')
  return ctx
}
