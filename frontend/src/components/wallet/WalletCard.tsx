'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { walletCardVariants } from '../../animations/walletAnimations';
import { WalletIcon } from './WalletIcon';
import type { WalletType } from '../../types/wallet';

interface WalletCardProps {
  name: string;
  type: WalletType;
  isInstalled: boolean;
  isLoading: boolean;
  isSelected: boolean;
  onSelect: (type: WalletType) => void;
}

const installUrls: Record<string, string> = {
  freighter: 'https://www.freighter.app/',
  lobstr: 'https://lobstr.co/',
};

/**
 * Interactive wallet card with hover effects, installation status,
 * and visual feedback for the selected state.
 */
export const WalletCard: React.FC<WalletCardProps> = memo(({
  name,
  type,
  isInstalled,
  isLoading,
  isSelected,
  onSelect,
}) => {
  const isSupportedIcon = type === 'freighter' || type === 'lobstr';

  return (
    <motion.div variants={walletCardVariants}>
      <button
        onClick={() => isInstalled && onSelect(type)}
        disabled={!isInstalled || isLoading}
        className={`
          group relative w-full p-4 rounded-xl text-left
          transition-all duration-200 ease-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
          dark:focus-visible:ring-offset-surface-900
          ${isInstalled
            ? `border border-surface-200 dark:border-surface-700
               hover:border-primary-400 dark:hover:border-primary-500
               hover:shadow-card-hover hover:bg-primary-50/50 dark:hover:bg-primary-900/20
               ${isSelected ? 'border-primary-500 dark:border-primary-400 bg-primary-50/70 dark:bg-primary-900/30 shadow-glow-sm' : 'bg-white dark:bg-surface-800'}`
            : 'border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 opacity-60 cursor-not-allowed'
          }
        `}
        aria-label={isInstalled ? `Connect with ${name}` : `${name} - not installed`}
      >
        {/* Gradient border glow on hover */}
        {isInstalled && (
          <div className="absolute inset-0 rounded-xl bg-gradient-stellar opacity-0 group-hover:opacity-10 transition-opacity duration-200 pointer-events-none" />
        )}

        <div className="relative flex items-center gap-4">
          {/* Wallet icon */}
          <div className={`
            flex-shrink-0 rounded-xl p-2
            transition-transform duration-200
            ${isInstalled ? 'group-hover:scale-110' : ''}
          `}>
            {isSupportedIcon ? (
              <WalletIcon wallet={type} size={36} />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-surface-200 dark:bg-surface-700 flex items-center justify-center">
                <span className="text-sm font-bold text-surface-500">{name.charAt(0)}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-surface-900 dark:text-white text-sm">
              {name}
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
              {isInstalled ? 'Ready to connect' : 'Not installed'}
            </p>
          </div>

          {/* Status badge */}
          <div className="flex-shrink-0">
            {isInstalled ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-500">
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                Available
              </span>
            ) : (
              <a
                href={installUrls[type] || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-warning-500 hover:underline"
              >
                Install
              </a>
            )}
          </div>
        </div>
      </button>
    </motion.div>
  );
});

WalletCard.displayName = 'WalletCard';
