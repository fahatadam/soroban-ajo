import { PrismaClient } from '@prisma/client'
import { auditLog } from './auditService'

const prisma = new PrismaClient()
const prismaAny = prisma as any

let configCache: Record<string, unknown> | null = null
let cacheExpiry = 0

async function loadConfig(): Promise<Record<string, unknown>> {
  if (configCache && Date.now() < cacheExpiry) return configCache

  const entries = await prismaAny.systemConfig.findMany()
  const config: Record<string, unknown> = {}
  for (const e of entries) {
    config[e.key] = JSON.parse(e.value)
  }

  configCache = config
  cacheExpiry = Date.now() + 60_000
  return config
}

/**
 * Retrieves the full system configuration object.
 * Uses a 60-second in-memory cache for performance.
 * 
 * @returns Promise resolving to the system configuration map
 */
/**
 * Retrieves the full system configuration object.
 * Uses a 60-second in-memory cache for performance.
 * 
 * @returns Promise resolving to the system configuration map
 */
export async function getConfig() {
  return loadConfig()
}

/**
 * Retrieves a specific configuration value by key with an optional fallback.
 * 
 * @param key - The configuration key
 * @param fallback - Optional value to return if the key is not found
 * @returns Promise resolving to the configuration value or fallback
 */
/**
 * Retrieves a specific configuration value by key with an optional fallback.
 * 
 * @param key - The configuration key
 * @param fallback - Optional value to return if the key is not found
 * @returns Promise resolving to the configuration value or fallback
 */
export async function getConfigValue<T = unknown>(key: string, fallback?: T): Promise<T> {
  const config = await loadConfig()
  return (config[key] ?? fallback) as T
}

/**
 * Updates or creates a system configuration entry and records an administrative audit log.
 * Clears the configuration cache upon successful update.
 * 
 * @param params - Configuration update details
 * @param params.adminId - ID of the administrator performing the update
 * @param params.key - The configuration key
 * @param params.value - The new value to set
 * @param params.description - Optional description of the configuration key
 * @returns Promise resolving when the configuration is updated
 */
/**
 * Updates or creates a system configuration entry and records an administrative audit log.
 * Clears the configuration cache upon successful update.
 * 
 * @param params - Configuration update details
 * @param params.adminId - ID of the administrator performing the update
 * @param params.key - The configuration key
 * @param params.value - The new value to set
 * @param params.description - Optional description of the configuration key
 * @returns Promise resolving when the configuration is updated
 */
export async function setConfig(params: {
  adminId: string
  key: string
  value: unknown
  description?: string
}) {
  const prev = await getConfigValue(params.key)

  await prismaAny.systemConfig.upsert({
    where: { key: params.key },
    create: {
      key: params.key,
      value: JSON.stringify(params.value),
      description: params.description,
    },
    update: {
      value: JSON.stringify(params.value),
      ...(params.description ? { description: params.description } : {}),
    },
  })

  configCache = null

  await auditLog({
    adminId: params.adminId,
    action: 'update_config',
    targetType: 'system_config',
    targetId: params.key,
    metadata: { key: params.key, prev, next: params.value },
  })
}

export async function setMaintenanceMode(adminId: string, enabled: boolean, message?: string) {
  await setConfig({ adminId, key: 'maintenance_mode', value: { enabled, message } })
}

export async function setFeatureFlag(adminId: string, flag: string, enabled: boolean) {
  const flags = await getConfigValue<Record<string, boolean>>('feature_flags', {})
  flags[flag] = enabled
  await setConfig({ adminId, key: 'feature_flags', value: flags })
}

export async function setRateLimits(adminId: string, limits: Record<string, number>) {
  await setConfig({ adminId, key: 'rate_limits', value: limits })
}

export async function setFeeSettings(
  adminId: string,
  fees: {
    platformFeePercent?: number
    minFee?: number
    maxFee?: number
    withdrawalFee?: number
  }
) {
  const current = await getConfigValue<Record<string, number>>('fee_settings', {})
  await setConfig({ adminId, key: 'fee_settings', value: { ...current, ...fees } })
}

/**
 * Generates a high-level overview of system health and activity metrics.
 * 
 * @returns Promise resolving to the health status and key system metrics
 */
/**
 * Generates a high-level overview of system health and activity metrics.
 * 
 * @returns Promise resolving to the health status and key system metrics
 */
export async function getSystemHealth() {
  const [userCount, groupCount, txCount, pendingFlags] = await Promise.all([
    prismaAny.user.count({ where: { status: 'active' } }),
    prismaAny.group.count({ where: { deletedAt: null } }),
    prismaAny.transaction.count({
      where: { createdAt: { gte: new Date(Date.now() - 86_400_000) } },
    }),
    prismaAny.moderationFlag.count({ where: { status: 'pending' } }),
  ])

  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    metrics: {
      activeUsers: userCount,
      activeGroups: groupCount,
      transactionsLast24h: txCount,
      pendingModerationFlags: pendingFlags,
    },
  }
}
