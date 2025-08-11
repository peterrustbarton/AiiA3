
/**
 * Number formatting utilities for AiiA 3.0
 * Provides consistent number formatting across the application
 */

/**
 * Formats currency values with proper comma separation and 2 decimal places
 * @param value - The numeric value to format
 * @param currency - Currency symbol (default: '$')
 * @param minimumFractionDigits - Minimum decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | null | undefined,
  currency: string = '$',
  minimumFractionDigits: number = 2
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return `${currency}0.00`
  }

  return `${currency}${value.toLocaleString('en-US', {
    minimumFractionDigits,
    maximumFractionDigits: 2
  })}`
}

/**
 * Formats regular numbers with comma separation
 * @param value - The numeric value to format  
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 */
export function formatNumber(
  value: number | null | undefined,
  decimals: number = 2
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0'
  }

  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Formats percentage values with proper sign and 2 decimal places
 * @param value - The percentage value to format
 * @param showSign - Whether to show + for positive values (default: true)
 * @returns Formatted percentage string
 */
export function formatPercent(
  value: number | null | undefined,
  showSign: boolean = true
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%'
  }

  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  if (showSign && value > 0) {
    return `+${formatted}%`
  }

  return `${formatted}%`
}

/**
 * Formats large numbers with appropriate suffixes (K, M, B, T)
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places for shortened values (default: 1)
 * @returns Formatted number string with suffix
 */
export function formatLargeNumber(
  value: number | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0'
  }

  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (absValue >= 1e12) {
    return `${sign}${(absValue / 1e12).toFixed(decimals)}T`
  } else if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(decimals)}B`
  } else if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(decimals)}M`
  } else if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(decimals)}K`
  } else {
    return `${sign}${absValue.toFixed(decimals)}`
  }
}

/**
 * Formats volume numbers with appropriate suffixes
 * @param value - The volume value to format
 * @returns Formatted volume string
 */
export function formatVolume(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '0'
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) {
    return '0'
  }

  return formatLargeNumber(numValue, 1)
}

/**
 * Formats market cap values
 * @param value - The market cap value to format
 * @returns Formatted market cap string with currency symbol
 */
export function formatMarketCap(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0.00'
  }

  return `$${formatLargeNumber(value, 2)}`
}

/**
 * Parses a formatted number string back to a numeric value
 * @param value - The formatted string to parse
 * @returns Parsed numeric value
 */
export function parseFormattedNumber(value: string): number {
  if (!value) return 0
  
  // Remove currency symbols, commas, and spaces
  const cleaned = value.replace(/[$,%\s]/g, '')
  const parsed = parseFloat(cleaned)
  
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Formats price change with appropriate color coding classes
 * @param change - The change value
 * @param changePercent - The percentage change
 * @param includePercent - Whether to include percentage (default: true)
 * @returns Object with formatted text and CSS class
 */
export function formatPriceChange(
  change: number | null | undefined,
  changePercent: number | null | undefined,
  includePercent: boolean = true
): { text: string; className: string } {
  if (change === null || change === undefined || changePercent === null || changePercent === undefined) {
    return {
      text: includePercent ? '$0.00 (0.00%)' : '$0.00',
      className: 'text-muted-foreground'
    }
  }

  const changeText = formatCurrency(Math.abs(change))
  const percentText = formatPercent(Math.abs(changePercent))
  const sign = change >= 0 ? '+' : '-'
  
  const text = includePercent 
    ? `${sign}${changeText} (${sign}${percentText})`
    : `${sign}${changeText}`

  const className = change >= 0 ? 'text-green-500' : 'text-red-500'

  return { text, className }
}
