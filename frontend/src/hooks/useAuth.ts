import type {
  AuthActions,
  AuthSession,
  AuthState,
  LoginParams,
  StellarNetwork,
  WalletProvider,
} from '../types/auth'
import { AuthError, authService } from '../services/authService'
import { analytics, trackUserAction } from '../services/analytics'
import { useCallback, useEffect, useRef } from 'react'

import { create } from 'zustand'

type AuthStore = AuthState & AuthActions

/**
 * Global authentication store using Zustand.
 * Manages user session, wallet connection state, and two-factor status.
 */
export const useAuthStore = create<AuthStore>((set, get) => ({
  // --- State ---
  isAuthenticated: false,
  isLoading: false,
  address: null,
  network: 'testnet' as StellarNetwork,
  provider: null as WalletProvider | null,
  session: null as AuthSession | null,
  pendingTwoFactor: null,
  error: null as string | null,

  // --- Actions ---

  login: async ({ provider, rememberMe = false }: LoginParams) => {
    set({ isLoading: true, error: null })

    try {
      const walletResult = await authService.requestWalletSignature(provider)
      const authResult = await authService.requestBackendToken({ publicKey: walletResult.address })

      if ('requiresTwoFactor' in authResult) {
        set({
          isAuthenticated: false,
          isLoading: false,
          address: walletResult.address,
          network: walletResult.network,
          provider,
          session: null,
          pendingTwoFactor: {
            address: walletResult.address,
            provider,
            network: walletResult.network,
            rememberMe,
            pendingToken: authResult.pendingToken,
          },
          error: null,
        })
        return
      }

      const tokens = authService.generateTokenPair(rememberMe)
      const session = authService.createSession(
        walletResult,
        { ...tokens, token: authResult.token },
        rememberMe,
        provider,
        authResult.twoFactorEnabled,
      )

      await authService.saveSession(session)

      analytics.setUserId(session.address)
      trackUserAction.walletConnected(provider)

      set({
        isAuthenticated: true,
        isLoading: false,
        address: session.address,
        network: session.network,
        provider: session.provider,
        session,
        pendingTwoFactor: null,
        error: null,
      })
    } catch (err) {
      const message =
        err instanceof AuthError
          ? err.message
          : 'Failed to connect wallet. Please try again.'

      analytics.trackError(
        err instanceof Error ? err : new Error(String(err)),
        { provider },
        'high',
      )

      set({
        isAuthenticated: false,
        isLoading: false,
        address: null,
        provider: null,
        session: null,
        pendingTwoFactor: null,
        error: message,
      })

      throw err
    }
  },

  verifyTwoFactor: async (totpCode: string) => {
    const pendingTwoFactor = get().pendingTwoFactor

    if (!pendingTwoFactor) {
      throw new AuthError('No two-factor authentication challenge is pending', 'NO_PENDING_TWO_FACTOR')
    }

    set({ isLoading: true, error: null })

    try {
      const authResult = await authService.requestBackendToken({
        publicKey: pendingTwoFactor.address,
        pendingToken: pendingTwoFactor.pendingToken,
        totpCode,
      })

      if ('requiresTwoFactor' in authResult) {
        throw new AuthError('Two-factor verification is still required', 'TWO_FACTOR_REQUIRED')
      }

      const tokens = authService.generateTokenPair(pendingTwoFactor.rememberMe)
      const session = authService.createSession(
        {
          address: pendingTwoFactor.address,
          signature: pendingTwoFactor.pendingToken,
          network: pendingTwoFactor.network,
        },
        { ...tokens, token: authResult.token },
        pendingTwoFactor.rememberMe,
        pendingTwoFactor.provider,
        authResult.twoFactorEnabled,
      )

      await authService.saveSession(session)

      analytics.setUserId(session.address)
      trackUserAction.walletConnected(session.provider)

      set({
        isAuthenticated: true,
        isLoading: false,
        address: session.address,
        network: session.network,
        provider: session.provider,
        session,
        pendingTwoFactor: null,
        error: null,
      })
    } catch (err) {
      const message = err instanceof AuthError ? err.message : 'Failed to verify two-factor authentication.'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  cancelTwoFactor: () => {
    set({
      isAuthenticated: false,
      isLoading: false,
      address: null,
      provider: null,
      session: null,
      pendingTwoFactor: null,
      error: null,
    })
  },

  logout: async () => {
    const { address } = get()
    authService.stopSessionMonitoring()
    authService.clearStoredSession()

    if (address) {
      trackUserAction.walletDisconnected()
    }

    set({
      isAuthenticated: false,
      isLoading: false,
      address: null,
      provider: null,
      session: null,
      pendingTwoFactor: null,
      error: null,
    })
  },

  logoutAllDevices: async () => {
    const { address } = get()
    if (address) {
      await authService.logoutAllDevices(address)
      trackUserAction.walletDisconnected()
    }

    authService.stopSessionMonitoring()

    set({
      isAuthenticated: false,
      isLoading: false,
      address: null,
      provider: null,
      session: null,
      pendingTwoFactor: null,
      error: null,
    })
  },

  refreshSession: async (): Promise<boolean> => {
    const { session } = get()
    if (!session) return false

    try {
      const refreshed = await authService.refreshSession(session)
      if (!refreshed) {
        await get().logout()
        return false
      }

      set({ session: refreshed, error: null })
      return true
    } catch {
      await get().logout()
      return false
    }
  },

  setNetwork: (network: StellarNetwork) => {
    set({ network })
  },

  setRememberMe: (remember: boolean) => {
    const { session } = get()
    if (session) {
      const updated = { ...session, rememberMe: remember }
      set({ session: updated })
      authService.saveSession(updated)
    }
  },

  clearError: () => {
    set({ error: null })
  },

  checkSession: async () => {
    // Silent check - don't show loading UI on mount
    try {
      const session = await authService.loadSession()
      if (session) {
        analytics.setUserId(session.address)

        set({
          isAuthenticated: true,
          isLoading: false,
          address: session.address,
          network: session.network,
          provider: session.provider,
          session,
          pendingTwoFactor: null,
          error: null,
        })
      } else {
        set({
          isAuthenticated: false,
          isLoading: false,
          address: null,
          provider: null,
          session: null,
          pendingTwoFactor: null,
        })
      }
    } catch {
      set({
        isAuthenticated: false,
        isLoading: false,
        address: null,
        provider: null,
        session: null,
        pendingTwoFactor: null,
      })
    }
  },
}))

/**
 * Primary hook for accessing and managing authentication state.
 * 
 * Features:
 * - RESTORES persisted sessions on mount
 * - STARTS session monitoring (idle timeout, heartbeat)
 * - PROVIDES login/logout actions and session metadata
 * 
 * @returns Object containing all auth state and action functions
 */
export function useAuth() {
  const store = useAuthStore()
  const monitoringStarted = useRef(false)

  const handleSessionExpired = useCallback(() => {
    useAuthStore.getState().logout()
  }, [])

  const handleActivity = useCallback(() => {
    // Activity is tracked inside authService.touchSession
  }, [])

  useEffect(() => {
    store.checkSession()
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (store.isAuthenticated && !monitoringStarted.current) {
      authService.startSessionMonitoring(handleSessionExpired, handleActivity)
      monitoringStarted.current = true
    }

    if (!store.isAuthenticated && monitoringStarted.current) {
      authService.stopSessionMonitoring()
      monitoringStarted.current = false
    }

    return () => {
      if (monitoringStarted.current) {
        authService.stopSessionMonitoring()
        monitoringStarted.current = false
      }
    }
  }, [store.isAuthenticated, handleSessionExpired, handleActivity])

  return {
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    address: store.address,
    network: store.network,
    provider: store.provider,
    session: store.session,
    pendingTwoFactor: store.pendingTwoFactor,
    error: store.error,
    login: store.login,
    verifyTwoFactor: store.verifyTwoFactor,
    cancelTwoFactor: store.cancelTwoFactor,
    logout: store.logout,
    logoutAllDevices: store.logoutAllDevices,
    refreshSession: store.refreshSession,
    setNetwork: store.setNetwork,
    setRememberMe: store.setRememberMe,
    clearError: store.clearError,
  }
}
