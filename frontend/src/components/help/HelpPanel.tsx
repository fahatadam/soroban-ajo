'use client'

import React, { useEffect, useRef } from 'react'
import { useHelp } from '../../contexts/HelpContext'

export default function HelpPanel() {
  const { activeTopic, closeHelp } = useHelp()
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!activeTopic) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeHelp()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [activeTopic, closeHelp])

  // Focus trap: move focus into panel when it opens
  useEffect(() => {
    if (activeTopic) panelRef.current?.focus()
  }, [activeTopic])

  if (!activeTopic) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
        onClick={closeHelp}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-panel-title"
        tabIndex={-1}
        className={[
          'fixed right-0 top-0 z-50 h-full w-80 max-w-full',
          'bg-white dark:bg-gray-900 shadow-2xl flex flex-col',
          'outline-none',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2
            id="help-panel-title"
            className="text-base font-semibold text-gray-900 dark:text-white"
          >
            {activeTopic.title}
          </h2>
          <button
            type="button"
            onClick={closeHelp}
            aria-label="Close help panel"
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {activeTopic.content}
          </p>
        </div>

        {/* Footer */}
        {activeTopic.learnMoreUrl && (
          <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700">
            <a
              href={activeTopic.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Learn more →
            </a>
          </div>
        )}
      </div>
    </>
  )
}
