import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'
import { groupsRouter } from './routes/groups'
import { healthRouter } from './routes/health'
import { webhooksRouter } from './routes/webhooks'
import { authRouter } from './routes/auth'
import { analyticsRouter } from './routes/analytics'
import { emailRouter } from './routes/email'
import { jobsRouter } from './routes/jobs'
import { gamificationRouter } from './routes/gamification'
import { goalsRouter } from './routes/goals'
import { setupSwagger } from './swagger'
import { createIpLimiter, createUserLimiter } from './middleware/rateLimiter'
import { createDdosProtector } from './middleware/ddosProtector'
import { kycRouter } from './routes/kyc'
import { disputesRouter } from './routes/disputes'
import rewardsRouter from './routes/rewards'
import referralsRouter from './routes/referrals'
import { chatRouter } from './routes/chat'
import { chatService } from './services/chatService'
import { logger } from './utils/logger'

dotenv.config()

const app = express()
const server = createServer(app)

// Initialize Socket.IO with chat service
chatService.init(server)

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173']
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  })
)
app.use(requestLogger)
app.set('trust proxy', 1)
app.use(createDdosProtector())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/api', createIpLimiter('global'))

// API Documentation
setupSwagger(app)

// Routes
app.use('/health', healthRouter)
app.use('/api/auth', createIpLimiter('auth'), authRouter)
app.use('/api/groups', createUserLimiter(), groupsRouter)
app.use('/api/webhooks', createIpLimiter('auth'), webhooksRouter)
app.use('/api/analytics', createUserLimiter(), analyticsRouter)
app.use('/api/email', emailRouter)
app.use('/api/jobs', jobsRouter)
app.use('/api/gamification', createIpLimiter('expensive'), createUserLimiter(), gamificationRouter)
app.use('/api/goals', createUserLimiter(), goalsRouter)
app.use('/api/kyc', kycRouter)
app.use('/api/disputes', disputesRouter)
app.use('/api/rewards', rewardsRouter)
app.use('/api/referrals', referralsRouter)
app.use('/api/chat', createUserLimiter(), chatRouter)

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
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, { env: process.env.NODE_ENV || 'development' })
  logger.info('Socket.IO chat service initialized')
})

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...')
  server.close(() => {
    logger.info('HTTP server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

export { app, server }
export default app
