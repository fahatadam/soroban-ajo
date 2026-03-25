'use client';

import React, { memo } from 'react';

interface WalletIconProps {
  wallet: 'freighter' | 'lobstr';
  className?: string;
  size?: number;
}

/**
 * SVG icons for supported Stellar wallets.
 * Each icon is a simplified, recognizable mark that works at small sizes.
 */
export const WalletIcon: React.FC<WalletIconProps> = memo(({ wallet, className = '', size = 32 }) => {
  if (wallet === 'freighter') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="8" fill="#4F46E5" />
        <path
          d="M16 6L22 12L16 18L10 12L16 6Z"
          fill="white"
          opacity="0.9"
        />
        <path
          d="M16 14L22 20L16 26L10 20L16 14Z"
          fill="white"
          opacity="0.6"
        />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="#F59E0B" />
      <circle cx="16" cy="14" r="5" fill="white" opacity="0.9" />
      <path
        d="M8 24C8 20.6863 10.6863 18 14 18H18C21.3137 18 24 20.6863 24 24V26H8V24Z"
        fill="white"
        opacity="0.6"
      />
    </svg>
  );
});

WalletIcon.displayName = 'WalletIcon';
