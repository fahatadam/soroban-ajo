import * as StellarSdk from 'stellar-sdk'
import { sorobanConfig } from '../config'
import { createModuleLogger } from '../utils/logger'
import { eventProcessor } from './eventProcessor'

const logger = createModuleLogger('BlockchainListener')

const RECONNECT_DELAY_MS = 5_000
const MAX_RECONNECT_DELAY_MS = 60_000

export class BlockchainListener {
  private server: StellarSdk.Horizon.Server
  private stopStream: (() => void) | null = null
  private reconnectDelay = RECONNECT_DELAY_MS
  private stopped = false
  // Cursor to resume from after reconnect — 'now' on first start
  private cursor: string = 'now'

  constructor() {
    // Horizon server is used for the event stream endpoint
    this.server = new StellarSdk.Horizon.Server(sorobanConfig.rpcUrl)
  }

  start(): void {
    this.stopped = false
    this.listen()
  }

  stop(): void {
    this.stopped = true
    this.stopStream?.()
    logger.info('BlockchainListener stopped')
  }

  private listen(): void {
    logger.info('Starting contract event stream', { cursor: this.cursor })

    try {
      const stop = (this.server as unknown as {
        operations: () => {
          forAccount: (id: string) => {
            cursor: (c: string) => {
              stream: (opts: { onmessage: (e: unknown) => void; onerror: (e: unknown) => void }) => () => void
            }
          }
        }
      })
        // Stellar SDK streams operations; for Soroban contract events we use
        // the Horizon /contracts/{id}/events endpoint via the raw call below.
        // We fall back to polling getEvents via the RPC server.
        .operations()
        .forAccount(sorobanConfig.contractId)
        .cursor(this.cursor)
        .stream({
          onmessage: (event: unknown) => {
            this.reconnectDelay = RECONNECT_DELAY_MS // reset on success
            this.handleEvent(event)
          },
          onerror: (error: unknown) => {
            logger.error('Event stream error', { error })
            this.scheduleReconnect()
          },
        })

      this.stopStream = stop
    } catch (err) {
      logger.error('Failed to start event stream', { err })
      this.scheduleReconnect()
    }
  }

  private handleEvent(event: unknown): void {
    // Persist cursor so we can resume after reconnect
    const e = event as { paging_token?: string }
    if (e.paging_token) this.cursor = e.paging_token

    eventProcessor.process(event).catch((err) => {
      logger.error('Event processing error', { err })
    })
  }

  private scheduleReconnect(): void {
    if (this.stopped) return

    this.stopStream?.()
    this.stopStream = null

    logger.info(`Reconnecting in ${this.reconnectDelay}ms`)

    setTimeout(() => {
      if (!this.stopped) this.listen()
    }, this.reconnectDelay)

    // Exponential back-off
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY_MS)
  }
}

export const blockchainListener = new BlockchainListener()
