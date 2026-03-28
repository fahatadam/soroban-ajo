import { Request, Response } from 'express'
import { refundService } from '../services/refundService'
import { AuthRequest } from '../middleware/auth'

export const refundController = {
  async request(req: AuthRequest, res: Response) {
    try {
      const { groupId, reason, amount } = req.body
      if (!groupId || !reason) return res.status(400).json({ error: 'groupId and reason are required' })
      const result = await refundService.requestRefund(groupId, req.user!.walletAddress!, reason, amount)
      res.status(201).json(result)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  },

  async get(req: Request, res: Response) {
    const result = await refundService.get(req.params.id)
    if (!result) return res.status(404).json({ error: 'Not found' })
    res.json(result)
  },

  async listByGroup(req: Request, res: Response) {
    const list = await refundService.listByGroup(req.params.groupId)
    res.json({ data: list })
  },

  async vote(req: AuthRequest, res: Response) {
    try {
      const { vote } = req.body
      if (!['yes', 'no'].includes(vote)) return res.status(400).json({ error: 'vote must be yes or no' })
      const result = await refundService.vote(req.params.id, req.user!.walletAddress!, vote)
      res.json(result)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  },

  async execute(req: AuthRequest, res: Response) {
    try {
      const { txHash } = req.body
      if (!txHash) return res.status(400).json({ error: 'txHash is required' })
      const result = await refundService.execute(req.params.id, txHash)
      res.json(result)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  },
}
