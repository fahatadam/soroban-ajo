import { getQueue, getQueueStats } from '../queues/queueManager'
import { 
  EMAIL_QUEUE_NAME, 
  PAYOUT_QUEUE_NAME, 
  SYNC_QUEUE_NAME, 
  NOTIFICATION_QUEUE_NAME 
} from '../queues'
import { logger } from '../utils/logger'

// Queue statistics interface
export interface QueueStats {
  name: string
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
}

// Failed job info interface
export interface FailedJobInfo {
  id: string
  name: string
  data: any
  failedReason: string
  failedAt: string
  attemptsMade: number
}

  /**
   * Retrieves high-level state statistics for a specific background job queue.
   * 
   * @param queueName - The unique name of the queue (e.g., 'email_queue')
   * @returns Promise resolving to the queue statistics or null if the queue is not found
   */
export async function getQueueStatistics(queueName: string): Promise<QueueStats | null> {
  const stats = await getQueueStats(queueName)
  if (!stats) return null
  
  return {
    name: queueName,
    ...stats,
  }
}

  /**
   * Compiles statistics for all active background job queues in the system.
   * 
   * @returns Promise resolving to an array of statistics for all queues
   */
export async function getAllQueueStatistics(): Promise<QueueStats[]> {
  const queueNames = [EMAIL_QUEUE_NAME, PAYOUT_QUEUE_NAME, SYNC_QUEUE_NAME, NOTIFICATION_QUEUE_NAME]
  const allStats: QueueStats[] = []
  
  for (const name of queueNames) {
    const stats = await getQueueStatistics(name)
    if (stats) {
      allStats.push(stats)
    }
  }
  
  return allStats
}

  /**
   * Fetches a paginated list of failed jobs from a specific queue.
   * 
   * @param queueName - The name of the target queue
   * @param start - Pagination start index (default: 0)
   * @param end - Pagination end index (default: 10)
   * @returns Promise resolving to a list of failed job details
   */
export async function getFailedJobs(
  queueName: string, 
  start: number = 0, 
  end: number = 10
): Promise<FailedJobInfo[]> {
  const queue = getQueue(queueName)
  if (!queue) return []
  
  const failedJobs = await queue.getFailed(start, end)
  
  return failedJobs.map((job: any) => ({
    id: job.id || 'unknown',
    name: job.name,
    data: job.data,
    failedReason: job.failedReason || 'Unknown error',
    failedAt: new Date(job.timestamp).toISOString(),
    attemptsMade: job.attemptsMade,
  }))
}

/**
 * Get a specific job by ID
 */
export async function getJobById(queueName: string, jobId: string): Promise<any> {
  const queue = getQueue(queueName)
  if (!queue) return null
  
  const job = await queue.getJob(jobId)
  if (!job) return null
  
  const state = await job.getState()
  
  return {
    id: job.id,
    name: job.name,
    data: job.data,
    progress: job.progress,
    state,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
    finishedOn: job.finishedOn,
    processedOn: job.processedOn,
    timestamp: job.timestamp,
  }
}

  /**
   * Re-queues a failed job for another processing attempt.
   * 
   * @param queueName - The name of the queue containing the job
   * @param jobId - The unique ID of the failed job
   * @returns Promise resolving to true if the job was successfully re-queued
   */
export async function retryFailedJob(queueName: string, jobId: string): Promise<boolean> {
  const queue = getQueue(queueName)
  if (!queue) return false
  
  const job = await queue.getJob(jobId)
  if (!job) return false
  
  await job.retry()
  logger.info(`Job ${jobId} in queue ${queueName} has been requeued for retry`)
  
  return true
}

/**
 * Remove a specific job
 */
export async function removeJob(queueName: string, jobId: string): Promise<boolean> {
  const queue = getQueue(queueName)
  if (!queue) return false
  
  const job = await queue.getJob(jobId)
  if (!job) return false
  
  await job.remove()
  logger.info(`Job ${jobId} removed from queue ${queueName}`)
  
  return true
}

/**
 * Clean old completed jobs from a queue
 */
export async function cleanCompletedJobs(queueName: string, age: number = 3600): Promise<number> {
  const queue = getQueue(queueName)
  if (!queue) return 0
  
  const cleanedJobIds = await queue.clean(age, 1000, 'completed')
  const count = Array.isArray(cleanedJobIds) ? cleanedJobIds.length : 0
  logger.info(`Cleaned ${count} completed jobs from queue ${queueName}`)
  
  return count
}

/**
 * Clean old failed jobs from a queue
 */
export async function cleanFailedJobs(queueName: string, age: number = 86400): Promise<number> {
  const queue = getQueue(queueName)
  if (!queue) return 0
  
  const cleanedJobIds = await queue.clean(age, 1000, 'failed')
  const count = Array.isArray(cleanedJobIds) ? cleanedJobIds.length : 0
  logger.info(`Cleaned ${count} failed jobs from queue ${queueName}`)
  
  return count
}

/**
 * Get overall system health status
 */
export async function getSystemHealth(): Promise<{
  healthy: boolean
  queues: QueueStats[]
  totalFailed: number
  totalActive: number
}> {
  const stats = await getAllQueueStatistics()
  
  const totalFailed = stats.reduce((sum, q) => sum + q.failed, 0)
  const totalActive = stats.reduce((sum, q) => sum + q.active, 0)
  
  // System is healthy if no queues have excessive failures
  const healthy = !stats.some((q) => q.failed > 100)
  
  return {
    healthy,
    queues: stats,
    totalFailed,
    totalActive,
  }
}
