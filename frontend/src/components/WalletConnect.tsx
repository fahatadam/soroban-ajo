'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { WalletModal } from './WalletModal';
import Image from 'next/image';

interface WalletConnectProps {
    onConnect?: (address: string) => void;
    onDisconnect?: () => void;
    onError?: (error: string) => void;
    className?: string;
    showNetworkSelector?: boolean;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
    onConnect,
    onDisconnect,
    onError,
    className = '',
    showNetworkSelector = false,
}) => {
    const {
        isLoading,
        error,
        disconnect,
        isConnected,
        address,
        walletType,
        network,
    } = useWallet();

    const [isModalOpen, setIsModalOpen] = useState(false);

    // Notify parent component on connection
    useEffect(() => {
        if (isConnected && address && onConnect) {
            onConnect(address);
        }
    }, [isConnected, address, onConnect]);

    // Notify parent component on error
    useEffect(() => {
        if (error && onError) {
            onError(error.message);
        }
    }, [error, onError]);

    const handleDisconnect = () => {
        disconnect();
        if (onDisconnect) {
            onDisconnect();
        }
    };

    const formatAddress = (addr: string): string => {
        if (!addr) return '';
        return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
    };

    if (isConnected && address) {
        return (
            <div className={`wallet-connect-container ${className}`}>
                <div className="flex items-center gap-3 p-4 glass-card border-success-200/60 dark:border-success-700/30 rounded-xl">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="inline-block w-2 h-2 bg-success-500 rounded-full" />
                            <span className="text-sm font-medium text-success-700 dark:text-success-500">
                                Connected via {walletType === 'freighter' ? 'Freighter' : walletType === 'lobstr' ? 'Lobstr' : 'Albedo'}
                            </span>
                        </div>
                        <div className="text-xs text-surface-500 dark:text-surface-400 font-mono" title={address}>
                            {formatAddress(address)}
                        </div>
                        {showNetworkSelector && (
                            <div className="text-xs text-surface-400 mt-1">
                                Network: <span className="font-medium">{network}</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleDisconnect}
                        className="px-3 py-1.5 text-sm text-error-600 hover:text-error-700 hover:bg-error-50 dark:hover:bg-error-500/10 rounded-lg transition-colors duration-150"
                        aria-label="Disconnect wallet"
                    >
                        Disconnect
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`wallet-connect-container ${className}`}>
            {/* Logo Section */}
            <div className="flex justify-center mb-6">
                <Image
                    src="/logo-icon.svg"
                    alt="Soroban Ajo"
                    width={60}
                    height={60}
                    className="transition-transform duration-300 hover:scale-105"
                    priority
                />
            </div>

            <div className="space-y-3">
                <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={isLoading}
                    className="
                        w-full px-4 py-3
                        bg-gradient-stellar hover:opacity-90
                        disabled:opacity-50 disabled:cursor-not-allowed
                        text-white font-medium rounded-xl
                        transition-all duration-200
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
                        dark:focus-visible:ring-offset-surface-900
                        shadow-glow-sm hover:shadow-glow-md
                    "
                    aria-label="Connect wallet"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            Connecting...
                        </span>
                    ) : (
                        'Connect Wallet'
                    )}
                </button>

                {error && (
                    <div
                        className="p-3 bg-error-50 dark:bg-error-500/10 border border-error-100 dark:border-error-700 rounded-xl"
                        role="alert"
                        aria-live="polite"
                    >
                        <p className="text-sm text-error-700 dark:text-error-500 font-medium mb-1">Connection Error</p>
                        <p className="text-xs text-error-600 dark:text-error-500/80">{error.message}</p>
                    </div>
                )}
            </div>

            <WalletModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConnect={onConnect}
                onError={onError}
                showNetworkSelector={showNetworkSelector}
            />
        </div>
    );
};
