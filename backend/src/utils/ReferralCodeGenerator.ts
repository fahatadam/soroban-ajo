import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';

/**
 * Generates unique referral codes for users
 * Uses cryptographically secure random generation
 * Excludes ambiguous characters (0, O, I, l) for better readability
 */
export class ReferralCodeGenerator {
  // Character set excluding ambiguous characters
  private static readonly ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  private static readonly MIN_LENGTH = 6;
  private static readonly MAX_LENGTH = 12;
  private static readonly DEFAULT_LENGTH = 8;
  private static readonly MAX_COLLISION_ATTEMPTS = 10;

  /**
   * Generates a random referral code of specified length.
   * Uses a character set optimized for readability (no O, 0, I, l).
   * 
   * @param length - Desired length of the code (default: 8)
   * @returns A random alphanumeric string
   * @throws {Error} If length is outside the permitted range (6-12)
   */
  static generate(length: number = this.DEFAULT_LENGTH): string {
    if (length < this.MIN_LENGTH || length > this.MAX_LENGTH) {
      throw new Error(
        `Code length must be between ${this.MIN_LENGTH} and ${this.MAX_LENGTH} characters`
      );
    }

    const bytes = randomBytes(length);
    let code = '';

    for (let i = 0; i < length; i++) {
      code += this.ALPHABET[bytes[i] % this.ALPHABET.length];
    }

    return code;
  }

  /**
   * Generates a unique referral code that is guaranteed not to exist in the database.
   * Implements a retry mechanism with exponential fallback (length increase) on collisions.
   * 
   * @param prisma - The Prisma ORM client instance
   * @param length - Initial desired code length (default: 8)
   * @returns Promise resolving to a unique referral code
   * @throws {Error} If unable to generate a unique code after maximum retries
   */
  static async generateUnique(
    prisma: PrismaClient,
    length: number = this.DEFAULT_LENGTH
  ): Promise<string> {
    let attempts = 0;

    while (attempts < this.MAX_COLLISION_ATTEMPTS) {
      const code = this.generate(length);

      // Check if code already exists
      const existing = await prisma.referralCode.findUnique({
        where: { code },
      });

      if (!existing) {
        return code;
      }

      attempts++;
    }

    // If we hit max attempts with default length, try with longer code
    if (length < this.MAX_LENGTH) {
      return this.generateUnique(prisma, length + 2);
    }

    throw new Error(
      `Failed to generate unique referral code after ${this.MAX_COLLISION_ATTEMPTS} attempts`
    );
  }

  /**
   * Validates if a given string follows the referral code format rules.
   * Checks length and character set membership.
   * 
   * @param code - The string to validate
   * @returns true if the format is strictly valid, false otherwise
   */
  static isValidFormat(code: string): boolean {
    if (code.length < this.MIN_LENGTH || code.length > this.MAX_LENGTH) {
      return false;
    }

    // Check if all characters are in the allowed alphabet
    return code.split('').every((char) => this.ALPHABET.includes(char));
  }
}
