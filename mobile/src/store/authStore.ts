import { create } from 'zustand';
import { createSession, loadSession, clearSession } from '../services/auth';
import type { AuthSession, WalletProvider, StellarNetwork } from '../types';

interface AuthState {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (address: string, provider: WalletProvider, network: StellarNetwork) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const session = await loadSession();
      set({ session, isAuthenticated: !!session, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (address, provider, network) => {
    set({ isLoading: true, error: null });
    try {
      const session = await createSession(address, provider, network);
      set({ session, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Login failed',
        isLoading: false,
      });
      throw err;
    }
  },

  logout: async () => {
    await clearSession();
    set({ session: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
}));
