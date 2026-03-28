import { useEffect, useCallback } from 'react'
import { analytics, trackUserAction } from '../services/analytics'

/**
 * General-purpose hook to access analytics tracking methods.
 * Provides access to event tracking, performance measuring, and error reporting.
 * 
 * @returns Object with bound analytics methods and trackUserAction
 */
export const useAnalytics = () => {
  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackMetric: analytics.trackMetric.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    measureAsync: analytics.measureAsync.bind(analytics),
    measureSync: analytics.measureSync.bind(analytics),
    trackUserAction,
  }
}

/**
 * Hook to track a page view event on mount and when the page name changes.
 * 
 * @param pageName - Human-readable name of the current screen/page
 */
export const usePageView = (pageName: string) => {
  useEffect(() => {
    trackUserAction.pageViewed(pageName)
  }, [pageName])
}

/**
 * Hook to track the mount duration (performance) of a component.
 * 
 * @param componentName - Identifier for the component being tracked
 */
export const usePerformanceTracking = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now()

    return () => {
      const duration = performance.now() - startTime
      analytics.trackMetric(`component_mount_${componentName}`, duration)
    }
  }, [componentName])
}

/**
 * Specialized hook for manual error reporting to analytics services.
 * 
 * @returns Object with a bound trackError function
 */
export const useErrorTracking = () => {
  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    analytics.trackError(error, context, 'medium')
  }, [])

  return { trackError }
}
