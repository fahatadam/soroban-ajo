import { PrismaClient } from '@prisma/client'
import { auditLog } from './auditService'

const prisma = new PrismaClient()
const prismaAny = prisma as any

export type ReportReason =
  | 'spam'
  | 'fraud'
  | 'harassment'
  | 'inappropriate_content'
  | 'suspicious_activity'
  | 'other'

export type ContentType = 'user' | 'group' | 'transaction' | 'message'

/**
 * Flags a specific piece of content for administrative review.
 * Records the reason for flagging and initiates an audit trail.
 * 
 * @param params - The flagging details
 * @param params.adminId - ID of the administrator or system process flagging the content
 * @param params.contentType - The type of content being flagged (e.g., 'user', 'message')
 * @param params.contentId - The unique ID of the target content
 * @param params.reason - The reason for flagging
 * @param params.notes - Optional additional context
 * @returns Promise resolving to the created moderation flag record
 */
export async function flagContent(params: {
  adminId: string
  contentType: ContentType
  contentId: string
  reason: ReportReason
  notes?: string
}) {
  const flag = await prismaAny.moderationFlag.create({
    data: {
      contentType: params.contentType,
      contentId: params.contentId,
      reason: params.reason,
      notes: params.notes,
      flaggedBy: params.adminId,
      status: 'pending',
    },
  })

  await auditLog({
    adminId: params.adminId,
    action: 'flag_content',
    targetType: params.contentType,
    targetId: params.contentId,
    metadata: { reason: params.reason, flagId: flag.id },
  })

  return flag
}

/**
 * Retrieves a paginated list of moderation flags that are currently pending review.
 * 
 * @param page - The page number to retrieve (default: 1)
 * @param limit - Number of records per page (default: 20)
 * @returns Promise resolving to a paginated result containing flags and metadata
 */
export async function getPendingFlags(page = 1, limit = 20) {
  const [flags, total] = await Promise.all([
    prismaAny.moderationFlag.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prismaAny.moderationFlag.count({ where: { status: 'pending' } }),
  ])

  return { flags, total, page, pages: Math.ceil(total / limit) }
}

/**
 * Resolves an existing moderation flag by either dismissing it or taking action.
 * 
 * @param params - The resolution details
 * @param params.adminId - ID of the administrator resolving the flag
 * @param params.flagId - The ID of the flag to resolve
 * @param params.resolution - The outcome ('dismissed' or 'actioned')
 * @param params.notes - Optional notes regarding the resolution
 * @returns Promise resolving to the updated flag record
 */
export async function resolveFlag(params: {
  adminId: string
  flagId: string
  resolution: 'dismissed' | 'actioned'
  notes?: string
}) {
  const flag = await prismaAny.moderationFlag.update({
    where: { id: params.flagId },
    data: {
      status: params.resolution,
      resolvedBy: params.adminId,
      resolvedAt: new Date(),
      resolutionNotes: params.notes,
    },
  })

  await auditLog({
    adminId: params.adminId,
    action: 'resolve_flag',
    targetType: 'moderation_flag',
    targetId: params.flagId,
    metadata: { resolution: params.resolution },
  })

  return flag
}

/**
 * Suspends a user's account for a specified duration or indefinitely.
 * 
 * @param params - Suspension details
 * @param params.adminId - ID of the administrator performing the suspension
 * @param params.userId - ID of the user to suspend
 * @param params.reason - Reason for the suspension
 * @param params.durationDays - Optional number of days for the suspension
 * @returns Promise resolving to the updated user record
 */
export async function suspendUser(params: {
  adminId: string
  userId: string
  reason: string
  durationDays?: number
}) {
  const suspendedUntil = params.durationDays
    ? new Date(Date.now() + params.durationDays * 86_400_000)
    : null

  const user = await prismaAny.user.update({
    where: { id: params.userId },
    data: {
      status: 'suspended',
      suspendedUntil,
      suspensionReason: params.reason,
    },
  })

  await auditLog({
    adminId: params.adminId,
    action: 'suspend_user',
    targetType: 'user',
    targetId: params.userId,
    metadata: { reason: params.reason, durationDays: params.durationDays },
  })

  return user
}

/**
 * Permanently bans a user's account from the platform.
 * 
 * @param params - Ban details
 * @param params.adminId - ID of the administrator performing the ban
 * @param params.userId - ID of the user to ban
 * @param params.reason - Reason for the ban
 * @returns Promise resolving to the updated user record
 */
export async function banUser(params: { adminId: string; userId: string; reason: string }) {
  const user = await prismaAny.user.update({
    where: { id: params.userId },
    data: { status: 'banned', banReason: params.reason, bannedAt: new Date() },
  })

  await auditLog({
    adminId: params.adminId,
    action: 'ban_user',
    targetType: 'user',
    targetId: params.userId,
    metadata: { reason: params.reason },
  })

  return user
}

export async function reinstateUser(params: { adminId: string; userId: string }) {
  const user = await prismaAny.user.update({
    where: { id: params.userId },
    data: {
      status: 'active',
      suspendedUntil: null,
      suspensionReason: null,
      banReason: null,
      bannedAt: null,
    },
  })

  await auditLog({
    adminId: params.adminId,
    action: 'reinstate_user',
    targetType: 'user',
    targetId: params.userId,
    metadata: {},
  })

  return user
}

export async function cancelGroup(params: { adminId: string; groupId: string; reason: string }) {
  const group = await prismaAny.group.update({
    where: { id: params.groupId },
    data: { status: 'cancelled', cancellationReason: params.reason },
  })

  await auditLog({
    adminId: params.adminId,
    action: 'cancel_group',
    targetType: 'group',
    targetId: params.groupId,
    metadata: { reason: params.reason },
  })

  return group
}

export async function deleteGroup(params: { adminId: string; groupId: string; reason: string }) {
  const group = await prismaAny.group.update({
    where: { id: params.groupId },
    data: { deletedAt: new Date(), deletionReason: params.reason },
  })

  await auditLog({
    adminId: params.adminId,
    action: 'delete_group',
    targetType: 'group',
    targetId: params.groupId,
    metadata: { reason: params.reason },
  })

  return group
}

export async function getUserReports(params: { startDate: Date; endDate: Date }) {
  const [total, newUsers, suspended, banned, active] = await Promise.all([
    prismaAny.user.count(),
    prismaAny.user.count({ where: { createdAt: { gte: params.startDate, lte: params.endDate } } }),
    prismaAny.user.count({ where: { status: 'suspended' } }),
    prismaAny.user.count({ where: { status: 'banned' } }),
    prismaAny.user.count({ where: { status: 'active' } }),
  ])

  return { total, newUsers, suspended, banned, active }
}

export async function getFinancialReport(params: { startDate: Date; endDate: Date }) {
  const transactions = await prismaAny.transaction.aggregate({
    where: { createdAt: { gte: params.startDate, lte: params.endDate } },
    _sum: { amount: true },
    _count: true,
    _avg: { amount: true },
  })

  const byType = await prismaAny.transaction.groupBy({
    by: ['type'],
    where: { createdAt: { gte: params.startDate, lte: params.endDate } },
    _sum: { amount: true },
    _count: true,
  })

  return {
    totalVolume: transactions._sum.amount ?? 0,
    transactionCount: transactions._count,
    averageAmount: transactions._avg.amount ?? 0,
    byType,
  }
}
