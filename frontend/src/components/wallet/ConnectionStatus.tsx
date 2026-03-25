'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { statusPulseVariants, checkmarkVariants } from '../../animations/walletAnimations';

export type ConnectionState = 'idle' | 'connecting' | 'success' | 'error';

interface ConnectionStatusProps {
  state: ConnectionState;
  message?: string;
  className?: string;
}

/**
 * Animated connection status indicator with contextual icon and message.
 * Shows a spinner while connecting, checkmark on success, and X on error.
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = memo(({ state, message, className = '' }) => {
  if (state === 'idle') return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl ${getStatusStyles(state)} ${className}`}
      role="status"
      aria-live="polite"
    >
      <StatusIcon state={state} />
      {message && (
        <span className="text-sm font-medium">{message}</span>
      )}
    </motion.div>
  );
});

ConnectionStatus.displayName = 'ConnectionStatus';

function getStatusStyles(state: ConnectionState): string {
  switch (state) {
    case 'connecting':
      return 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800';
    case 'success':
      return 'bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-500 border border-success-100 dark:border-success-700';
    case 'error':
      return 'bg-error-50 dark:bg-error-500/10 text-error-700 dark:text-error-500 border border-error-100 dark:border-error-700';
    default:
      return '';
  }
}

const StatusIcon: React.FC<{ state: ConnectionState }> = memo(({ state }) => {
  if (state === 'connecting') {
    return (
      <motion.div
        variants={statusPulseVariants}
        animate="connecting"
        className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin"
        aria-label="Connecting"
      />
    );
  }

  if (state === 'success') {
    return (
      <motion.svg
        variants={statusPulseVariants}
        animate="success"
        className="w-5 h-5"
        viewBox="0 0 20 20"
        fill="none"
        aria-label="Connected"
      >
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <motion.path
          variants={checkmarkVariants}
          initial="hidden"
          animate="visible"
          d="M6 10L9 13L14 7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </motion.svg>
    );
  }

  if (state === 'error') {
    return (
      <motion.svg
        variants={statusPulseVariants}
        animate="error"
        className="w-5 h-5"
        viewBox="0 0 20 20"
        fill="none"
        aria-label="Error"
      >
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M7 7L13 13M13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </motion.svg>
    );
  }

  return null;
});

StatusIcon.displayName = 'StatusIcon';
