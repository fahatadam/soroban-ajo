'use client';

import React, { useEffect, useCallback, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useWallet } from '../hooks/useWallet';
import { WalletCard } from './wallet/WalletCard';
import { ConnectionStatus, ConnectionState } from './wallet/ConnectionStatus';
import {
  backdropVariants,
  modalVariants,
  walletListVariants,
} from '../animations/walletAnimations';
import type { WalletType, WalletInfo } from '../types/wallet';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect?: (address: string) => void;
  onError?: (error: string) => void;
  showNetworkSelector?: boolean;
}

/**
 * Redesigned wallet connection modal with glassmorphism, smooth animations,
 * keyboard accessibility, and mobile-responsive layout.
 *
 * Supports Freighter and Lobstr wallets with installation status detection.
 */
export const WalletModal: React.FC<WalletModalProps> = memo(({
  isOpen,
  onClose,
  onConnect,
  onError,
  showNetworkSelector = false,
}) => {
  const {
    isLoading,
    error,
    availableWallets,
    connect,
  } = useWallet();

  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<'testnet' | 'mainnet' | 'futurenet'>('testnet');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setConnectionState('idle');
      setStatusMessage('');
      setSelectedWallet(null);
    }
  }, [isOpen]);

  // Keyboard: ESC to close
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const handleWalletSelect = useCallback(async (walletType: WalletType) => {
    setSelectedWallet(walletType);
    setConnectionState('connecting');
    setStatusMessage('Connecting to wallet...');

    const result = await connect({
      walletType,
      network: selectedNetwork,
    });

    if (result.success) {
      setConnectionState('success');
      setStatusMessage('Connected successfully');
      if (result.address && onConnect) {
        onConnect(result.address);
      }
      // Auto-close after success
      setTimeout(() => onClose(), 1200);
    } else {
      setConnectionState('error');
      const msg = result.error?.message || 'Connection failed. Please try again.';
      setStatusMessage(msg);
      if (onError && result.error) {
        onError(result.error.message);
      }
    }
  }, [connect, selectedNetwork, onConnect, onError, onClose]);

  // Filter to Freighter and Lobstr only (per issue requirements)
  const supportedWallets = availableWallets.filter(
    (w: WalletInfo) => w.type === 'freighter' || w.type === 'lobstr'
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-modal flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Connect wallet"
        >
          {/* Backdrop with blur */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-surface-950/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal panel */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="
              relative w-full max-w-md
              rounded-2xl overflow-hidden
              bg-white/90 dark:bg-surface-900/90
              backdrop-blur-xl
              border border-surface-200/60 dark:border-surface-700/40
              shadow-xl
            "
          >
            {/* Gradient top accent */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-stellar" />

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo-icon.svg"
                    alt="Soroban Ajo"
                    width={32}
                    height={32}
                    className="transition-transform duration-200 hover:scale-105"
                    priority
                  />
                  <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                    Connect Wallet
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="
                    p-2 rounded-lg
                    text-surface-400 hover:text-surface-600
                    dark:text-surface-500 dark:hover:text-surface-300
                    hover:bg-surface-100 dark:hover:bg-surface-800
                    transition-colors duration-150
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
                  "
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Network selector */}
              {showNetworkSelector && (
                <div className="mb-5">
                  <label
                    htmlFor="wallet-network-select"
                    className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5"
                  >
                    Network
                  </label>
                  <select
                    id="wallet-network-select"
                    value={selectedNetwork}
                    onChange={(e) => setSelectedNetwork(e.target.value as 'testnet' | 'mainnet' | 'futurenet')}
                    className="
                      w-full px-3 py-2 rounded-lg text-sm
                      border border-surface-200 dark:border-surface-700
                      bg-white dark:bg-surface-800
                      text-surface-900 dark:text-white
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
                      transition-colors duration-150
                    "
                  >
                    <option value="testnet">Testnet</option>
                    <option value="mainnet">Mainnet</option>
                    <option value="futurenet">Futurenet</option>
                  </select>
                </div>
              )}

              {/* Connection status */}
              <AnimatePresence>
                {connectionState !== 'idle' && (
                  <div className="mb-4">
                    <ConnectionStatus state={connectionState} message={statusMessage} />
                  </div>
                )}
              </AnimatePresence>

              {/* Wallet list */}
              <motion.div
                variants={walletListVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                  Choose a wallet
                </p>
                {supportedWallets.map((wallet: WalletInfo) => (
                  <WalletCard
                    key={wallet.type}
                    name={wallet.name}
                    type={wallet.type}
                    isInstalled={wallet.isInstalled}
                    isLoading={isLoading}
                    isSelected={selectedWallet === wallet.type}
                    onSelect={handleWalletSelect}
                  />
                ))}
              </motion.div>

              {/* No wallets installed hint */}
              {supportedWallets.every((w: WalletInfo) => !w.isInstalled) && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-xs text-center text-surface-500 dark:text-surface-400"
                >
                  Install a supported wallet extension to continue.
                </motion.p>
              )}

              {/* Error from hook */}
              <AnimatePresence>
                {error && connectionState === 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-3 rounded-xl bg-error-50 dark:bg-error-500/10 border border-error-100 dark:border-error-700"
                    role="alert"
                    aria-live="polite"
                  >
                    <p className="text-sm text-error-700 dark:text-error-500">{error.message}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

WalletModal.displayName = 'WalletModal';
