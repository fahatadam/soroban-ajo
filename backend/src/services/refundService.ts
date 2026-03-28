import { redisClient } from './cacheService'
import { dbService } from './databaseService'
import { notificationService } from './notificationService'
import { createModuleLogger } from '../utils/logger'

const logger = createModuleLogger('RefundService')

export type RefundStatus = 'pending' | 'voting' | 'approved' | 'rejected' | 'executed'

export interface RefundRequest {
  id: string
  groupId: string
  requestedBy: string
  reason: string
  amount?: string
  status: RefundStatus
  votes: Record<string, 'yes' | 'no'>
  votingDeadline: string
  createdAt: string
  executedAt?: string
  txHash?: string
}

const KEY = (id: string) => `refund:${id}`
const GROUP_KEY = (groupId: string) => `group_refunds:${groupId}`
const VOTING_WINDOW_MS = Number(process.env.REFUND_VOTING_WINDOW_SECONDS || 172800) * 1000 // 48h

export const refundService = {
  async requestRefund(groupId: string, requestedBy: string, reason: string, amount?: string): Promise<RefundRequest> {
    const members = await dbService.getGroupMembers(groupId)
    if (!members.some((m: any) => m.userId === requestedBy)) {
      throw new Error('Only group members can request a refund')
    }

    const id = crypto.randomUUID()
    const now = new Date()
    const req: RefundRequest = {
      id,
      groupId,
      requestedBy,
      reason,
      amount,
      status: 'voting',
      votes: {},
      votingDeadline: new Date(now.getTime() + VOTING_WINDOW_MS).toISOString(),
      createdAt: now.toISOString(),
    }

    await redisClient.set(KEY(id), JSON.stringify(req))
    await redisClient.sadd(GROUP_KEY(groupId), id)

    // Notify all group members
    await notificationService.sendToGroup(groupId, {
      type: 'announcement',
      title: 'Refund Requested',
      message: `A refund has been requested. Vote before the deadline.`,
      groupId,
    }, requestedBy)

    logger.info('Refund requested', { id, groupId, requestedBy })
    return req
  },

  async get(id: string): Promise<RefundRequest | null> {
    const raw = await redisClient.get(KEY(id))
    return raw ? JSON.parse(raw) : null
  },

  async listByGroup(groupId: string): Promise<RefundRequest[]> {
    const ids = await redisClient.smembers(GROUP_KEY(groupId))
    if (!ids.length) return []
    const pipe = redisClient.pipeline()
    ids.forEach((id) => pipe.get(KEY(id)))
    const res = await pipe.exec()
    return (res || []).map((r) => r?.[1] ? JSON.parse(r[1] as string) : null).filter(Boolean)
  },

  async vote(id: string, voter: string, vote: 'yes' | 'no'): Promise<RefundRequest> {
    const req = await this.get(id)
    if (!req) throw new Error('Refund request not found')
    if (req.status !== 'voting') throw new Error('Voting is not open')
    if (new Date(req.votingDeadline) < new Date()) throw new Error('Voting deadline has passed')

    const members = await dbService.getGroupMembers(req.groupId)
    if (!members.some((m: any) => m.userId === voter)) throw new Error('Only members can vote')

    req.votes[voter] = vote
    await this._save(req)
    await this._tryAutoResolve(req, members.length)

    return (await this.get(id))!
  },

  async execute(id: string, txHash: string): Promise<RefundRequest> {
    const req = await this.get(id)
    if (!req) throw new Error('Refund request not found')
    if (req.status !== 'approved') throw new Error('Refund must be approved before execution')

    req.status = 'executed'
    req.executedAt = new Date().toISOString()
    req.txHash = txHash
    await this._save(req)

    await notificationService.sendToGroup(req.groupId, {
      type: 'payout_received',
      title: 'Refund Executed',
      message: `The refund has been executed on-chain.`,
      groupId: req.groupId,
    })

    logger.info('Refund executed', { id, txHash })
    return req
  },

  async _save(req: RefundRequest) {
    await redisClient.set(KEY(req.id), JSON.stringify(req))
  },

  async _tryAutoResolve(req: RefundRequest, totalMembers: number) {
    const votes = Object.values(req.votes)
    const yes = votes.filter((v) => v === 'yes').length
    const no = votes.filter((v) => v === 'no').length
    const majority = Math.ceil(totalMembers / 2)

    if (yes >= majority) {
      req.status = 'approved'
      await this._save(req)
      await notificationService.sendToGroup(req.groupId, {
        type: 'announcement',
        title: 'Refund Approved',
        message: 'The refund request has been approved by majority vote.',
        groupId: req.groupId,
      })
    } else if (no >= majority) {
      req.status = 'rejected'
      await this._save(req)
    }
  },
}
