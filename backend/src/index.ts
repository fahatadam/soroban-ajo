import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'
import { logger } from './utils/logger'
import { groupsRouter } from './routes/groups'
import { webhooksRouter } from './routes/webhooks'
import { authRouter } from './routes/auth'
import { analyticsRouter } from './routes/analytics'
import { emailRouter } from './routes/email'
import { jobsRouter } from './routes/jobs'
import { gamificationRouter } from './routes/gamification'
import { goalsRouter } from './routes/goals'
import { setupSwagger } from './swagger'
import { apiLimiter, strictLimiter } from './middleware/rateLimiter'
import { startWorkers, stopWorkers } from './jobs/jobWorkers'
import { startScheduler, stopScheduler } from './cron/scheduler'
import { kycRouter } from './routes/kyc'
import { disputesRouter } from './routes/disputes'

// New Monitoring Imports
import healthRouter from './routes/health' // Consolidated default import
import { metricsMiddleware } from './middleware/metrics'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// 1. Security & Basic Middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173']
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  })
)

// 2. Observability Middleware (Must be placed before routes)
app.use(requestLogger)
app.use(metricsMiddleware) // Tracks duration and count for all subsequent requests

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/api', apiLimiter)
app.set('trust proxy', 1)

// API Documentation
setupSwagger(app)

// 3. Health & Metrics Routes
// Mounted at '/' because internal paths are /health, /health/live, and /metrics
app.use('/', healthRouter)

// 4. Feature Routes
app.use('/api/auth', strictLimiter, authRouter)
app.use('/api/groups', groupsRouter)
app.use('/api/webhooks', strictLimiter, webhooksRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/email', emailRouter)
app.use('/api/jobs', jobsRouter)
app.use('/api/gamification', gamificationRouter)
app.use('/api/goals', goalsRouter)
app.use('/api/kyc', kycRouter)
app.use('/api/disputes', disputesRouter)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
  })
})

// Error handling
app.use(errorHandler)

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, { env: process.env.NODE_ENV || 'development' })

  try {
    startWorkers()
    startScheduler()
    logger.info('Background jobs and cron scheduler started')
  } catch (err) {
    logger.error('Failed to start background jobs', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
})

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...')
  if (server && server.close) {
    server.close((err?: Error) => {
      if (err) {
        logger.error('Error closing server', { error: err.message })
      } else {
        logger.info('HTTP server closed')
      }
    })
  }

  stopScheduler()
  await stopWorkers()
  setTimeout(() => process.exit(0), 100)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

export default app