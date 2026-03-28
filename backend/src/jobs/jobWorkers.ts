import { Worker } from 'bullmq'
import { redisConnection } from '../queues/queueManager'
import { QUEUE_NAMES } from '../queues'
import { processSyncJob } from './syncJob'
import { processReminderJob } from './reminderJob'
import { processAnalyticsJob } from './analyticsJob'
import { processEmailJob } from './emailJob'
import { processPayoutJob } from './payoutJob'
import { logger } from '../utils/logger'

// Queue names for reminder and analytics (not yet in dedicated queue files)
const REMINDER_QUEUE_NAME = 'reminder'
const ANALYTICS_QUEUE_NAME = 'analytics'

const workers: Worker[] = []

function createWorker(
    queueName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    processor: (job: any) => Promise<void>,
    concurrency = 1
): Worker {
    const worker = new Worker(queueName, processor, {
        connection: redisConnection,
        concurrency,
    })

    worker.on('completed', (job) => {
        logger.info(`Job completed: ${queueName}`, { jobId: job.id })
    })

    worker.on('failed', (job, err) => {
        logger.error(`Job failed: ${queueName}`, {
            jobId: job?.id,
            error: err.message,
            attemptsMade: job?.attemptsMade,
            attemptsTotal: job?.opts?.attempts,
        })
    })

    worker.on('error', (err) => {
        logger.error(`Worker error: ${queueName}`, { error: err.message })
    })

    return worker
}

export function startWorkers(): void {
    logger.info('Starting job workers...')

    workers.push(
        createWorker(QUEUE_NAMES.SYNC, processSyncJob as unknown as (job: any) => Promise<void>),
        createWorker(REMINDER_QUEUE_NAME, processReminderJob as unknown as (job: any) => Promise<void>),
        createWorker(ANALYTICS_QUEUE_NAME, processAnalyticsJob as unknown as (job: any) => Promise<void>),
        createWorker(QUEUE_NAMES.EMAIL, processEmailJob as unknown as (job: any) => Promise<void>, 3),
        createWorker(QUEUE_NAMES.PAYOUT, processPayoutJob as unknown as (job: any) => Promise<void>)
    )

    logger.info(`Started ${workers.length} job workers`)
}

export async function stopWorkers(): Promise<void> {
    logger.info('Stopping job workers...')
    await Promise.all(workers.map((w) => w.close()))
    logger.info('All job workers stopped')
}
