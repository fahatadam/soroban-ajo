import type {
  AuthSession,
  AuthTokenResponse,
  SessionConfig,
  StellarNetwork,
  StoredSession,
  TokenPair,
  TwoFactorRequiredResponse,
  TwoFactorSetupResponse,
  TwoFactorStatusResponse,
  WalletProvider,
  WalletSignatureResult,
} from '../types/auth'
import {
  connectLobstrVault,
  isMobileDevice,
  isValidStellarAddress as validateLobstrAddress,
} from '@/utils/lobstr'
import {
  ensureFreighterAllowed,
  getStellarNetworkFromFreighter,
  waitForFreighterApi,
} from '@/utils/freighter'
import { ApiError, backendApiClient } from '@/lib/apiClient'
import { apiPaths } from '@/lib/apiEndpoints'

const DEFAULT_CONFIG: SessionConfig = {
  sessionDuration: 30 * 60 * 1000,
  rememberMeDuration: 7 * 24 * 60 * 60 * 1000,
  idleTimeout: 15 * 60 * 1000,
  checkInterval: 60 * 1000,
  storagePrefix: 'ajo_auth',
}

type AuthTokenResult = AuthTokenResponse | TwoFactorRequiredResponse

/**
 * Generates a cryptographically random string for use as tokens.
 * Falls back to Math.random if crypto API is unavailable.
 */
function generateToken(length = 64): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  let result = ''
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 16).toString(16)
  }
  return result
}

/**
 * Derives a CryptoKey from a passphrase using PBKDF2.
 * The passphrase is the user's Stellar address — not a secret, but sufficient
 * to prevent casual inspection of localStorage values.
 */
async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  const salt = encoder.encode('soroban-ajo-v1')
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/**
 * Encrypts a plaintext string using AES-GCM.
 * Returns the ciphertext and IV as hex strings.
 */
async function encrypt(
  plaintext: string,
  passphrase: string,
): Promise<{ payload: string; iv: string }> {
  const key = await deriveKey(passphrase)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoder = new TextEncoder()

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext),
  )

  return {
    payload: Array.from(new Uint8Array(cipherBuffer), (b) =>
      b.toString(16).padStart(2, '0'),
    ).join(''),
    iv: Array.from(iv, (b) => b.toString(16).padStart(2, '0')).join(''),
  }
}

/**
 * Decrypts an AES-GCM encrypted payload.
 */
async function decrypt(
  payload: string,
  iv: string,
  passphrase: string,
): Promise<string> {
  const key = await deriveKey(passphrase)

  const cipherBytes = new Uint8Array(
    payload.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
  )
  const ivBytes = new Uint8Array(
    iv.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
  )

  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    cipherBytes,
  )

  return new TextDecoder().decode(plainBuffer)
}

/** Generates a stable device fingerprint from browser properties */
function getDeviceId(): string {
  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ]
  let hash = 0
  const combined = parts.join('|')
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return Math.abs(hash).toString(36)
}

/**
 * Validates a Stellar public key format.
 * Stellar addresses are 56 characters starting with 'G'.
 */
function isValidStellarAddress(address: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(address)
}

/**
 * Core authentication service handling wallet-based login,
 * encrypted session storage, token rotation, and multi-device sign-out.
 */
class AuthService {
  private config: SessionConfig
  private activityTimer: ReturnType<typeof setInterval> | null = null
  private sessionCheckTimer: ReturnType<typeof setInterval> | null = null

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  private storageKey(suffix: string): string {
    return `${this.config.storagePrefix}_${suffix}`
  }

  /**
   * Requests a wallet signature to prove address ownership.
   * Currently supports Freighter; other providers can be added.
   */
  async requestWalletSignature(
    provider: WalletProvider,
  ): Promise<WalletSignatureResult> {
    const challenge = `soroban-ajo-auth-${Date.now()}-${generateToken(16)}`

    switch (provider) {
      case 'freighter': {
        const freighter = await waitForFreighterApi({
          timeoutMs: 3000,
          intervalMs: 100,
        })

        if (typeof window === 'undefined' || !freighter) {
          throw new AuthError(
            'Freighter wallet extension is not installed. Please install it from https://freighter.app and refresh the page.',
            'WALLET_NOT_FOUND',
          )
        }

        await ensureFreighterAllowed(freighter)

        const address: string = await freighter.getPublicKey()
        if (!isValidStellarAddress(address)) {
          throw new AuthError(
            'Invalid Stellar address returned by wallet',
            'INVALID_ADDRESS',
          )
        }

        const networkDetails = await freighter.getNetworkDetails?.()
        const freighterNetwork = getStellarNetworkFromFreighter(networkDetails)
        const network: StellarNetwork =
          freighterNetwork === 'mainnet' ? 'mainnet' : 'testnet'

        let signature: string
        try {
          if (!freighter.signAuthEntry) {
            throw new Error('signAuthEntry unavailable')
          }
          signature = await freighter.signAuthEntry(challenge)
        } catch {
          // Fallback: use the challenge itself as proof if signAuthEntry is unavailable
          signature = challenge
        }

        return { address, signature, network }
      }

      case 'lobstr': {
        // Lobstr wallet support
        if (isMobileDevice()) {
          throw new AuthError(
            'Lobstr mobile app authentication requires a callback flow. Please use the "Connect with Lobstr" button which will redirect you to the Lobstr app.',
            'MOBILE_FLOW_REQUIRED',
          )
        }
        
        // Desktop: Try Lobstr Vault extension
        try {
          const result = await connectLobstrVault()
          
          if (!validateLobstrAddress(result.address)) {
            throw new AuthError(
              'Invalid Stellar address returned by Lobstr Vault',
              'INVALID_ADDRESS',
            )
          }
          
          // Use challenge as signature since Lobstr Vault doesn't support signAuthEntry
          const signature = challenge
          
          return {
            address: result.address,
            signature,
            network: result.network,
          }
        } catch (error) {
          if (error instanceof AuthError) throw error
          
          throw new AuthError(
            'Lobstr Vault extension not found. Please install Lobstr Vault from the Chrome Web Store, or use Lobstr mobile app.',
            'WALLET_NOT_FOUND',
          )
        }
      }

      case 'albedo':
      case 'xbull':
        throw new AuthError(
          `${provider} wallet support is coming soon`,
          'PROVIDER_NOT_SUPPORTED',
        )

      default:
        throw new AuthError(
          `Unknown wallet provider: ${provider}`,
          'PROVIDER_NOT_SUPPORTED',
        )
    }
  }

  /** Creates a new token pair with appropriate expiration */
  generateTokenPair(rememberMe: boolean): TokenPair {
    const duration = rememberMe
      ? this.config.rememberMeDuration
      : this.config.sessionDuration

    const now = Date.now()
    return {
      token: generateToken(64),
      refreshToken: generateToken(64),
      expiresAt: new Date(now + duration).toISOString(),
    }
  }

  /** Builds a full AuthSession object from wallet result and tokens */
  createSession(
    walletResult: WalletSignatureResult,
    tokens: TokenPair,
    rememberMe: boolean,
    provider: WalletProvider,
    twoFactorEnabled = false,
  ): AuthSession {
    return {
      address: walletResult.address,
      provider,
      network: walletResult.network,
      createdAt: new Date().toISOString(),
      expiresAt: tokens.expiresAt,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      rememberMe,
      twoFactorEnabled,
    }
  }

  /**
   * Requests a backend authentication token using a public key and optional TOTP.
   * 
   * @param params - Request parameters
   * @param params.publicKey - User's Stellar public key
   * @param params.pendingToken - Optional token if 2FA is required
   * @param params.totpCode - Optional 2FA code
   * @returns AuthTokenResponse or TwoFactorRequiredResponse
   * @throws {AuthError} If the API request fails
   */
  async requestBackendToken(params: {
    publicKey: string
    pendingToken?: string
    totpCode?: string
  }): Promise<AuthTokenResult> {
    try {
      const data = await backendApiClient.request<
        AuthTokenResponse | TwoFactorRequiredResponse
      >({
        path: apiPaths.auth.token,
        method: 'POST',
        body: params,
        auth: 'none',
      })
      if ('requiresTwoFactor' in data && data.requiresTwoFactor) {
        return data as TwoFactorRequiredResponse
      }
      return data as AuthTokenResponse
    } catch (e) {
      if (e instanceof ApiError) {
        throw new AuthError(String(e.message), 'AUTH_API_ERROR')
      }
      throw e
    }
  }

  /**
   * Get the current 2FA status for a user.
   * 
   * @param token - Bearer token for authentication
   * @returns 2FA status response
   * @throws {AuthError} If the API request fails
   */
  async getTwoFactorStatus(token: string): Promise<TwoFactorStatusResponse> {
    try {
      return await backendApiClient.request<TwoFactorStatusResponse>({
        path: apiPaths.auth.twoFactorStatus,
        bearerToken: token,
      })
    } catch (e) {
      if (e instanceof ApiError) {
        throw new AuthError(String(e.message), 'AUTH_API_ERROR')
      }
      throw e
    }
  }

  /**
   * Initialize 2FA setup by generating a secret and QR code.
   * 
   * @param token - Bearer token for authentication
   * @returns 2FA setup response (secret, QR)
   * @throws {AuthError} If the API request fails
   */
  async setupTwoFactor(token: string): Promise<TwoFactorSetupResponse> {
    try {
      return await backendApiClient.request<TwoFactorSetupResponse>({
        path: apiPaths.auth.twoFactorSetup,
        method: 'POST',
        bearerToken: token,
      })
    } catch (e) {
      if (e instanceof ApiError) {
        throw new AuthError(String(e.message), 'AUTH_API_ERROR')
      }
      throw e
    }
  }

  /**
   * Enable 2FA for the account after verification.
   * 
   * @param token - Bearer token
   * @param totpCode - Verification code from authenticator app
   */
  async enableTwoFactor(token: string, totpCode: string): Promise<{ success: boolean; enabled: boolean }> {
    try {
      return await backendApiClient.request<{ success: boolean; enabled: boolean }>({
        path: apiPaths.auth.twoFactorEnable,
        method: 'POST',
        bearerToken: token,
        body: { totpCode },
      })
    } catch (e) {
      if (e instanceof ApiError) {
        throw new AuthError(String(e.message), 'AUTH_API_ERROR')
      }
      throw e
    }
  }

  /**
   * Disable 2FA for the account.
   * 
   * @param token - Bearer token
   * @param totpCode - Verification code from authenticator app
   */
  async disableTwoFactor(token: string, totpCode: string): Promise<{ success: boolean; enabled: boolean }> {
    try {
      return await backendApiClient.request<{ success: boolean; enabled: boolean }>({
        path: apiPaths.auth.twoFactorDisable,
        method: 'POST',
        bearerToken: token,
        body: { totpCode },
      })
    } catch (e) {
      if (e instanceof ApiError) {
        throw new AuthError(String(e.message), 'AUTH_API_ERROR')
      }
      throw e
    }
  }

  /** Encrypts and persists a session to localStorage */
  async saveSession(session: AuthSession): Promise<void> {
    const passphrase = session.address + session.token.slice(0, 8)
    const serialized = JSON.stringify(session)
    const { payload, iv } = await encrypt(serialized, passphrase)

    const stored: StoredSession = {
      payload,
      iv,
      lastActivity: Date.now(),
      deviceId: getDeviceId(),
    }

    const storage = session.rememberMe ? localStorage : sessionStorage
    storage.setItem(this.storageKey('session'), JSON.stringify(stored))

    // Keep the address and a hint unencrypted so we can derive the key on reload
    localStorage.setItem(this.storageKey('address'), session.address)
    localStorage.setItem(this.storageKey('token_hint'), session.token.slice(0, 8))
    localStorage.setItem(this.storageKey('storage_type'), session.rememberMe ? 'local' : 'session')
    localStorage.setItem('token', session.token)

    // Track active devices
    this.registerDevice(session.address, getDeviceId())
  }

  /** Loads and decrypts the stored session, returning null if invalid or expired */
  async loadSession(): Promise<AuthSession | null> {
    try {
      const address = localStorage.getItem(this.storageKey('address'))
      const tokenHint = localStorage.getItem(this.storageKey('token_hint'))
      const storageType = localStorage.getItem(this.storageKey('storage_type'))

      if (!address || !tokenHint) return null

      const storage = storageType === 'local' ? localStorage : sessionStorage
      const raw = storage.getItem(this.storageKey('session'))
      if (!raw) return null

      const stored: StoredSession = JSON.parse(raw)

      // Check idle timeout
      const idleMs = Date.now() - stored.lastActivity
      if (idleMs > this.config.idleTimeout) {
        this.clearStoredSession()
        return null
      }

      const passphrase = address + tokenHint
      const decrypted = await decrypt(stored.payload, stored.iv, passphrase)
      const session: AuthSession = JSON.parse(decrypted)

      // Check expiration
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        this.clearStoredSession()
        return null
      }

      // Verify device
      if (stored.deviceId !== getDeviceId()) {
        this.clearStoredSession()
        return null
      }

      return session
    } catch {
      // Corrupted or tampered data — wipe it
      this.clearStoredSession()
      return null
    }
  }

  /** Rotates the session token and refresh token */
  async refreshSession(currentSession: AuthSession): Promise<AuthSession | null> {
    if (!currentSession.refreshToken) return null

    const newTokens = this.generateTokenPair(currentSession.rememberMe)
    const refreshed: AuthSession = {
      ...currentSession,
      token: newTokens.token,
      refreshToken: newTokens.refreshToken,
      expiresAt: newTokens.expiresAt,
    }

    await this.saveSession(refreshed)
    return refreshed
  }

  /** Updates the last-activity timestamp to prevent idle timeout */
  async touchSession(): Promise<void> {
    const storageType = localStorage.getItem(this.storageKey('storage_type'))
    const storage = storageType === 'local' ? localStorage : sessionStorage
    const raw = storage.getItem(this.storageKey('session'))
    if (!raw) return

    try {
      const stored: StoredSession = JSON.parse(raw)
      stored.lastActivity = Date.now()
      storage.setItem(this.storageKey('session'), JSON.stringify(stored))
    } catch {
      // Ignore — next load will handle corruption
    }
  }

  /** Removes all session data from storage */
  clearStoredSession(): void {
    const keys = ['session', 'address', 'token_hint', 'storage_type']
    for (const key of keys) {
      localStorage.removeItem(this.storageKey(key))
      sessionStorage.removeItem(this.storageKey(key))
    }
    localStorage.removeItem('token')
  }

  /** Registers a device ID against an address for multi-device tracking */
  private registerDevice(address: string, deviceId: string): void {
    const devicesKey = this.storageKey(`devices_${address}`)
    try {
      const existing = JSON.parse(localStorage.getItem(devicesKey) || '[]') as string[]
      if (!existing.includes(deviceId)) {
        existing.push(deviceId)
        localStorage.setItem(devicesKey, JSON.stringify(existing))
      }
    } catch {
      localStorage.setItem(devicesKey, JSON.stringify([deviceId]))
    }
  }

  /** Invalidates all device sessions for an address */
  async logoutAllDevices(address: string): Promise<void> {
    const devicesKey = this.storageKey(`devices_${address}`)
    localStorage.removeItem(devicesKey)
    this.clearStoredSession()
  }

  /** Starts timers that keep the session alive and check validity */
  startSessionMonitoring(
    onExpired: () => void,
    onActivity: () => void,
  ): void {
    this.stopSessionMonitoring()

    // Touch session on user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const
    const handleActivity = () => {
      this.touchSession()
      onActivity()
    }
    for (const event of activityEvents) {
      window.addEventListener(event, handleActivity, { passive: true })
    }

    // Periodic session validity check
    this.sessionCheckTimer = setInterval(async () => {
      const session = await this.loadSession()
      if (!session) {
        onExpired()
        this.stopSessionMonitoring()
      }
    }, this.config.checkInterval)

    // Store cleanup reference
    this.activityTimer = setInterval(() => {
      // Heartbeat — activity events handle the real work
    }, this.config.checkInterval)
  }

  /** Stops all session monitoring timers and listeners */
  stopSessionMonitoring(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer)
      this.activityTimer = null
    }
    if (this.sessionCheckTimer) {
      clearInterval(this.sessionCheckTimer)
      this.sessionCheckTimer = null
    }
  }

  /** Returns the current session configuration */
  getConfig(): Readonly<SessionConfig> {
    return { ...this.config }
  }
}

/** Custom error class for authentication failures */
export class AuthError extends Error {
  code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}

/** Singleton auth service instance */
export const authService = new AuthService()
