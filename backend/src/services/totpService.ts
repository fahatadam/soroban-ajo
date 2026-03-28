import { createHmac, randomBytes } from 'crypto'

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const DEFAULT_DIGITS = 6
const DEFAULT_PERIOD = 30
const DEFAULT_WINDOW = 1

function base32Encode(buffer: Buffer): string {
  let bits = ''
  for (const value of buffer) {
    bits += value.toString(2).padStart(8, '0')
  }

  let encoded = ''
  for (let index = 0; index < bits.length; index += 5) {
    const chunk = bits.slice(index, index + 5).padEnd(5, '0')
    encoded += BASE32_ALPHABET[parseInt(chunk, 2)]
  }

  return encoded
}

function base32Decode(value: string): Buffer {
  const normalized = value.replace(/=+$/g, '').replace(/\s+/g, '').toUpperCase()
  let bits = ''

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index === -1) {
      throw new Error('Invalid base32 secret')
    }

    bits += index.toString(2).padStart(5, '0')
  }

  const bytes: number[] = []
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(parseInt(bits.slice(index, index + 8), 2))
  }

  return Buffer.from(bytes)
}

function generateHotp(secret: string, counter: number, digits = DEFAULT_DIGITS): string {
  const key = base32Decode(secret)
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeBigUInt64BE(BigInt(counter))

  const hmac = createHmac('sha1', key).update(counterBuffer).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  return (code % 10 ** digits).toString().padStart(digits, '0')
}

export class TotpService {
  /**
   * Generates a new random base32 encoded TOTP secret.
   * Used when a user first enables 2FA.
   * 
   * @returns A 32-character base32 secret string
   */
  generateSecret() {
    return base32Encode(randomBytes(20))
  }

  /**
   * Generates a valid 6-digit TOTP token for a given secret and optional timestamp.
   * 
   * @param secret - The user's base32 secret
   * @param timestamp - The reference time (defaults to now)
   * @returns A 6-digit token string
   */
  generateToken(secret: string, timestamp = Date.now()) {
    const counter = Math.floor(timestamp / 1000 / DEFAULT_PERIOD)
    return generateHotp(secret, counter)
  }

  /**
   * Constructs an 'otpauth://' URL suitable for QR code generation.
   * Compatible with Google Authenticator, Authy, etc.
   * 
   * @param secret - The base32 secret
   * @param accountName - The user's account identifier (e.g., email or wallet)
   * @param issuer - The name of the platform (default: 'Ajo')
   * @returns A complete otpauth URL
   */
  buildOtpAuthUrl(secret: string, accountName: string, issuer = 'Ajo') {
    const label = encodeURIComponent(`${issuer}:${accountName}`)
    const issuerParam = encodeURIComponent(issuer)
    return `otpauth://totp/${label}?secret=${secret}&issuer=${issuerParam}&algorithm=SHA1&digits=${DEFAULT_DIGITS}&period=${DEFAULT_PERIOD}`
  }

  /**
   * Verifies a provided TOTP token against a secret.
   * Supports a configurable look-back/look-forward window to account for clock skew.
   * 
   * @param secret - The base32 secret
   * @param token - The 6-digit token provided by the user
   * @param window - Number of 30s steps to check around the current time (default: 1)
   * @returns Boolean indicating if the token is valid
   */
  verifyToken(secret: string, token: string, window = DEFAULT_WINDOW) {
    const normalizedToken = token.trim()
    if (!/^\d{6}$/.test(normalizedToken)) {
      return false
    }

    const currentCounter = Math.floor(Date.now() / 1000 / DEFAULT_PERIOD)
    for (let offset = -window; offset <= window; offset += 1) {
      if (generateHotp(secret, currentCounter + offset) === normalizedToken) {
        return true
      }
    }

    return false
  }
}

export const totpService = new TotpService()