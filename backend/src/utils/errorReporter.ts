import * as Sentry from '@sentry/node';

export class ErrorReporter {
  /**
   * Reports an unhandled exception to Sentry for monitoring.
   * 
   * @param error - The encountered error object
   * @param context - Optional key-value pairs to provide additional debugging state
   */
  static captureException(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, {
      extra: context,
    });
  }

  /**
   * Captures a plain text message and sends it to Sentry.
   * Useful for tracking significant milestones or non-critical warnings.
   * 
   * @param message - The descriptive message string
   * @param level - Severity level (info, warning, or error)
   */
  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    Sentry.captureMessage(message, (level as any));
  }

  /**
   * Associates the current execution context with a specific user profile.
   * Recommended during user sessions to facilitate debugging.
   * 
   * @param user - User identification and contact information
   */
  static setUser(user: { id: string; email?: string }) {
    Sentry.setUser(user);
  }

  /**
   * Records a manual breadcrumb to refine the timeline leading up to an error.
   * 
   * @param breadcrumb - Object containing message, category, level, and optional metadata
   */
  static addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: 'info' | 'warning' | 'error';
    data?: Record<string, any>;
  }) {
    Sentry.addBreadcrumb(breadcrumb);
  }

  static withScope(callback: (scope: Sentry.Scope) => void) {
    Sentry.withScope(callback);
  }
}
