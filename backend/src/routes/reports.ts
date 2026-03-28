import { Router, Request, Response } from 'express'
import { createQueue, getQueue } from '../queues/queueManager'
import { REMINDER_QUEUE_NAME } from '../jobs/workers'
import { adminAuth } from '../middleware/adminAuth'
import { logger } from '../utils/logger'

export const reportsRouter = Router()

function getReminderQueue() {
  return getQueue(REMINDER_QUEUE_NAME) || createQueue(REMINDER_QUEUE_NAME)
}

/**
 * @swagger
 * /api/reports/trigger/weekly:
 *   post:
 *     summary: Manually trigger weekly summary report dispatch (admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       202:
 *         description: Weekly report job queued
 */
reportsRouter.post('/trigger/weekly', adminAuth('reports:read'), async (_req: Request, res: Response) => {
  try {
    const job = await getReminderQueue().add('weekly-summary-manual', { type: 'weekly_summary' })
    logger.info('Manual weekly report triggered', { jobId: job.id })
    res.status(202).json({ success: true, jobId: job.id, message: 'Weekly report job queued' })
  } catch (error) {
    logger.error('Failed to queue weekly report', { error })
    res.status(500).json({ success: false, error: 'Failed to queue weekly report' })
  }
})

/**
 * @swagger
 * /api/reports/trigger/monthly:
 *   post:
 *     summary: Manually trigger monthly report dispatch (admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       202:
 *         description: Monthly report job queued
 */
reportsRouter.post('/trigger/monthly', adminAuth('reports:read'), async (_req: Request, res: Response) => {
  try {
    const job = await getReminderQueue().add('monthly-report-manual', { type: 'monthly_report' })
    logger.info('Manual monthly report triggered', { jobId: job.id })
    res.status(202).json({ success: true, jobId: job.id, message: 'Monthly report job queued' })
  } catch (error) {
    logger.error('Failed to queue monthly report', { error })
    res.status(500).json({ success: false, error: 'Failed to queue monthly report' })
  }
})

/**
 * @swagger
 * /api/reports/schedule:
 *   get:
 *     summary: Get the current report schedule (admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Report schedule info
 */
reportsRouter.get('/schedule', adminAuth('reports:read'), (_req: Request, res: Response) => {
  res.json({
    weekly: {
      description: 'Weekly summary emails',
      schedule: 'Every Monday at 09:00 UTC',
      cron: '0 9 * * 1',
    },
    monthly: {
      description: 'Monthly report emails',
      schedule: '1st of each month at 09:00 UTC',
      cron: '0 9 1 * *',
    },
  })
})
