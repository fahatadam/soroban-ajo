import { dbService } from '../services/databaseService'
import { notificationService } from '../services/notificationService'
import { createModuleLogger } from '../utils/logger'
import type { ParsedContractEvent } from '../utils/eventParser'

const logger = createModuleLogger('ContractEventHandlers')

export async function handleGroupCreated(event: ParsedContractEvent): Promise<void> {
  const { groupId, data } = event
  if (!groupId) return

  const raw = data.raw as [string, bigint, number] | undefined
  if (!raw) return

  const [creator, contributionAmount, maxMembers] = raw

  await dbService.upsertGroup(groupId, {
    name: `Group ${groupId}`,
    contributionAmount: BigInt(contributionAmount),
    frequency: 30, // default monthly
    maxMembers,
    isActive: true,
  })

  await dbService.upsertUser(creator)
  logger.info('Group created', { groupId, creator })
}

export async function handleMemberJoined(event: ParsedContractEvent): Promise<void> {
  const { groupId, data } = event
  if (!groupId) return

  const member = data.raw as string | undefined
  if (!member) return

  await dbService.addGroupMember(groupId, member)

  await notificationService.sendToGroup(
    groupId,
    {
      type: 'member_joined',
      title: 'New Member',
      message: `A new member joined the group.`,
      groupId,
    },
    member
  )

  logger.info('Member joined', { groupId, member })
}

export async function handleContributionMade(event: ParsedContractEvent): Promise<void> {
  const { groupId, data, txHash } = event
  if (!groupId) return

  const raw = data.raw as [string, bigint] | undefined
  if (!raw) return

  const [member, amount] = raw

  // Avoid duplicate processing
  const existing = await dbService.getContributionByTxHash(txHash)
  if (existing) return

  // Extract cycle from topics (index 2) — stored in data by parser if needed
  const cycle = (data.cycle as number) ?? 0

  await dbService.addContribution({
    groupId,
    walletAddress: member,
    amount: BigInt(amount),
    round: cycle,
    txHash,
  })

  notificationService.sendToUser(member, {
    type: 'contribution_received',
    title: 'Contribution Confirmed',
    message: `Your contribution of ${amount} stroops was recorded.`,
    groupId,
  })

  logger.info('Contribution made', { groupId, member, amount: amount.toString(), cycle })
}

export async function handlePayoutExecuted(event: ParsedContractEvent): Promise<void> {
  const { groupId, data } = event
  if (!groupId) return

  const raw = data.raw as [string, bigint] | undefined
  if (!raw) return

  const [recipient, amount] = raw

  notificationService.sendToUser(recipient, {
    type: 'payout_received',
    title: 'Payout Received',
    message: `You received a payout of ${amount} stroops.`,
    groupId,
  })

  logger.info('Payout executed', { groupId, recipient, amount: amount.toString() })
}

export async function handleGroupCompleted(event: ParsedContractEvent): Promise<void> {
  const { groupId } = event
  if (!groupId) return

  await dbService.upsertGroup(groupId, {
    name: `Group ${groupId}`,
    contributionAmount: BigInt(0),
    frequency: 0,
    maxMembers: 0,
    isActive: false,
  })

  await notificationService.sendToGroup(groupId, {
    type: 'cycle_completed',
    title: 'Group Completed',
    message: 'All cycles have been completed. The group is now closed.',
    groupId,
  })

  logger.info('Group completed', { groupId })
}

export async function handleCycleAdvanced(event: ParsedContractEvent): Promise<void> {
  const { groupId, data } = event
  if (!groupId) return

  const raw = data.raw as [number, bigint] | undefined
  const newCycle = raw?.[0]

  await dbService.upsertGroup(groupId, {
    name: `Group ${groupId}`,
    contributionAmount: BigInt(0),
    frequency: 0,
    maxMembers: 0,
    currentRound: newCycle,
  })

  logger.info('Cycle advanced', { groupId, newCycle })
}
