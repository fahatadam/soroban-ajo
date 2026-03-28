/**
 * formatters.ts
 * Utility functions for formatting XLM amounts, addresses, dates, and fees.
 * Used by BalanceDisplay, WalletConnector, and TransactionPreview.
 */

/**
 * Format XLM with N decimal places for balance displays.
 * e.g. formatXLM(123.456789) => "123.4568 XLM"
 * 
 * @param amount - The numeric or string XLM amount
 * @param decimals - Number of decimal places (default: 4)
 * @returns Formatted string with " XLM" suffix
 */
export function formatXLM(amount: number | string, decimals = 4): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '0.0000 XLM'
  return (
    num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + ' XLM'
  )
}

/**
 * Compact format for the header button — shows K/M suffixes.
 * e.g. formatXLMCompact(1234.5) => "1.23K XLM"
 * 
 * @param amount - The numeric or string XLM amount
 * @returns Compacted string with suffix
 */
export function formatXLMCompact(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '0.00 XLM'
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M XLM`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K XLM`
  return `${num.toFixed(2)} XLM`
}

/**
 * Convert stroops (10^-7 XLM) to XLM.
 * 
 * @param stroops - Integer amount as number or string
 * @returns Decimal XLM value
 */
export function stroopsToXLM(stroops: number | string): number {
  const n = typeof stroops === 'string' ? parseInt(stroops, 10) : stroops
  return n / 10_000_000
}

/**
 * Format a stroops fee as a readable string for transaction confirmation.
 * e.g. formatFee(12345) => "0.0012345 XLM (12,345 stroops)"
 * 
 * @param feeStroops - The fee in stroops
 * @returns Human-readable fee string
 */
export function formatFee(feeStroops: number): string {
  const xlm = stroopsToXLM(feeStroops)
  return `${xlm.toFixed(7)} XLM (${feeStroops.toLocaleString()} stroops)`
}

/**
 * Truncate a Stellar public key for UI display.
 * e.g. truncateAddress("GABCDE...WXYZ") => "GABCDE…WXYZ"
 * 
 * @param address - Full Stellar public key
 * @param start - Prefix characters to keep
 * @param end - Suffix characters to keep
 * @returns Truncated address string
 */
export function truncateAddress(address: string, start = 6, end = 4): string {
  if (!address || address.length <= start + end) return address
  return `${address.slice(0, start)}…${address.slice(-end)}`
}

/**
 * Format a Date to a relative human-readable string.
 * e.g. "2m ago", "3h ago", "5d ago"
 * 
 * @param date - The Date object to format
 * @returns Short relative time string
 */
export function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 10) return 'Just now'
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Check if the user has enough balance for a transaction including fees.
 * 
 * @param availableXLM - Current user balance
 * @param requiredXLM - Amount being spent
 * @param gasFeeXLM - Estimated transaction fee
 * @returns True if balance is sufficient
 */
export function hasSufficientBalance(
  availableXLM: number,
  requiredXLM: number,
  gasFeeXLM: number
): boolean {
  return availableXLM >= requiredXLM + gasFeeXLM
}

/**
 * Calculate the percentage of a total that is locked.
 * Clamped between 0 and 100.
 * 
 * @param total - Total amount
 * @param locked - Locked amount
 * @returns Percentage (0-100)
 */
export function lockedPercentage(total: number, locked: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.round((locked / total) * 100))
}
