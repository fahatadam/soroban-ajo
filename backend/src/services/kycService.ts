import { PrismaClient } from '@prisma/client'
import { auditLog } from './auditService'
import { complianceConfig } from '../config/compliance'

const prisma = new PrismaClient()
const prismaAny = prisma as any

export interface KycStatus {
  level: number
  status: string
  requestedAt?: Date
  verifiedAt?: Date
  rejectedAt?: Date
  documents?: unknown[]
}

export class KycService {
  /**
   * Retrieves the current KYC (Know Your Customer) status and level for a user.
   * 
   * @param walletAddress - The user's public wallet address
   * @returns Promise resolving to the KycStatus object or null if user doesn't exist
   */
  static async getStatus(walletAddress: string): Promise<KycStatus | null> {
    const user = await prismaAny.user.findUnique({ where: { walletAddress } })

    if (!user) return null

    return {
      level: user.kycLevel || 0,
      status: user.kycStatus || 'none',
      requestedAt: user.kycRequestedAt || undefined,
      verifiedAt: user.kycVerifiedAt || undefined,
      rejectedAt: user.kycRejectedAt || undefined,
      documents: (user.kycDocuments as any) || [],
    }
  }

  /**
   * Initiates a KYC verification request for a user, marking their status as 'pending'.
   * 
   * @param walletAddress - The user's public wallet address
   * @returns Promise resolving when the request is recorded
   */
  static async requestVerification(walletAddress: string): Promise<void> {
    await prismaAny.user.update({
      where: { walletAddress },
      data: {
        kycStatus: 'pending',
        kycRequestedAt: new Date(),
      },
    })
  }

  /**
   * Persists a record of a supporting KYC document (e.g., ID scan) to the database.
   * 
   * @param walletAddress - The user's wallet address
   * @param docType - Category of document (e.g., 'passport', 'utility_bill')
   * @param docData - Reference to the document (e.g., IPFS CID or internal path)
   * @returns Promise resolving to the created document record
   */
  static async uploadDocument(walletAddress: string, docType: string, docData: string) {
    const user = await prismaAny.user.findUnique({ where: { walletAddress } })
    if (!user) throw new Error('User not found')

    return prismaAny.kycDocument.create({
      data: {
        userId: user.id,
        docType,
        ipfsCid: docData,
      },
    })
  }

  /**
   * Updates a user's KYC level and status. Typically triggered by administrative review.
   * Automatically records an audit log entry for the change.
   * 
   * @param params - Update details
   * @param params.walletAddress - Target user's wallet address
   * @param params.level - New KYC level (0-3)
   * @param params.status - New verification status
   * @param params.adminId - Optional ID of the administrator performing the update
   * @param params.notes - Optional internal notes regarding the decision
   * @returns Promise resolving to the updated user record
   */
  static async setKycLevel(params: {
    walletAddress: string
    level: number
    status: 'approved' | 'rejected' | 'none'
    adminId?: string
    notes?: string
  }) {
    const data: any = {
      kycLevel: params.level,
      kycStatus: params.status,
    }
    if (params.status === 'approved') {
      data.kycVerifiedAt = new Date()
    }
    if (params.status === 'rejected') {
      data.kycRejectedAt = new Date()
    }

    const user = await prismaAny.user.update({
      where: { walletAddress: params.walletAddress },
      data,
    })

    if (params.adminId) {
      await auditLog({
        adminId: params.adminId,
        action: 'kyc_update',
        targetType: 'user',
        targetId: user.id,
        metadata: {
          level: params.level,
          status: params.status,
          notes: params.notes,
        },
      })
    }

    return user
  }

  /**
   * Checks whether a specific wallet address is listed on the system's AML blacklist.
   * 
   * @param address - The wallet address to verify
   * @returns Boolean indicating if the address is blacklisted
   */
  static isAddressBlacklisted(address: string): boolean {
    return complianceConfig.amlBlacklist.includes(address)
  }

  /**
   * Retrieves the configured transaction limit for a specific KYC level.
   * 
   * @param level - The KYC level (0-3)
   * @returns The maximum permitted transaction amount
   */
  static getTransactionLimit(level: number): number {
    return complianceConfig.transactionLimits[level] || 0
  }
}
