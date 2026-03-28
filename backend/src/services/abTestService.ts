import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()
const prismaAny = prisma as any

export interface ABTestConfig {
  name: string
  description?: string
  variants: {
    [key: string]: {
      traffic: number // percentage (0-100)
      config: any // variant-specific configuration
    }
  }
  metrics: {
    primary: string // main success metric
    secondary: string[] // secondary metrics to track
  }
  duration?: number // test duration in days
  sampleSize?: number // minimum sample size required
  significanceLevel?: number // statistical significance (default: 0.05)
}

export interface ABTestResult {
  variant: string
  conversions: number
  visitors: number
  conversionRate: number
  confidenceInterval: {
    lower: number
    upper: number
  }
  pValue?: number
  isWinner?: boolean
}

export class ABTestService {
  /**
   * Creates a new A/B test with specified variants, traffic allocation, and success metrics.
   * 
   * @param config - The laboratory configuration for the A/B test
   * @returns Promise resolving to the newly created ABTest record
   * @throws {Error} If variant traffic allocation does not sum to exactly 100%
   */
  async createTest(config: ABTestConfig) {
    // Validate traffic allocation
    const totalTraffic = Object.values(config.variants).reduce((sum, v) => sum + v.traffic, 0)
    if (Math.abs(totalTraffic - 100) > 0.01) {
      throw new Error('Variant traffic must sum to 100%')
    }

    const test = await prismaAny.aBTest.create({
      data: {
        name: config.name,
        description: config.description,
        variants: config.variants,
        metrics: config.metrics,
        endDate: config.duration
          ? new Date(Date.now() + config.duration * 24 * 60 * 60 * 1000)
          : null,
      },
    })

    logger.info('A/B test created', { testId: test.id, name: config.name })
    return test
  }

  /**
   * Assigns a user to a specific variant of an active A/B test.
   * Uses consistent hashing to ensure a user always receives the same variant.
   * 
   * @param userId - Unique identifier of the user to assign
   * @param testName - Programmatic name of the A/B test
   * @returns Promise resolving to the assigned variant name
   * @throws {Error} If no active test is found with the given name
   */
  async assignUser(userId: string, testName: string): Promise<string> {
    const test = await prismaAny.aBTest.findFirst({
      where: { name: testName, status: 'active' },
    })

    if (!test) {
      throw new Error(`Active A/B test not found: ${testName}`)
    }

    // Check if user is already assigned
    const existingAssignment = await this.getUserAssignment(userId, testName)
    if (existingAssignment) {
      return existingAssignment
    }

    // Assign user to variant based on traffic allocation
    const variant = this.assignVariant(test.variants as any, userId)

    // Track assignment
    await this.trackEvent(userId, testName, 'assigned', { variant })

    return variant
  }

  /**
   * Records a conversion event for an A/B test variant.
   * Automatically triggers a recalculation of test results.
   * 
   * @param userId - Unique identifier of the user who converted
   * @param testName - Name of the A/B test
   * @param metric - The metric that was converted (e.g., 'click', 'purchase')
   * @param value - Numerical value associated with the conversion (defaults to 1)
   * @returns Promise resolving when the event is tracked and results updated
   * @throws {Error} If the user was not previously assigned to the specified test
   */
  async trackConversion(userId: string, testName: string, metric: string, value?: number) {
    const assignment = await this.getUserAssignment(userId, testName)
    if (!assignment) {
      throw new Error('User not assigned to this test')
    }

    await this.trackEvent(userId, testName, 'conversion', {
      variant: assignment,
      metric,
      value: value || 1,
    })

    // Update test results
    await this.updateTestResults(testName)
  }

  /**
   * Retrieves statistical results for all variants in an A/B test.
   * Includes conversion rates, confidence intervals, and p-values if enough data exists.
   * 
   * @param testName - Name of the A/B test
   * @returns Promise resolving to an array of ABTestResult objects for each variant
   * @throws {Error} If the test is not found
   */
  async getTestResults(testName: string): Promise<ABTestResult[]> {
    const test = await prismaAny.aBTest.findFirst({
      where: { name: testName },
    })

    if (!test) {
      throw new Error(`Test not found: ${testName}`)
    }

    const variants = Object.keys(test.variants as any)
    const results: ABTestResult[] = []

    for (const variant of variants) {
      const result = await this.calculateVariantResults(testName, variant)
      results.push(result)
    }

    // Determine winner if test has sufficient data
    if (this.hasSufficientData(results)) {
      const winner = this.determineWinner(results)
      results.forEach((r) => {
        r.isWinner = r.variant === winner
      })
    }

    return results
  }

  /**
   * Permanently stops an active A/B test and records the final statistical results and winner.
   * 
   * @param testName - Name of the A/B test to stop
   * @returns Promise resolving when the test is status is updated to 'completed'
   * @throws {Error} If the test is not found
   */
  async stopTest(testName: string) {
    const test = await prismaAny.aBTest.findFirst({
      where: { name: testName },
    })

    if (!test) {
      throw new Error(`Test not found: ${testName}`)
    }

    // Calculate final results
    const results = await this.getTestResults(testName)
    const winner = results.find((r) => r.isWinner)

    await prismaAny.aBTest.update({
      where: { id: test.id },
      data: {
        status: 'completed',
        endDate: new Date(),
        results: {
          finalResults: results,
          winner: winner?.variant,
          confidence: winner?.confidenceInterval,
        } as any,
      },
    })

    logger.info('A/B test stopped', { testName, winner: winner?.variant })
  }

  /**
   * Determines which variant a user should be assigned to based on weighted traffic allocation.
   * 
   * @param variants - Variant configuration containing traffic weights
   * @param userId - User identifier used for consistent hashing
   * @returns The name of the assigned variant
   * @internal
   */
  private assignVariant(variants: any, userId: string): string {
    // Use consistent hashing for user assignment
    const hash = this.hashString(userId)
    const traffic = hash % 100

    let cumulative = 0
    for (const [variant, config] of Object.entries(variants)) {
      cumulative += (config as any).traffic
      if (traffic < cumulative) {
        return variant
      }
    }

    // Fallback to first variant
    return Object.keys(variants)[0]
  }

  /**
   * Standard 32-bit hash implementation used for consistent user assignment.
   * 
   * @param str - Input string to hash
   * @returns A positive 32-bit integer
   * @internal
   */
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Retrieves a user's previous assignment for a test from the analytics database.
   * 
   * @param userId - User ID
   * @param testName - Test name
   * @returns Promise resolving to the variant name or null if no previous assignment exists
   * @internal
   */
  private async getUserAssignment(userId: string, testName: string): Promise<string | null> {
    // Check user's previous assignment from analytics events
    const assignment = await prismaAny.analyticsEvent.findFirst({
      where: {
        userId,
        eventType: 'ab_test_assigned',
        eventData: {
          path: ['testName'],
          equals: testName,
        },
      },
      orderBy: { timestamp: 'desc' },
    })

    return (assignment?.eventData as any)?.variant || null
  }

  /**
   * Low-level helper to log A/B test related events to the analytics system.
   * 
   * @param userId - User ID
   * @param testName - Test name
   * @param eventType - Sub-type of A/B test event (e.g., 'assigned', 'conversion')
   * @param data - Arbitrary event data including variant and metrics
   * @internal
   */
  private async trackEvent(userId: string, testName: string, eventType: string, data: any) {
    await prismaAny.analyticsEvent.create({
      data: {
        eventType: `ab_test_${eventType}`,
        userId,
        eventData: {
          testName,
          ...data,
        } as any,
        timestamp: new Date(),
      },
    })
  }

  /**
   * Calculates conversion metrics and statistical confidence for a specific variant.
   * 
   * @param testName - Test name
   * @param variant - Variant name
   * @returns Promise resolving to computed results for the variant
   * @internal
   */
  private async calculateVariantResults(testName: string, variant: string): Promise<ABTestResult> {
    // Get visitors for this variant
    const visitors = await prismaAny.analyticsEvent.count({
      where: {
        eventType: 'ab_test_assigned',
        AND: [
          { eventData: { path: ['testName'], equals: testName } },
          { eventData: { path: ['variant'], equals: variant } },
        ],
      },
    })

    // Get conversions for this variant
    const conversions = await prismaAny.analyticsEvent.count({
      where: {
        eventType: 'ab_test_conversion',
        AND: [
          { eventData: { path: ['testName'], equals: testName } },
          { eventData: { path: ['variant'], equals: variant } },
        ],
      },
    })

    const conversionRate = visitors > 0 ? conversions / visitors : 0
    const confidenceInterval = this.calculateConfidenceInterval(
      conversions,
      visitors,
      conversionRate
    )

    return {
      variant,
      conversions,
      visitors,
      conversionRate,
      confidenceInterval,
    }
  }

  /**
   * Computes the 95% confidence interval for a conversion rate using the Wilson score method.
   * 
   * @param conversions - Number of successful conversions
   * @param visitors - Total number of visitors in the variant
   * @param rate - Observed conversion rate
   * @returns Object with lower and upper bounds of the confidence interval
   * @internal
   */
  private calculateConfidenceInterval(
    conversions: number,
    visitors: number,
    rate: number
  ): { lower: number; upper: number } {
    if (visitors === 0) {
      return { lower: 0, upper: 0 }
    }

    // Wilson score interval for small sample sizes
    const z = 1.96 // 95% confidence
    const n = visitors
    const p = rate

    const denominator = 1 + (z * z) / n
    const center = p + (z * z) / (2 * n)
    const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)

    return {
      lower: Math.max(0, (center - margin) / denominator),
      upper: Math.min(1, (center + margin) / denominator),
    }
  }

  /**
   * Checks if all variants have met the minimum sample size required for statistical analysis.
   * 
   * @param results - Array of variant results
   * @returns true if sample sizes are sufficient
   * @internal
   */
  private hasSufficientData(results: ABTestResult[]): boolean {
    const minSampleSize = 100 // Minimum visitors per variant
    return results.every((r) => r.visitors >= minSampleSize)
  }

  /**
   * Identifies the winning variant by comparing conversion rates and calculating statistical significance.
   * 
   * @param results - Calculated results for all variants
   * @returns The name of the winning variant or null if no clear winner is found
   * @internal
   */
  private determineWinner(results: ABTestResult[]): string | null {
    if (results.length < 2) {
      return null
    }

    // Sort by conversion rate
    const sorted = results.sort((a, b) => b.conversionRate - a.conversionRate)
    const winner = sorted[0]
    const runnerUp = sorted[1]

    // Calculate statistical significance
    const pValue = this.calculatePValue(winner, runnerUp)
    winner.pValue = pValue

    // Winner if statistically significant (p < 0.05)
    return pValue < 0.05 ? winner.variant : null
  }

  /**
   * Performs a two-proportion z-test to calculate the p-value between two variants.
   * 
   * @param variant1 - First variant results
   * @param variant2 - Second variant results
   * @returns The calculated p-value
   * @internal
   */
  private calculatePValue(variant1: ABTestResult, variant2: ABTestResult): number {
    // Two-proportion z-test
    const p1 = variant1.conversionRate
    const p2 = variant2.conversionRate
    const n1 = variant1.visitors
    const n2 = variant2.visitors

    const pooledP = (variant1.conversions + variant2.conversions) / (n1 + n2)
    const standardError = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2))

    if (standardError === 0) {
      return 1
    }

    const zScore = Math.abs(p1 - p2) / standardError
    return this.zScoreToPValue(zScore)
  }

  /**
   * Converts a z-score to a p-value for a two-tailed normal distribution.
   * 
   * @param zScore - The absolute z-score
   * @returns The corresponding p-value
   * @internal
   */
  private zScoreToPValue(zScore: number): number {
    // Approximation for two-tailed test
    return 2 * (1 - this.normalCDF(Math.abs(zScore)))
  }

  /**
   * Numerical approximation of the cumulative distribution function for a normal distribution.
   * 
   * @param x - The value to evaluate
   * @returns The probability that a random variable is less than x
   * @internal
   */
  private normalCDF(x: number): number {
    // Approximation of normal cumulative distribution function
    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911

    const sign = x < 0 ? -1 : 1
    x = Math.abs(x) / Math.sqrt(2.0)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return 0.5 * (1.0 + sign * y)
  }

  /**
   * Background helper to update the interim results stored on the test record.
   * 
   * @param testName - Test name
   * @returns Promise resolving when the results are updated
   * @internal
   */
  private async updateTestResults(testName: string): Promise<void> {
    const test = await prismaAny.aBTest.findFirst({ where: { name: testName } })
    if (!test) {
      return
    }

    const results = await this.getTestResults(testName)
    await prismaAny.aBTest.update({
      where: { id: test.id },
      data: { results: { interimResults: results, updatedAt: new Date().toISOString() } as any },
    })
  }

  /**
   * Retrieves all A/B tests currently in an 'active' state.
   * 
   * @returns Promise resolving to a list of active ABTest records
   */
  async getActiveTests() {
    return prisma.aBTest.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Retrieves the most recent completed A/B tests.
   * 
   * @returns Promise resolving to a list of up to 50 completed ABTest records
   */
  async getTestHistory() {
    return prisma.aBTest.findMany({
      where: { status: 'completed' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }
}

export const abTestService = new ABTestService()
