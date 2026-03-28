import { redisClient } from './cacheService'
import { dbService } from './databaseService'

export type DisputeType = 'non_payment' | 'fraud' | 'rule_violation'
export type DisputeStatus = 'open' | 'voting' | 'resolved' | 'escalated'

export interface EvidenceItem {
  id: string
  type: 'text' | 'image' | 'screenshot'
  content: string // text or URL
  uploadedAt: string
}

export interface Dispute {
  id: string
  groupId: string
  filedBy: string
  type: DisputeType
  summary?: string
  evidence: EvidenceItem[]
  status: DisputeStatus
  votes: Record<string, 'yes' | 'no'>
  createdAt: string
  votingDeadline?: string
  decision?: 'yes' | 'no' | 'tie'
  resolvedBy?: string // admin id or empty
  adminDecision?: string
}

const DISPUTE_PREFIX = 'dispute:'
const GROUP_INDEX_PREFIX = 'group_disputes:'

// default voting window in seconds (e.g., 48 hours)
const DEFAULT_VOTING_WINDOW = Number(process.env.DISPUTE_VOTING_WINDOW_SECONDS) || 60 * 60 * 24 * 2

export const disputeService = {
  /**
   * Files a new dispute for a savings group.
   * Only active group members are permitted to initiate disputes.
   * 
   * @param groupId - The ID of the group where the dispute occurred
   * @param filedBy - The wallet address of the user filing the dispute
   * @param type - The category of the dispute (e.g., 'non_payment', 'fraud')
   * @param summary - A brief explanation of the dispute
   * @param evidence - Array of evidence items (text or URLs to screenshots)
   * @returns Promise resolving to the created Dispute object
   * @throws {Error} If the filer is not a member of the group
   */
  async fileDispute(
    groupId: string,
    filedBy: string,
    type: DisputeType,
    summary?: string,
    evidence: { type: EvidenceItem['type']; content: string }[] = []
  ) {
    // verify that filer is a member
    const members = await dbService.getGroupMembers(groupId)
    const isMember = members.some((m: any) => m.userId === filedBy)
    if (!isMember) {
      throw new Error('Only group members can file disputes')
    }

    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()
    const votingDeadline = new Date(Date.now() + DEFAULT_VOTING_WINDOW * 1000).toISOString()

    const dispute: Dispute = {
      id,
      groupId,
      filedBy,
      type,
      summary,
      evidence: evidence.map((e) => ({
        id: crypto.randomUUID(),
        type: e.type,
        content: e.content,
        uploadedAt: new Date().toISOString(),
      })),
      status: 'voting',
      votes: {},
      createdAt,
      votingDeadline,
    }

    await redisClient.set(DISPUTE_PREFIX + id, JSON.stringify(dispute))
    await redisClient.sadd(GROUP_INDEX_PREFIX + groupId, id)

    return dispute
  },

  /**
   * Retrieves a single dispute record by its unique ID from the cache.
   * 
   * @param id - The unique identifier of the dispute
   * @returns Promise resolving to the Dispute object or null if not found
   */
  async getDispute(id: string): Promise<Dispute | null> {
    const raw = await redisClient.get(DISPUTE_PREFIX + id)
    if (!raw) return null
    return JSON.parse(raw) as Dispute
  },

  /**
   * Lists all disputes associated with a specific savings group.
   * 
   * @param groupId - The ID of the group
   * @returns Promise resolving to an array of Dispute objects
   */
  async listGroupDisputes(groupId: string) {
    const ids = await redisClient.smembers(GROUP_INDEX_PREFIX + groupId)
    const pipe = redisClient.pipeline()
    ids.forEach((id: string) => pipe.get(DISPUTE_PREFIX + id))
    const res = await pipe.exec()
    return (res || [])
      .map((r: any) => (r && r[1] ? JSON.parse(r[1] as string) : null))
      .filter(Boolean) as Dispute[]
  },

  /**
   * Registers a member's vote ('yes' or 'no') on an open dispute.
   * Automatically attempts to resolve the dispute if a majority is reached.
   * 
   * @param disputeId - The ID of the dispute to vote on
   * @param voter - The wallet address of the voter
   * @param vote - The vote choice ('yes' or 'no')
   * @returns Promise resolving to the updated Dispute object
   * @throws {Error} If the dispute is not found, voting is closed, or voter is not a member
   */
  async voteOnDispute(disputeId: string, voter: string, vote: 'yes' | 'no') {
    const dispute = await this.getDispute(disputeId)
    if (!dispute) throw new Error('Dispute not found')
    if (dispute.status !== 'voting') throw new Error('Voting not open')
    if (new Date(dispute.votingDeadline || 0).getTime() < Date.now()) {
      throw new Error('Voting period has ended')
    }

    // verify voter is a group member
    const members = await dbService.getGroupMembers(dispute.groupId)
    const isMember = members.some((m: any) => m.userId === voter)
    if (!isMember) throw new Error('Only group members may vote')

    dispute.votes[voter] = vote

    // persist
    await redisClient.set(DISPUTE_PREFIX + disputeId, JSON.stringify(dispute))

    // quick auto-tally after vote: if majority reached before deadline
    await this.tryAutoResolve(disputeId)

    return dispute
  },

  /**
   * Evaluates a dispute for automatic resolution based on community votes.
   * If a majority threshold (>50%) is reached for either side, the dispute is resolved.
   * If the voting deadline has passed without a majority, the dispute is escalated to admins.
   * 
   * @param disputeId - The ID of the dispute to evaluate
   * @returns Promise resolving to the (potentially updated) Dispute object
   * @internal
   */
  async tryAutoResolve(disputeId: string) {
    const dispute = await this.getDispute(disputeId)
    if (!dispute) return null
    if (dispute.status !== 'voting') return dispute

    const members = await dbService.getGroupMembers(dispute.groupId)
    const totalMembers = members.length
    const votes = Object.values(dispute.votes)
    const yes = votes.filter((v) => v === 'yes').length
    const no = votes.filter((v) => v === 'no').length

    // majority threshold (>50%)
    const majority = Math.ceil(totalMembers / 2)

    if (yes >= majority) {
      dispute.status = 'resolved'
      dispute.decision = 'yes'
      dispute.resolvedBy = 'community'
      await redisClient.set(DISPUTE_PREFIX + disputeId, JSON.stringify(dispute))
      return dispute
    }

    if (no >= majority) {
      dispute.status = 'resolved'
      dispute.decision = 'no'
      dispute.resolvedBy = 'community'
      await redisClient.set(DISPUTE_PREFIX + disputeId, JSON.stringify(dispute))
      return dispute
    }

    // if voting deadline passed -> escalate
    if (new Date(dispute.votingDeadline || 0).getTime() < Date.now()) {
      dispute.status = 'escalated'
      await redisClient.set(DISPUTE_PREFIX + disputeId, JSON.stringify(dispute))
      return dispute
    }

    return dispute
  },

  /**
   * Manually escalates a dispute to administrative review.
   * 
   * @param disputeId - The ID of the dispute to escalate
   * @returns Promise resolving to the updated Dispute object
   * @throws {Error} If the dispute is not found
   */
  async escalateToAdmin(disputeId: string) {
    const dispute = await this.getDispute(disputeId)
    if (!dispute) throw new Error('Dispute not found')
    dispute.status = 'escalated'
    await redisClient.set(DISPUTE_PREFIX + disputeId, JSON.stringify(dispute))
    return dispute
  },

  /**
   * Allows an administrator to provide a final resolution for an escalated dispute.
   * 
   * @param disputeId - The ID of the dispute to resolve
   * @param adminId - The unique ID of the resolving administrator
   * @param decision - The final decision or explanation from the admin
   * @returns Promise resolving to the resolved Dispute object
   * @throws {Error} If the dispute is not found
   */
  async adminResolve(disputeId: string, adminId: string, decision: string) {
    const dispute = await this.getDispute(disputeId)
    if (!dispute) throw new Error('Dispute not found')
    dispute.status = 'resolved'
    dispute.resolvedBy = adminId
    dispute.adminDecision = decision
    await redisClient.set(DISPUTE_PREFIX + disputeId, JSON.stringify(dispute))
    return dispute
  },
}
