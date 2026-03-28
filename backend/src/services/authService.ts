import dotenv from "dotenv"
import jwt from 'jsonwebtoken'
dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

const JWT_SECRET: string = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const TWO_FACTOR_CHALLENGE_EXPIRES_IN = process.env.TWO_FACTOR_CHALLENGE_EXPIRES_IN || '5m'
export interface JWTPayload {
  publicKey: string
  purpose?: 'auth' | 'two_factor'
  twoFactorVerified?: boolean
  iat?: number
  exp?: number
}

export class AuthService {
  /**
   * Generates a signed JWT for a user with specific claims and expiration.
   * 
   * @param publicKey - The Stellar public key of the user
   * @param options - Token configuration options
   * @param options.expiresIn - Duration string (e.g., '1h', '7d')
   * @param options.purpose - The intended use of the token ('auth' or 'two_factor')
   * @param options.twoFactorVerified - Whether 2FA has been successfully passed
   * @returns A signed JWT string
   */
  static generateToken(
    publicKey: string,
    options: {
      expiresIn?: string
      purpose?: 'auth' | 'two_factor'
      twoFactorVerified?: boolean
    } = {}
  ): string {
    const {
      expiresIn = JWT_EXPIRES_IN,
      purpose = 'auth',
      twoFactorVerified = false,
    } = options

    return jwt.sign(
      { publicKey, purpose, twoFactorVerified },
      JWT_SECRET,
      { expiresIn } as jwt.SignOptions
    )
  }

  /**
   * Decodes and validates a JWT string against the system secret.
   * 
   * @param token - The JWT string to verify
   * @returns The decoded JWTPayload
   * @throws {Error} If the token is invalid or expired
   */
  static verifyToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  }

  /**
   * Generates a short-lived token specifically for two-factor authentication challenges.
   * 
   * @param publicKey - The Stellar public key of the user
   * @returns A temporary JWT for 2FA verification
   */
  static generateTwoFactorChallenge(publicKey: string): string {
    return this.generateToken(publicKey, {
      expiresIn: TWO_FACTOR_CHALLENGE_EXPIRES_IN,
      purpose: 'two_factor',
      twoFactorVerified: false,
    })
  }

  /**
   * Validates a two-factor challenge token and ensures it matches the expected user.
   * 
   * @param token - The 2FA challenge token
   * @param publicKey - The user's expected public key
   * @returns The validated JWTPayload
   * @throws {Error} If the token is invalid, expired, or doesn't match the user/purpose
   */
  static verifyTwoFactorChallenge(token: string, publicKey: string): JWTPayload {
    const payload = this.verifyToken(token)

    if (payload.purpose !== 'two_factor' || payload.publicKey !== publicKey) {
      throw new Error('Invalid two-factor challenge token')
    }

    return payload
  }
}
