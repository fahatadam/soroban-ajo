import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

export interface ReferralMetadata {
  ipAddress: string;
  userAgent: string;
  deviceFingerprint?: string;
  registrationTimestamp: Date;
}

export interface FraudFlag {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  details: any;
}

export interface FraudCheckResult {
  passed: boolean;
  flags: FraudFlag[];
  shouldBlock: boolean;
}

/**
 * Service for detecting and preventing fraudulent referral activity
 */
export class FraudDetector {
  private static readonly IP_REFERRAL_LIMIT = 3; // Max referrals per IP in 24 hours
  private static readonly IP_TRACKING_WINDOW = 86400; // 24 hours in seconds

  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {}

  /**
   * Performs a comprehensive fraud check on a new referral.
   * Evaluates multiple risk factors including self-referral, IP matching, and bulk creation.
   * 
   * @param referrerId - Unique identifier of the user who shared the referral link
   * @param refereeId - Unique identifier of the user who registered via the link
   * @param metadata - Technical metadata captured during registration (IP, device info, etc.)
   * @returns Promise resolving to a FraudCheckResult containing flags and bypass/block recommendation
   */
  async checkReferral(
    referrerId: string,
    refereeId: string,
    metadata: ReferralMetadata
  ): Promise<FraudCheckResult> {
    const flags: FraudFlag[] = [];

    // Check 1: Self-referral
    if (await this.checkSelfReferral(referrerId, refereeId)) {
      flags.push({
        type: 'SELF_REFERRAL',
        severity: 'HIGH',
        details: { referrerId, refereeId },
      });
    }

    // Check 2: IP match
    if (await this.checkIPMatch(referrerId, metadata.ipAddress)) {
      flags.push({
        type: 'IP_MATCH',
        severity: 'MEDIUM',
        details: { ip: metadata.ipAddress },
      });
    }

    // Check 3: Device fingerprint match
    if (metadata.deviceFingerprint) {
      if (await this.checkDeviceMatch(referrerId, metadata.deviceFingerprint)) {
        flags.push({
          type: 'DEVICE_MATCH',
          severity: 'MEDIUM',
          details: { fingerprint: metadata.deviceFingerprint },
        });
      }
    }

    // Check 4: Bulk creation from IP
    if (await this.checkBulkCreation(metadata.ipAddress)) {
      flags.push({
        type: 'BULK_CREATION',
        severity: 'HIGH',
        details: {
          ip: metadata.ipAddress,
          count: await this.getIPReferralCount(metadata.ipAddress),
        },
      });
    }

    const shouldBlock = flags.some((f) => f.severity === 'HIGH');

    return {
      passed: flags.length === 0,
      flags,
      shouldBlock,
    };
  }

  /**
   * Checks if the referrer and referee are the same user ID.
   * 
   * @param referrerId - Referrer user ID
   * @param refereeId - Referee user ID
   * @returns Promise resolving to true if it is a self-referral attempt
   */
  async checkSelfReferral(referrerId: string, refereeId: string): Promise<boolean> {
    return referrerId === refereeId;
  }

  /**
   * Verifies if the referee's IP address has been recently used by the referrer.
   * 
   * @param referrerId - Referrer user ID
   * @param refereeIP - Current IP address of the referee
   * @returns Promise resolving to true if an IP match is detected between the two users
   * @todo Implement IP persistence and lookup logic
   */
  async checkIPMatch(referrerId: string, refereeIP: string): Promise<boolean> {
    // Get referrer's recent IP addresses from metadata
    // This would require storing IP addresses in user metadata
    // For now, we'll implement a simplified version
    
    // TODO: Implement IP storage and comparison
    // This requires extending the User model or creating a UserMetadata table
    
    return false; // Placeholder
  }

  /**
   * Verifies if the referee's device fingerprint matches one associated with the referrer.
   * 
   * @param referrerId - Referrer user ID
   * @param refereeFingerprint - Unique device identifier of the referee
   * @returns Promise resolving to true if a device match is detected
   * @todo Implement device fingerprint storage and comparison
   */
  async checkDeviceMatch(
    referrerId: string,
    refereeFingerprint: string
  ): Promise<boolean> {
    // Similar to IP check, requires device fingerprint storage
    // TODO: Implement device fingerprint storage and comparison
    
    return false; // Placeholder
  }

  /**
   * Detects bulk account creation attempts by checking the referral limit for a single IP.
   * 
   * @param ipAddress - IP address to analyze
   * @returns Promise resolving to true if the number of referrals from this IP exceeds the allowed threshold
   */
  async checkBulkCreation(ipAddress: string): Promise<boolean> {
    const count = await this.getIPReferralCount(ipAddress);
    return count >= FraudDetector.IP_REFERRAL_LIMIT;
  }

  /**
   * Retrieves the current referral count for an IP address within the tracking window from Redis.
   * 
   * @param ipAddress - IP address to query
   * @returns Promise resolving to the number of referrals recorded for this IP
   * @internal
   */
  private async getIPReferralCount(ipAddress: string): Promise<number> {
    const key = `fraud:ip:${ipAddress}`;
    const count = await this.redis.get(key);

    if (count) {
      return parseInt(count, 10);
    }

    // If not in cache, return 0
    // In production, you might want to query database for historical data
    return 0;
  }

  /**
   * Increments the referral count for a specific IP address and updates its TTL.
   * Should be called every time a new referral registration is processed.
   * 
   * @param ipAddress - IP address to track
   * @returns Promise resolving when the count is incremented
   */
  async incrementIPCount(ipAddress: string): Promise<void> {
    const key = `fraud:ip:${ipAddress}`;
    await this.redis.incr(key);
    await this.redis.expire(key, FraudDetector.IP_TRACKING_WINDOW);
  }

  /**
   * Creates a formal fraud flag record in the database for a suspicious referral.
   * This triggers manual review and updates the referral status to 'FLAGGED'.
   * 
   * @param referralId - ID of the flagged referral
   * @param flagType - Type of suspicious activity detected (e.g., 'SELF_REFERRAL')
   * @param details - Additional context or data associated with the flag
   * @returns Promise resolving to the newly created fraud flag record
   */
  async flagReferral(
    referralId: string,
    flagType: string,
    details: any
  ): Promise<any> {
    const severity = this.determineSeverity(flagType);

    const flag = await this.prisma.fraudFlag.create({
      data: {
        referralId,
        flagType,
        severity,
        details: JSON.stringify(details),
        status: 'PENDING',
      },
    });

    // Update referral status to FLAGGED
    await this.prisma.referral.update({
      where: { id: referralId },
      data: { status: 'FLAGGED' },
    });

    return flag;
  }

  /**
   * Records the result of an administrative review on a fraud flag.
   * 
   * @param flagId - ID of the flag being reviewed
   * @param status - The final decision (REVIEWED, CONFIRMED, or DISMISSED)
   * @param reviewerId - ID of the admin who performed the review
   * @returns Promise resolving when the flag status is updated
   */
  async reviewFlag(
    flagId: string,
    status: 'REVIEWED' | 'CONFIRMED' | 'DISMISSED',
    reviewerId: string
  ): Promise<void> {
    await this.prisma.fraudFlag.update({
      where: { id: flagId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      },
    });
  }

  /**
   * Determines if a user should be barred from receiving rewards based on active fraud flags.
   * 
   * @param userId - ID of the user to check
   * @returns Promise resolving to true if rewards should be blocked
   */
  async shouldBlockReward(userId: string): Promise<boolean> {
    // Check if user has any pending or confirmed fraud flags
    const flags = await this.prisma.fraudFlag.findMany({
      where: {
        userId,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    return flags.length > 0;
  }

  /**
   * Map fraud flag types to their respective risk severity levels.
   * 
   * @param flagType - The type of fraud detected
   * @returns The determined severity level
   * @internal
   */
  private determineSeverity(flagType: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const highSeverityTypes = ['SELF_REFERRAL', 'BULK_CREATION'];
    const mediumSeverityTypes = ['IP_MATCH', 'DEVICE_MATCH'];

    if (highSeverityTypes.includes(flagType)) {
      return 'HIGH';
    } else if (mediumSeverityTypes.includes(flagType)) {
      return 'MEDIUM';
    }

    return 'LOW';
  }
}
