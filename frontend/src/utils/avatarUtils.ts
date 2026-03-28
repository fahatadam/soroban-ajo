/**
 * Avatar generation utilities for wallet addresses
 * Generates deterministic, visually distinct avatars from Stellar addresses
 */

/**
 * Generate a deterministic HSL color from a wallet address.
 * Same address always produces the same color.
 * 
 * @param address - Valid Stellar wallet address
 * @returns HSL color string
 */
export const generateAvatarColor = (address: string): string => {
  const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const hue = hash % 360
  const saturation = 65 + (hash % 20)
  const lightness = 50 + (hash % 15)
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

/**
 * Get initials from wallet address (first 2 characters).
 * 
 * @param address - Wallet address
 * @returns Uppercase initials
 */
export const getAddressInitials = (address: string): string => {
  return address.substring(0, 2).toUpperCase()
}

/**
 * Shorten a Stellar address for UI display.
 * Example: GABC...XYZ9
 * 
 * @param address - Full Stellar address
 * @param startChars - Number of prefix characters
 * @param endChars - Number of suffix characters
 * @returns Shortened address string
 */
export const shortenAddress = (address: string, startChars = 6, endChars = 4): string => {
  if (address.length <= startChars + endChars) return address
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`
}

/**
 * Format an ISO date string for user-friendly display.
 * 
 * @param dateString - ISO date string
 * @returns Formatted date (e.g., "Oct 25, 2023")
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Format an ISO date string with time information.
 * 
 * @param dateString - ISO date string
 * @returns Formatted date and time
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Calculate relative time from now (e.g., "2 days ago").
 * 
 * @param dateString - ISO date string
 * @returns Relative time string
 */
export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 30) {
    return formatDate(dateString)
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}
