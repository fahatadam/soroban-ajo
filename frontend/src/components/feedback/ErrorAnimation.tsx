import React, { useEffect } from 'react'
import { motion, useAnimation, Variants } from 'framer-motion'
import { prefersReducedMotion } from '../../utils/animations'

export interface ErrorAnimationProps {
  size?: number
  message?: string
  onComplete?: () => void
  className?: string
}

const circleVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
}

const crossVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut', delay: 0.4 },
  },
}

const containerVariants: Variants = {
  hidden: { scale: 0.6, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 350, damping: 22 },
  },
}

// Shake after appearing
const shakeVariants: Variants = {
  rest: { x: 0 },
  shake: {
    x: [-6, 6, -5, 5, -3, 3, 0],
    transition: { duration: 0.5, delay: 0.85 },
  },
}

const messageVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: 0.7 },
  },
}

export const ErrorAnimation: React.FC<ErrorAnimationProps> = ({
  size = 80,
  message = undefined,
  onComplete = undefined,
  className = undefined,
}: ErrorAnimationProps) => {
  const controls = useAnimation()
  const shakeControls = useAnimation()
  const reduced = prefersReducedMotion()

  useEffect(() => {
    if (reduced) {
      controls.set('visible')
      onComplete?.()
      return
    }

    const run = async () => {
      await controls.start('visible')
      await shakeControls.start('shake')
      onComplete?.()
    }

    run()
  }, [controls, shakeControls, reduced, onComplete])

  return (
    <div
      className={className}
      role="alert"
      aria-label={message ?? 'Error'}
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
    >
      <motion.div
        initial={reduced ? 'visible' : 'hidden'}
        animate={controls}
        variants={containerVariants}
        style={{ width: size, height: size }}
      >
        <motion.div
          initial="rest"
          animate={shakeControls}
          variants={shakeVariants}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 80 80"
            fill="none"
            aria-hidden="true"
          >
            {/* Background circle fill */}
            <motion.circle
              cx={40}
              cy={40}
              r={36}
              fill="#ef4444"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: reduced ? 0 : 0.3, ease: 'easeOut' }}
            />

            {/* Animated border circle */}
            <motion.circle
              cx={40}
              cy={40}
              r={36}
              stroke="#dc2626"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              initial="hidden"
              animate={controls}
              variants={circleVariants}
              style={{ rotate: -90, originX: '50%', originY: '50%' }}
            />

            {/* Cross line 1 */}
            <motion.path
              d="M26 26 L54 54"
              stroke="#ffffff"
              strokeWidth={5}
              strokeLinecap="round"
              fill="none"
              initial="hidden"
              animate={controls}
              variants={crossVariants}
            />

            {/* Cross line 2 — slight delay after line 1 */}
            <motion.path
              d="M54 26 L26 54"
              stroke="#ffffff"
              strokeWidth={5}
              strokeLinecap="round"
              fill="none"
              initial="hidden"
              animate={controls}
              variants={{
                hidden: { pathLength: 0, opacity: 0 },
                visible: {
                  pathLength: 1,
                  opacity: 1,
                  transition: { duration: 0.3, ease: 'easeOut', delay: 0.6 },
                },
              }}
            />
          </svg>
        </motion.div>
      </motion.div>

      {message && (
        <motion.p
          initial={reduced ? 'visible' : 'hidden'}
          animate={controls}
          variants={messageVariants}
          className="text-sm font-medium text-error-600 dark:text-error-500 text-center"
        >
          {message}
        </motion.p>
      )}
    </div>
  )
}
