import { AuthRequest, AuthContext } from '../types/auth'
import { AppError } from '../errors/AppError'
import { logger } from './logger'

/**
 * Extracts and strictly validates a user identity from the request.
 * Prioritizes the authenticated public key, then falls back to walletAddress or body.
 * 
 * @param req - The Express request object containing login state
 * @returns Non-empty, trimmed user ID or public key
 * @throws {AppError} If no valid identity can be resolved (401 Unauthorized)
 */
export function extractUserId(req: AuthRequest): string {
  const userId = req.user?.publicKey || req.user?.walletAddress || req.body?.userId

  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    logger.warn('Missing or invalid user ID in request')
    throw new AppError('Unauthorized', 'User ID is required', 401)
  }

  return userId.trim()
}

/**
 * Extract and validate wallet address from request
 *
 * @param req - Express request object
 * @returns Validated wallet address
 * @throws AppError if wallet not found
 */
export function extractWalletAddress(req: AuthRequest): string {
  const wallet = req.user?.walletAddress || req.user?.publicKey

  if (!wallet || typeof wallet !== 'string' || wallet.trim().length === 0) {
    logger.warn('Missing or invalid wallet address in request')
    throw new AppError('Unauthorized', 'Wallet address is required', 401)
  }

  return wallet.trim()
}

/**
 * Constructs a comprehensive authentication context for downstream services.
 * Aggregates identity, contact, and permission metadata.
 * 
 * @param req - The authenticated Express request
 * @returns Flattened AuthContext object
 */
export function buildAuthContext(req: AuthRequest): AuthContext {
  const userId = extractUserId(req)
  const publicKey = req.user?.publicKey || userId
  const walletAddress = req.user?.walletAddress || userId

  return {
    userId,
    publicKey,
    walletAddress,
    email: req.user?.email,
    kycLevel: req.user?.kycLevel,
    isAdmin: req.user?.isAdmin || false,
  }
}

/**
 * Validate minimum KYC level
 *
 * @param req - Express request object
 * @param requiredLevel - Minimum KYC level required (default: 1)
 * @returns Boolean indicating if KYC requirement is met
 */
export function validateKYCLevel(req: AuthRequest, requiredLevel: number = 1): boolean {
  const kycLevel = req.user?.kycLevel || 0
  return kycLevel >= requiredLevel
}

/**
 * Assert user is authenticated
 *
 * @param req - Express request object
 * @throws AppError if not authenticated
 */
export function assertAuthenticated(req: AuthRequest): void {
  if (!req.user || !extractUserId(req)) {
    throw new AppError('Unauthorized', 'User authentication is required', 401)
  }
}

/**
 * Assert user is admin
 *
 * @param req - Express request object
 * @throws AppError if not admin
 */
export function assertAdmin(req: AuthRequest): void {
  assertAuthenticated(req)

  if (!req.user?.isAdmin) {
    logger.warn(`Non-admin user access attempt: ${extractUserId(req)}`)
    throw new AppError('Forbidden', 'Admin access required', 403)
  }
}

/**
 * Assert minimum KYC level
 *
 * @param req - Express request object
 * @param requiredLevel - Minimum KYC level required
 * @throws AppError if KYC requirement not met
 */
export function assertKYCLevel(req: AuthRequest, requiredLevel: number): void {
  assertAuthenticated(req)

  if (!validateKYCLevel(req, requiredLevel)) {
    const currentLevel = req.user?.kycLevel || 0
    logger.warn(
      `Insufficient KYC level for user ${extractUserId(req)}: required ${requiredLevel}, has ${currentLevel}`
    )
    throw new AppError(
      'Forbidden',
      `Minimum KYC level ${requiredLevel} required. Current level: ${currentLevel}`,
      403
    )
  }
}
