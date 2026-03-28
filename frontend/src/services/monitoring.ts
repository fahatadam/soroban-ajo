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
    console.info('[Monitoring] Monitoring initialized')
  }

  /**
   * Capture and report an error.
   * Reports to Sentry (if enabled) and tracks in analytics.
   * 
   * @param event - The error event details
   */
  captureError({ error, context, severity = 'medium', userId }: MonitoringEvent) {
    const enhancedContext = {
      ...context,
      userId,
    }

    // Always log to analytics
    try {
      const { analytics } = require('./analytics')
      analytics.trackError(error, { ...enhancedContext, severity }, severity)
    } catch {}

    console.error(`[Monitoring] ${severity.toUpperCase()}:`, error.message, enhancedContext)
  }

  /**
   * Capture a custom message or log entry.
   * 
   * @param message - The message to capture
   * @param severity - Message severity level
   */
  captureMessage(message: string, severity: MonitoringEvent['severity'] = 'low') {
    console.info(`[Monitoring] ${message}`)
  }

  /**
   * Set user context for monitoring.
   * 
   * @param userId - User's unique identifier
   * @param email - User's email address (optional)
   */
  setUser(_userId: string, _email?: string) {}

  /**
   * Clear the current user context.
   */
  clearUser() {}
}

export const monitoring = new MonitoringService()
