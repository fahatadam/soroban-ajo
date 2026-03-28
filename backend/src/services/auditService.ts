import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const prismaAny = prisma as any

export interface AuditLogEntry {
  adminId: string
  action: string
  targetType: string
  targetId: string
  metadata: Record<string, unknown>
  ipAddress?: string
}

/**
 * Creates a new administrative audit log entry in the database.
 * Use this to record sensitive admin actions (e.g., modifying users, clearing flags).
 * 
 * @param entry - The audit log details including actor, action, and target
 * @returns Promise resolving to the created audit log record
 */
export async function auditLog(entry: AuditLogEntry) {
  return prismaAny.adminAuditLog.create({
    data: {
      adminId: entry.adminId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      metadata: entry.metadata as any,
      ipAddress: entry.ipAddress,
    },
  })
}

/**
 * Retrieves a paginated list of administrative audit logs with optional filters.
 * 
 * @param params - Query parameters for filtering and pagination
 * @param params.adminId - Filter by a specific administrator
 * @param params.action - Filter by a specific action name
 * @param params.targetType - Filter by target entity type
 * @param params.startDate - Return logs created after this date
 * @param params.endDate - Return logs created before this date
 * @param params.page - Page number for results (default: 1)
 * @param params.limit - Records per page (default: 50)
 * @returns Promise resolving to the logs, total count, and pagination info
 */
export async function getAuditLogs(params: {
  adminId?: string
  action?: string
  targetType?: string
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}) {
  const { page = 1, limit = 50 } = params

  const where: Record<string, unknown> = {}
  if (params.adminId) where.adminId = params.adminId
  if (params.action) where.action = params.action
  if (params.targetType) where.targetType = params.targetType
  if (params.startDate || params.endDate) {
    where.createdAt = {
      ...(params.startDate ? { gte: params.startDate } : {}),
      ...(params.endDate ? { lte: params.endDate } : {}),
    }
  }

  const [logs, total] = await Promise.all([
    prismaAny.adminAuditLog.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { admin: { select: { email: true, role: true } } },
    }),
    prismaAny.adminAuditLog.count({ where: where as any }),
  ])

  return { logs, total, page, pages: Math.ceil(total / limit) }
}
