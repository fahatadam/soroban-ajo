import React, { useEffect } from 'react'
import { motion, useAnimation, Variants } from 'framer-motion'
import { prefersReducedMotion } from '../../utils/animations'

export interface SuccessAnimationProps {
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

const checkVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut', delay: 0.4 },
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

const messageVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: 0.7 },
  },
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  size = 80,
  message = undefined,
  onComplete = undefined,
  className = undefined,
}: SuccessAnimationProps) => {
  const controls = useAnimation()
  const reduced = prefersReducedMotion()

  useEffect(() => {
    if (reduced) {
      controls.set('visible')
      onComplete?.()
      return
    }

    controls.start('visible').then(() => {
      onComplete?.()
    })
  }, [controls, reduced, onComplete])

  return (
    <div
      className={className}
      role="status"
      aria-label={message ?? 'Success'}
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
    >
      <motion.div
        initial={reduced ? 'visible' : 'hidden'}
        animate={controls}
        variants={containerVariants}
        style={{ width: size, height: size }}
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
            fill="#10b981"
            initial={{ scale: 0, opacity: 0 }}
            animate={reduced ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1 }}
            transition={{ duration: reduced ? 0 : 0.3, ease: 'easeOut' }}
          />

          {/* Animated border circle */}
          <motion.circle
            cx={40}
            cy={40}
            r={36}
            stroke="#059669"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            initial="hidden"
            animate={controls}
            variants={circleVariants}
            style={{ rotate: -90, originX: '50%', originY: '50%' }}
          />

          {/* Checkmark */}
          <motion.path
            d="M22 40 L34 52 L58 28"
            stroke="#ffffff"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial="hidden"
            animate={controls}
            variants={checkVariants}
          />
        </svg>
      </motion.div>

      {message && (
        <motion.p
          initial={reduced ? 'visible' : 'hidden'}
          animate={controls}
          variants={messageVariants}
          className="text-sm font-medium text-success-600 dark:text-success-500 text-center"
        >
          {message}
        </motion.p>
      )}
    </div>
  )
}
