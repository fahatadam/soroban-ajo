import { Request, Response } from 'express'
import Redis from 'ioredis'
import { prisma } from '../config/database'
import { ReferralService } from '../services/referralService'
import { RewardEngine } from '../services/RewardEngine'
import { FraudDetector } from '../services/FraudDetector'
import { analyticsService } from '../services/analyticsService'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
const fraudDetector = new FraudDetector(prisma, redis)
const rewardEngine = new RewardEngine(prisma, fraudDetector)
const referralService = new ReferralService(prisma, rewardEngine, fraudDetector, analyticsService)

/**
 * Generate or retrieve referral code for authenticated user
 */
export const generateReferralCode = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.walletAddress

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const code = await referralService.generateReferralCode(userId)
    const stats = await referralService.getReferralStats(userId)

    res.json({
      code,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${code}`,
      totalReferrals: stats.totalReferrals,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate referral code' })
  }
}

/**
 * Validate a referral code
 */
export const validateReferralCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.body

    if (!code) {
      return res.status(400).json({ error: 'Referral code is required' })
    }

    const valid = await referralService.validateReferralCode(code)

    if (!valid) {
      return res.json({ valid: false })
    }

    const referrerId = await referralService.getReferrerByCode(code)

    res.json({
      valid: true,
      referrerId,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate referral code' })
  }
}

export const claimReferral = async (req: Request, res: Response) => {
  try {
    const refereeId = req.user?.walletAddress
    const { code } = req.body

    if (!refereeId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const referrerId = await referralService.getReferrerByCode(code)
    if (!referrerId) {
      return res.status(400).json({ error: 'Invalid referral code' })
    }

    const referral = await referralService.createReferral({
      referrerId,
      refereeId,
      code,
      metadata: {
        ipAddress: req.ip ?? 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        deviceFingerprint: req.get('x-device-fingerprint') || undefined,
        registrationTimestamp: new Date(),
      },
    })

    res.status(201).json({
      referral,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to claim referral'
    res.status(400).json({ error: message })
  }
}

export const completeReferral = async (req: Request, res: Response) => {
  try {
    const refereeId = req.user?.walletAddress

    if (!refereeId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const referral = await referralService.completeReferral(refereeId)
    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' })
    }

    res.json({ referral })
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete referral' })
  }
}

/**
 * Get referral statistics for authenticated user
 */
export const getReferralStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.walletAddress

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const stats = await referralService.getReferralStats(userId)

    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get referral stats' })
  }
}

export const getReferralAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.walletAddress

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const analytics = await referralService.getReferralAnalytics(userId)
    res.json(analytics)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get referral analytics' })
  }
}

export const getReferralLeaderboard = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit ?? 10)
    const leaderboard = await referralService.getReferralLeaderboard(limit)
    res.json({ leaderboard })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get referral leaderboard' })
  }
}
