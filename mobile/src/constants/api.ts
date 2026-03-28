// API base URL — override via EXPO_PUBLIC_API_URL env var
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export const STELLAR_NETWORK: 'testnet' | 'mainnet' =
  (process.env.EXPO_PUBLIC_STELLAR_NETWORK as 'testnet' | 'mainnet') ?? 'testnet';

export const SOROBAN_RPC_URL =
  process.env.EXPO_PUBLIC_SOROBAN_RPC_URL ??
  'https://soroban-testnet.stellar.org';

export const CONTRACT_ID = process.env.EXPO_PUBLIC_CONTRACT_ID ?? '';
