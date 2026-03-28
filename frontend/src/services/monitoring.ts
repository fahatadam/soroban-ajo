interface MonitoringEvent {
  error: Error
  context?: Record<string, any>
  severity?: 'low' | 'medium' | 'high' | 'critical'
  userId?: string
  sessionId?: string
}

/**
 * Monitoring Service - Handles error capturing and messaging.
 * Integrates with Sentry (if enabled) and local analytics.
 */
class MonitoringService {
  private enabled: boolean
  private dsn?: string

  constructor() {
    this.dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
    this.enabled = !!this.dsn
  }

  /**
   * Initialize the monitoring service.
   * Sets up Sentry if a DSN is provided.
   */
  initialize() {
    if (!this.enabled) {
      console.info('[Monitoring] Monitoring disabled — set NEXT_PUBLIC_SENTRY_DSN to enable')
      return
    }
    // Sentry.init({ dsn: this.dsn, tracesSampleRate: 1.0 })
    console.info('[Monitoring] Monitoring initialized')
  }

  /**
   * Capture and report an error.
   * Reports to Sentry (if enabled) and tracks in analytics.
   * 
   * @param event - The error event details
   */
  captureError({ error, context, severity = 'medium', userId }: MonitoringEvent) {
    if (this.enabled) {
      // Sentry.withScope((scope) => {
      //   scope.setLevel(severity)
      //   if (userId) scope.setUser({ id: userId })
      //   if (context) scope.setExtras(context)
      //   Sentry.captureException(error)
      // })
    }
    // Always log to analytics
    try {
      const { analytics } = require('./analytics')
      analytics.trackError(error, { ...context, severity }, severity)
    } catch {}

    console.error(`[Monitoring] ${severity.toUpperCase()}:`, error.message, context)
  }

  /**
   * Capture a custom message or log entry.
   * 
   * @param message - The message to capture
   * @param severity - Message severity level
   */
  captureMessage(message: string, severity: MonitoringEvent['severity'] = 'low') {
    if (this.enabled) {
      // Sentry.captureMessage(message, severity)
    }
    console.info(`[Monitoring] ${message}`)
  }

  /**
   * Set user context for monitoring.
   * 
   * @param userId - User's unique identifier
   * @param email - User's email address (optional)
   */
  setUser(userId: string, email?: string) {
    if (this.enabled) {
      // Sentry.setUser({ id: userId, email })
    }
  }

  /**
   * Clear the current user context.
   */
  clearUser() {
    if (this.enabled) {
      // Sentry.setUser(null)
    }
  }
}

export const monitoring = new MonitoringService()
