import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { transactionTracker } from '../services/transactionTracker'

const router = Router()

// GET /api/transactions/:txHash — get single transaction status
router.get('/:txHash', authMiddleware, async (req: AuthRequest, res: Response) => {
  const tx = await transactionTracker.getTransaction(req.params.txHash)
  if (!tx) return res.status(404).json({ error: 'Transaction not found' })
  res.json(tx)
})

// GET /api/transactions — list transactions for authenticated wallet
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const walletAddress = req.user?.walletAddress
  if (!walletAddress) return res.status(401).json({ error: 'Unauthorized' })

  const limit = Math.min(Number(req.query.limit) || 20, 100)
  const txs = await transactionTracker.getByWallet(walletAddress, limit)
  res.json({ data: txs, total: txs.length })
})

// POST /api/transactions/track — submit a tx hash to start tracking
router.post('/track', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { txHash, groupId, type, amount } = req.body
  if (!txHash || !type) return res.status(400).json({ error: 'txHash and type are required' })

  await transactionTracker.track({
    txHash,
    groupId,
    walletAddress: req.user?.walletAddress,
    type,
    amount,
  })

  res.status(202).json({ txHash, status: 'pending' })
})

// POST /api/transactions/:txHash/retry — retry a failed transaction
router.post('/:txHash/retry', authMiddleware, async (req: AuthRequest, res: Response) => {
  const tx = await transactionTracker.getTransaction(req.params.txHash)
  if (!tx) return res.status(404).json({ error: 'Transaction not found' })
  if (tx.status !== 'failed') return res.status(400).json({ error: 'Only failed transactions can be retried' })

  await transactionTracker.retry(req.params.txHash)
  res.json({ txHash: req.params.txHash, status: 'pending' })
})

export const transactionsRouter = router
