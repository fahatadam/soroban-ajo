import { createModuleLogger } from '../utils/logger'
import { parseContractEvent } from '../utils/eventParser'
import {
  handleGroupCreated,
  handleMemberJoined,
  handleContributionMade,
  handlePayoutExecuted,
  handleGroupCompleted,
  handleCycleAdvanced,
} from '../handlers/contractEventHandlers'

const logger = createModuleLogger('EventProcessor')

export class EventProcessor {
  async process(rawEvent: unknown): Promise<void> {
    const event = parseContractEvent(rawEvent)

    logger.debug('Processing event', { type: event.type, groupId: event.groupId })

    try {
      switch (event.type) {
        case 'GroupCreated':
          await handleGroupCreated(event)
          break
        case 'MemberJoined':
          await handleMemberJoined(event)
          break
        case 'ContributionMade':
          await handleContributionMade(event)
          break
        case 'PayoutExecuted':
          await handlePayoutExecuted(event)
          break
        case 'GroupCompleted':
          await handleGroupCompleted(event)
          break
        case 'CycleAdvanced':
          await handleCycleAdvanced(event)
          break
        default:
          logger.debug('Unhandled event type', { type: event.type })
      }
    } catch (err) {
      logger.error('Failed to process event', { type: event.type, groupId: event.groupId, err })
      throw err
    }
  }
}

export const eventProcessor = new EventProcessor()
