import { useState, useEffect, useCallback } from 'react';
import {
    WalletState,
    WalletError,
    ConnectWalletParams,
    WalletConnectionResult,
    WalletInfo,
} from '../types/wallet';
import { getStellarNetworkFromFreighter, waitForFreighterApi } from '../utils/freighter';

export type WalletConnectionState = 'idle' | 'connecting' | 'success' | 'error';

const STORAGE_KEY = 'soroban_ajo_wallet';

const initialState: WalletState = {
    isConnected: false,
    address: null,
    walletType: null,
    network: 'testnet',
    publicKey: null,
};

export const useWallet = () => {
    const [walletState, setWalletState] = useState<WalletState>(initialState);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<WalletError | null>(null);
    const [connectionState, setConnectionState] = useState<WalletConnectionState>('idle');

    // Check if wallets are installed
    const detectWallets = useCallback((): WalletInfo[] => {
        const wallets: WalletInfo[] = [
            {
                name: 'Freighter',
                type: 'freighter',
                isInstalled: typeof window !== 'undefined' && (!!window.freighterApi || !!window.freighter),
            },
            {
                name: 'Albedo',
                type: 'albedo',
                isInstalled: typeof window !== 'undefined' && !!window.albedo,
            },
            {
                name: 'Lobstr Vault',
                type: 'lobstr',
                isInstalled: typeof window !== 'undefined' && !!window.lobstrVault,
            },
        ];
        return wallets;
    }, []);

    // Load saved wallet connection from localStorage
    useEffect(() => {
        const savedWallet = localStorage.getItem(STORAGE_KEY);
        if (savedWallet) {
            try {
                const parsed = JSON.parse(savedWallet);
                setWalletState(parsed);
            } catch (err) {
                console.error('Failed to parse saved wallet state:', err);
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, []);

    // Save wallet state to localStorage
    const saveWalletState = useCallback((state: WalletState) => {
        if (state.isConnected) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    // Connect to Freighter wallet
    const connectFreighter = useCallback(
        async (requestedNetwork?: WalletState['network']): Promise<WalletConnectionResult> => {
            // By the time a user clicks "connect", Freighter should be injected already.
            // Do a quick poll to handle slow extension initialization without slowing tests too much.
            const freighter = (typeof window !== 'undefined' && (window as any).freighterApi)
                ? (window as any).freighterApi
                : await waitForFreighterApi({ timeoutMs: 500, intervalMs: 50 });
            if (!freighter) {
                return {
                    success: false,
                    error: {
                        code: 'WALLET_NOT_INSTALLED',
                        message: 'Freighter wallet is not installed. Please install it from the Chrome Web Store.',
                        walletType: 'freighter',
                    },
                };
            }

            try {
                const publicKey = await freighter.getPublicKey();
                const networkDetails = await freighter.getNetworkDetails?.();
                const walletNetwork = requestedNetwork ?? getStellarNetworkFromFreighter(networkDetails);

                const newState: WalletState = {
                    isConnected: true,
                    address: publicKey,
                    walletType: 'freighter',
                    network: walletNetwork,
                    publicKey,
                };

                setWalletState(newState);
                saveWalletState(newState);

                return {
                    success: true,
                    address: publicKey,
                    publicKey,
                };
            } catch (err: any) {
                const walletError: WalletError = {
                    code: err.code || 'CONNECTION_FAILED',
                    message: err.message || 'Failed to connect to Freighter wallet',
                    walletType: 'freighter',
                };
                return {
                    success: false,
                    error: walletError,
                };
            }
        },
        [saveWalletState]
    );

    // Connect to Albedo wallet
    const connectAlbedo = useCallback(
        async (network: string = 'testnet'): Promise<WalletConnectionResult> => {
            if (!window.albedo) {
                return {
                    success: false,
                    error: {
                        code: 'WALLET_NOT_INSTALLED',
                        message: 'Albedo wallet is not available. Please ensure you have access to Albedo.',
                        walletType: 'albedo',
                    },
                };
            }

            try {
                const result = await window.albedo.publicKey({ require_existing: false });
                const publicKey = result.pubkey;

                const newState: WalletState = {
                    isConnected: true,
                    address: publicKey,
                    walletType: 'albedo',
                    network: network as 'testnet' | 'mainnet' | 'futurenet',
                    publicKey,
                };

                setWalletState(newState);
                saveWalletState(newState);

                return {
                    success: true,
                    address: publicKey,
                    publicKey,
                };
            } catch (err) {
                const error = err as any;
                const walletError: WalletError = {
                    code: error.code || 'CONNECTION_FAILED',
                    message: error.message || 'Failed to connect to Albedo wallet',
                    walletType: 'albedo',
                };
                return {
                    success: false,
                    error: walletError,
                };
            }
        },
        [saveWalletState]
    );

    // Connect to Lobstr wallet
    const connectLobstr = useCallback(
        async (network: string = 'testnet'): Promise<WalletConnectionResult> => {
            if (!window.lobstrVault) {
                return {
                    success: false,
                    error: {
                        code: 'WALLET_NOT_INSTALLED',
                        message: 'Lobstr Vault extension is not installed. Please install it from the Chrome Web Store or use the Lobstr mobile app.',
                        walletType: 'lobstr',
                    },
                };
            }

            try {
                const publicKey = await window.lobstrVault.getPublicKey();

                if (!publicKey) {
                    throw new Error('Failed to get public key from Lobstr Vault');
                }

                const newState: WalletState = {
                    isConnected: true,
                    address: publicKey,
                    walletType: 'lobstr',
                    network: network as 'testnet' | 'mainnet' | 'futurenet',
                    publicKey,
                };

                setWalletState(newState);
                saveWalletState(newState);

                return {
                    success: true,
                    address: publicKey,
                    publicKey,
                };
            } catch (err) {
                const error = err as any;
                const walletError: WalletError = {
                    code: error.code || 'CONNECTION_FAILED',
                    message: error.message || 'Failed to connect to Lobstr Vault. Please make sure you have set up your vault account.',
                    walletType: 'lobstr',
                };
                return {
                    success: false,
                    error: walletError,
                };
            }
        },
        [saveWalletState]
    );

    // Main connect function
    const connect = useCallback(
        async ({ walletType, network = 'testnet' }: ConnectWalletParams): Promise<WalletConnectionResult> => {
            setIsLoading(true);
            setError(null);
            setConnectionState('connecting');

            let result: WalletConnectionResult;

            if (walletType === 'freighter') {
                result = await connectFreighter(network);
            } else if (walletType === 'albedo') {
                result = await connectAlbedo(network);
            } else if (walletType === 'lobstr') {
                result = await connectLobstr(network);
            } else {
                result = {
                    success: false,
                    error: {
                        code: 'INVALID_WALLET_TYPE',
                        message: 'Invalid wallet type specified',
                    },
                };
            }

            if (!result.success && result.error) {
                setError(result.error);
                setConnectionState('error');
            } else {
                setConnectionState('success');
            }

            setIsLoading(false);
            return result;
        },
        [connectFreighter, connectAlbedo, connectLobstr]
    );

    // Disconnect wallet
    const disconnect = useCallback(() => {
        setWalletState(initialState);
        setError(null);
        setConnectionState('idle');
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    // Get available wallets
    const availableWallets = detectWallets();

    return {
        // State
        walletState,
        isLoading,
        error,
        connectionState,
        availableWallets,

        // Actions
        connect,
        disconnect,
        detectWallets,

        // Computed
        isConnected: walletState.isConnected,
        address: walletState.address,
        walletType: walletState.walletType,
        network: walletState.network,
    };
};
