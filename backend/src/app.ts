import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'
import { healthRouter } from './routes/health'
import { setupSwagger } from './swagger'
import { createIpLimiter } from './middleware/rateLimiter'
import { createDdosProtector } from './middleware/ddosProtector'
import { chatService } from './services/chatService'
import { notificationService } from './services/notificationService'
import { logger } from './utils/logger'
import { apiVersionMiddleware } from './middleware/apiVersion'
import { v1Router } from './routes/v1'
import { v2Router } from './routes/v2'

dotenv.config()

const app = express()
const server = createServer(app)

// Initialize Socket.IO with chat service
chatService.init(server)

// Attach notification namespace to the same Socket.IO server
const chatIO = chatService.getIO()
if (chatIO) {
  notificationService.init(chatIO)
} else {
  logger.warn('chatService IO not available; notifications namespace not initialized')
}

// Core middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173']
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    exposedHeaders: [
      'X-API-Version',
      'X-API-Current-Version',
      'Deprecation',
      'Sunset',
      'X-API-Deprecation-Date',
      'X-API-Sunset-Date',
      'X-API-Migration-Guide',
      'X-API-Breaking-Changes',
    ],
  })
)
app.use(requestLogger)
app.set('trust proxy', 1)
app.use(createDdosProtector())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API Documentation
setupSwagger(app)

// Health (unversioned — infrastructure concern, not API resource)
app.use('/health', healthRouter)

// Versioned APIs
// All routes live under /api/v1/ or /api/v2/
app.use('/api/v2', createIpLimiter('global'), apiVersionMiddleware, v2Router)
app.use('/api/v1', createIpLimiter('global'), apiVersionMiddleware, v1Router)

// Backward-compatible redirect: /api/<resource> → /api/v2/<resource>
// Updated to point to latest version (v2) for new clients
// Clients on the old paths continue to work without changes.
app.use('/api/:resource', (req, res) => {
  const target = `/api/v2/${req.params.resource}${req.path === '/' ? '' : req.path}`
  res.redirect(308, target)
})

// Version info endpoint (unversioned, informational)
app.use('/api-versions', (req, res) => {
  res.json({
    currentVersion: 'v2',
    supportedVersions: ['v1', 'v2'],
    v1: {
      status: 'supported',
      releaseDate: '2024-01-01',
      sunsetDate: null,
      url: '/api/v1/',
    },
    v2: {
      status: 'active',
      releaseDate: '2026-04-01',
      sunsetDate: null,
      url: '/api/v2/',
      features: ['Enhanced pagination', 'Improved error handling', 'Better deprecation support'],
    },
  })
})

// 404 & error handlers
app.use(notFoundHandler)
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, { env: process.env.NODE_ENV || 'development' })
  logger.info('Socket.IO chat service initialized')
  logger.info('API versioning enabled - v1 (legacy) and v2 (current) supported')
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
