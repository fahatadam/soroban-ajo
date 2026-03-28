import * as StellarSdk from 'stellar-sdk'

export type ContractEventType =
  | 'GroupCreated'
  | 'MemberJoined'
  | 'ContributionMade'
  | 'PayoutExecuted'
  | 'GroupCompleted'
  | 'CycleAdvanced'
  | 'GroupCancelled'
  | 'LateContribution'
  | 'PenaltyDistributed'
  | 'RefundRequested'
  | 'RefundVote'
  | 'RefundProcessed'
  | 'EmergencyRefund'
  | 'PayoutVote'
  | 'PayoutOrderDetermined'
  | 'ReminderTriggered'
  | 'MilestoneAchieved'
  | 'AchievementEarned'
  | 'MultiTokenGroupCreated'
  | 'TokenContribution'
  | 'MultiTokenPayout'
  | 'Unknown'

// Map Soroban symbol_short topic names to our event types
const TOPIC_MAP: Record<string, ContractEventType> = {
  created: 'GroupCreated',
  joined: 'MemberJoined',
  contrib: 'ContributionMade',
  payout: 'PayoutExecuted',
  complete: 'GroupCompleted',
  cycle: 'CycleAdvanced',
  cancel: 'GroupCancelled',
  late: 'LateContribution',
  pendistr: 'PenaltyDistributed',
  refreq: 'RefundRequested',
  refvote: 'RefundVote',
  refund: 'RefundProcessed',
  emrefund: 'EmergencyRefund',
  pvote: 'PayoutVote',
  porder: 'PayoutOrderDetermined',
  remind: 'ReminderTriggered',
  mileston: 'MilestoneAchieved',
  achieve: 'AchievementEarned',
  mtcreat: 'MultiTokenGroupCreated',
  tkcontr: 'TokenContribution',
  mtpay: 'MultiTokenPayout',
}

export interface ParsedContractEvent {
  type: ContractEventType
  groupId?: string
  ledger: number
  txHash: string
  data: Record<string, unknown>
}

function scValToNative(val: StellarSdk.xdr.ScVal): unknown {
  try {
    return StellarSdk.scValToNative(val)
  } catch {
    return val.toString()
  }
}

export function parseContractEvent(raw: unknown): ParsedContractEvent {
  const event = raw as {
    topic?: StellarSdk.xdr.ScVal[]
    value?: StellarSdk.xdr.ScVal
    ledger?: number
    txHash?: string
    id?: string
  }

  const topics = event.topic ?? []
  const firstTopic = topics[0] ? scValToNative(topics[0]) : undefined
  const eventType: ContractEventType =
    typeof firstTopic === 'string' ? (TOPIC_MAP[firstTopic] ?? 'Unknown') : 'Unknown'

  // Second topic is usually groupId (u64)
  const groupId = topics[1] ? String(scValToNative(topics[1])) : undefined

  const value = event.value ? scValToNative(event.value) : undefined

  return {
    type: eventType,
    groupId,
    ledger: event.ledger ?? 0,
    txHash: event.txHash ?? event.id ?? '',
    data: { raw: value },
  }
}
