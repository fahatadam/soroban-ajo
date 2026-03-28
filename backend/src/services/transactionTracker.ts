import { prisma } from '../config/database'
import { createModuleLogger } from '../utils/logger'
import * as StellarSdk from 'stellar-sdk'
import { sorobanConfig } from '../config'

const logger = createModuleLogger('TransactionTracker')

export type TxStatus = 'pending' | 'confirmed' | 'failed'

export interface TrackedTransaction {
  txHash: string
  status: TxStatus
  groupId?: string
  walletAddress?: string
  type: string
  amount?: string
  ledger?: number
  errorMessage?: string
  submittedAt: Date
  confirmedAt?: Date
}

const POLL_INTERVAL_MS = 3_000
const MAX_POLLS = 20 // ~60s timeout

export class TransactionTracker {
  private server: StellarSdk.Horizon.Server

  constructor() {
    this.server = new StellarSdk.Horizon.Server(sorobanConfig.rpcUrl)
  }

  async track(tx: Omit<TrackedTransaction, 'status' | 'submittedAt'>): Promise<void> {
    await prisma.trackedTransaction.upsert({
      where: { txHash: tx.txHash },
      update: {},
      create: {
        ...tx,
        status: 'pending',
        submittedAt: new Date(),
      },
    })

    this.poll(tx.txHash).catch((err) =>
      logger.error('Polling error', { txHash: tx.txHash, err })
    )
  }

  private async poll(txHash: string, attempt = 0): Promise<void> {
    if (attempt >= MAX_POLLS) {
      await this.updateStatus(txHash, 'failed', { errorMessage: 'Confirmation timeout' })
      return
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))

    try {
      const result = await this.server.transactions().transaction(txHash).call()
      const status: TxStatus = result.successful ? 'confirmed' : 'failed'
      await this.updateStatus(txHash, status, {
        ledger: result.ledger as unknown as number,
        confirmedAt: new Date(result.created_at),
      })
    } catch (err: unknown) {
      // 404 means not yet on-chain — keep polling
      if ((err as { response?: { status?: number } })?.response?.status === 404) {
        await this.poll(txHash, attempt + 1)
      } else {
        await this.updateStatus(txHash, 'failed', {
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }
  }

  private async updateStatus(
    txHash: string,
    status: TxStatus,
    extra: Partial<TrackedTransaction> = {}
  ): Promise<void> {
    await prisma.trackedTransaction.update({
      where: { txHash },
      data: { status, ...extra },
    })
    logger.info('Transaction status updated', { txHash, status })
  }

  async getTransaction(txHash: string): Promise<TrackedTransaction | null> {
    return prisma.trackedTransaction.findUnique({ where: { txHash } }) as Promise<TrackedTransaction | null>
  }

  async getByWallet(walletAddress: string, limit = 20): Promise<TrackedTransaction[]> {
    return prisma.trackedTransaction.findMany({
      where: { walletAddress },
      orderBy: { submittedAt: 'desc' },
      take: limit,
    }) as Promise<TrackedTransaction[]>
  }

  async retry(txHash: string): Promise<void> {
    await prisma.trackedTransaction.update({
      where: { txHash },
      data: { status: 'pending', errorMessage: null, confirmedAt: null },
    })
    this.poll(txHash).catch((err) =>
      logger.error('Retry polling error', { txHash, err })
    )
  }
}

export const transactionTracker = new TransactionTracker()
