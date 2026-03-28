'use client'

import React, { useRef, useState } from 'react'
import { useHelp, HelpTopic } from '../../contexts/HelpContext'

interface HelpBubbleProps {
  topic: HelpTopic
  /** Inline tooltip position when no panel is used */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** If true, clicking opens the HelpPanel instead of an inline tooltip */
  usePanel?: boolean
  className?: string
}

const POSITION_CLASSES: Record<string, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const ARROW_CLASSES: Record<string, string> = {
  top: 'bottom-[-4px] left-1/2 -translate-x-1/2',
  bottom: 'top-[-4px] left-1/2 -translate-x-1/2',
  left: 'right-[-4px] top-1/2 -translate-y-1/2',
  right: 'left-[-4px] top-1/2 -translate-y-1/2',
}

export default function HelpBubble({
  topic,
  position = 'top',
  usePanel = false,
  className = '',
}: HelpBubbleProps) {
  const { openHelp, helpModeActive } = useHelp()
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = () => {
    if (usePanel) return
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setTooltipVisible(true)
  }

  const handleMouseLeave = () => {
    if (usePanel) return
    hideTimer.current = setTimeout(() => setTooltipVisible(false), 150)
  }

  const handleClick = () => {
    if (usePanel) {
      openHelp(topic)
    } else {
      setTooltipVisible((v: boolean) => !v)
    }
  }

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        aria-label={`Help: ${topic.title}`}
        aria-haspopup={usePanel ? 'dialog' : 'true'}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={[
          'inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full',
          'border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
          helpModeActive
            ? 'text-white bg-blue-500 border-blue-500 animate-pulse'
            : 'text-blue-600 border-blue-400 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-500 dark:hover:bg-blue-900/20',
        ].join(' ')}
      >
        ?
      </button>

      {/* Inline tooltip (shown when usePanel is false) */}
      {!usePanel && tooltipVisible && (
        <span
          role="tooltip"
          className={`absolute z-50 ${POSITION_CLASSES[position]} w-64 pointer-events-none`}
        >
          <span className="block bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg px-3 py-2 shadow-lg">
            <span className="block font-semibold mb-1">{topic.title}</span>
            {topic.content}
            <span
              className={`absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 ${ARROW_CLASSES[position]}`}
            />
          </span>
        </span>
      )}
    </span>
  )
}
