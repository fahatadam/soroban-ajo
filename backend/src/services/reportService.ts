/**
 * Report Service
 * Issue #382: Scheduled Reports Generation
 *
 * Generates weekly and monthly report data for users and dispatches
 * emails via the EmailService.
 */
import { prisma } from '../config/database'
import { emailService } from './emailService'
import { createModuleLogger } from '../utils/logger'

const logger = createModuleLogger('ReportService')

export interface WeeklyReportData {
  weekOf: string
  activeGroups: number
  totalSaved: string
  contributionCount: number
  groups: Array<{ name: string; contributions: number; balance: string; status: string }>
}

export interface MonthlyReportData {
  monthOf: string
  totalContributed: string
  totalReceived: string
  groupsJoined: number
  groupsCompleted: number
  contributionCount: number
  groups: Array<{ name: string; contributions: number; balance: string; status: string }>
}

// ── Helpers ────────────────────────────────────────────────────────────────

function stroopsToXlm(stroops: bigint): string {
  return (Number(stroops) / 10_000_000).toFixed(2) + ' XLM'
}

function weekLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// ── Core data builders ─────────────────────────────────────────────────────

async function buildWeeklyData(userId: string, since: Date): Promise<WeeklyReportData> {
  const contributions = await prisma.contribution.findMany({
    where: { userId, createdAt: { gte: since } },
    include: { group: true },
  })

  const groupMap = new Map<string, { name: string; contributions: number; balance: bigint; active: boolean }>()

  for (const c of contributions) {
    const entry = groupMap.get(c.groupId) ?? {
      name: c.group.name,
      contributions: 0,
      balance: 0n,
      active: c.group.isActive,
    }
    entry.contributions += 1
    entry.balance += c.amount
    groupMap.set(c.groupId, entry)
  }

  const totalSaved = contributions.reduce((sum, c) => sum + c.amount, 0n)

  return {
    weekOf: weekLabel(since),
    activeGroups: groupMap.size,
    totalSaved: stroopsToXlm(totalSaved),
    contributionCount: contributions.length,
    groups: Array.from(groupMap.values()).map((g) => ({
      name: g.name,
      contributions: g.contributions,
      balance: stroopsToXlm(g.balance),
      status: g.active ? 'active' : 'completed',
    })),
  }
}

async function buildMonthlyData(userId: string, since: Date): Promise<MonthlyReportData> {
  const [contributions, metrics] = await Promise.all([
    prisma.contribution.findMany({
      where: { userId, createdAt: { gte: since } },
      include: { group: true },
    }),
    prisma.userMetrics.findUnique({ where: { userId } }),
  ])

  const groupMap = new Map<string, { name: string; contributions: number; balance: bigint; active: boolean }>()

  for (const c of contributions) {
    const entry = groupMap.get(c.groupId) ?? {
      name: c.group.name,
      contributions: 0,
      balance: 0n,
      active: c.group.isActive,
    }
    entry.contributions += 1
    entry.balance += c.amount
    groupMap.set(c.groupId, entry)
  }

  const totalContributed = contributions.reduce((sum, c) => sum + c.amount, 0n)

  return {
    monthOf: monthLabel(since),
    totalContributed: stroopsToXlm(totalContributed),
    totalReceived: stroopsToXlm(metrics?.totalReceived ?? 0n),
    groupsJoined: metrics?.groupsJoined ?? 0,
    groupsCompleted: metrics?.groupsCompleted ?? 0,
    contributionCount: contributions.length,
    groups: Array.from(groupMap.values()).map((g) => ({
      name: g.name,
      contributions: g.contributions,
      balance: stroopsToXlm(g.balance),
      status: g.active ? 'active' : 'completed',
    })),
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Send weekly summary emails to all users who have been active in the past week.
 * Called by the cron scheduler every Monday at 9 AM UTC.
 */
export async function sendWeeklyReports(): Promise<{ sent: number; failed: number }> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Find users who made at least one contribution in the past week
  const activeUserIds = await prisma.contribution
    .findMany({
      where: { createdAt: { gte: since } },
      select: { userId: true },
      distinct: ['userId'],
    })
    .then((rows) => rows.map((r) => r.userId))

  if (activeUserIds.length === 0) {
    logger.info('No active users for weekly report')
    return { sent: 0, failed: 0 }
  }

  // Fetch user email addresses (walletAddress is the userId; email stored in profile if available)
  // We use walletAddress as the userId — email must be stored on the User model or a related profile.
  // For now we query users and skip those without an email field.
  const users = await prisma.user.findMany({
    where: { walletAddress: { in: activeUserIds } },
    select: { walletAddress: true },
  })

  let sent = 0
  let failed = 0

  for (const user of users) {
    try {
      const data = await buildWeeklyData(user.walletAddress, since)

      // Skip users with no activity (edge case after filtering)
      if (data.contributionCount === 0) continue

      // walletAddress is used as userId; email delivery requires an email address.
      // We attempt to send to the walletAddress as a placeholder — in production
      // this should be replaced with the user's verified email from a profile table.
      const email = await resolveUserEmail(user.walletAddress)
      if (!email) {
        logger.debug('No email for user, skipping weekly report', { userId: user.walletAddress })
        continue
      }

      const ok = await emailService.sendWeeklySummary(email, data)
      if (ok) {
        sent++
        logger.info('Weekly report sent', { userId: user.walletAddress })
      } else {
        failed++
      }
    } catch (err) {
      failed++
      logger.error('Failed to send weekly report', {
        userId: user.walletAddress,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  logger.info('Weekly reports complete', { sent, failed, total: users.length })
  return { sent, failed }
}

/**
 * Send monthly report emails to all users who have been active in the past month.
 * Called by the cron scheduler on the 1st of each month at 9 AM UTC.
 */
export async function sendMonthlyReports(): Promise<{ sent: number; failed: number }> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const activeUserIds = await prisma.contribution
    .findMany({
      where: { createdAt: { gte: since } },
      select: { userId: true },
      distinct: ['userId'],
    })
    .then((rows) => rows.map((r) => r.userId))

  if (activeUserIds.length === 0) {
    logger.info('No active users for monthly report')
    return { sent: 0, failed: 0 }
  }

  const users = await prisma.user.findMany({
    where: { walletAddress: { in: activeUserIds } },
    select: { walletAddress: true },
  })

  let sent = 0
  let failed = 0

  for (const user of users) {
    try {
      const data = await buildMonthlyData(user.walletAddress, since)

      if (data.contributionCount === 0) continue

      const email = await resolveUserEmail(user.walletAddress)
      if (!email) {
        logger.debug('No email for user, skipping monthly report', { userId: user.walletAddress })
        continue
      }

      const ok = await emailService.sendMonthlyReport(email, data)
      if (ok) {
        sent++
        logger.info('Monthly report sent', { userId: user.walletAddress })
      } else {
        failed++
      }
    } catch (err) {
      failed++
      logger.error('Failed to send monthly report', {
        userId: user.walletAddress,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  logger.info('Monthly reports complete', { sent, failed, total: users.length })
  return { sent, failed }
}

/**
 * Resolve a user's email address.
 * The current schema stores walletAddress as the primary key.
 * This function checks for an email stored in a future profile extension,
 * or falls back to null so the caller can skip the send gracefully.
 *
 * Replace this with a real profile/email lookup once the User model has an email field.
 */
async function resolveUserEmail(walletAddress: string): Promise<string | null> {
  // Attempt to read from a hypothetical `email` field on User.
  // Cast to any to avoid compile errors if the field doesn't exist yet in the schema.
  const user = await (prisma.user.findUnique as any)({
    where: { walletAddress },
    select: { email: true },
  }).catch(() => null)

  return user?.email ?? null
}
