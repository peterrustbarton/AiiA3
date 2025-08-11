import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Safely formats a timestamp to a locale time string with proper validation
 * @param timestamp - Can be Date object, ISO string, Unix timestamp (number), or undefined/null
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @param fallback - Fallback text when timestamp is invalid
 * @returns Formatted time string or fallback
 */
export function safeFormatTime(
  timestamp: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' },
  fallback: string = '--:--'
): string {
  try {
    // Handle null/undefined
    if (!timestamp) {
      console.warn('safeFormatTime: Received null/undefined timestamp')
      return fallback
    }

    let date: Date

    // If already a Date object, validate it
    if (timestamp instanceof Date) {
      if (isNaN(timestamp.getTime())) {
        console.warn('safeFormatTime: Invalid Date object received')
        return fallback
      }
      date = timestamp
    }
    // If it's a string, try to parse it
    else if (typeof timestamp === 'string') {
      // Handle empty strings
      if (timestamp.trim() === '') {
        console.warn('safeFormatTime: Empty string timestamp received')
        return fallback
      }
      date = new Date(timestamp)
      if (isNaN(date.getTime())) {
        console.warn('safeFormatTime: Invalid string timestamp received:', timestamp)
        return fallback
      }
    }
    // If it's a number, treat as Unix timestamp (milliseconds or seconds)
    else if (typeof timestamp === 'number') {
      // Check if it might be in seconds (Unix timestamp < 10^10) and convert to milliseconds
      const normalizedTimestamp = timestamp < 10000000000 ? timestamp * 1000 : timestamp
      date = new Date(normalizedTimestamp)
      if (isNaN(date.getTime())) {
        console.warn('safeFormatTime: Invalid numeric timestamp received:', timestamp)
        return fallback
      }
    }
    else {
      console.warn('safeFormatTime: Unsupported timestamp type:', typeof timestamp, timestamp)
      return fallback
    }

    // Ensure the date is within reasonable bounds (not too far in past/future)
    const currentYear = new Date().getFullYear()
    const timestampYear = date.getFullYear()
    if (timestampYear < 1970 || timestampYear > currentYear + 10) {
      console.warn('safeFormatTime: Timestamp outside reasonable range:', date.toISOString())
      return fallback
    }

    return date.toLocaleTimeString('en-US', options)
  } catch (error) {
    console.error('safeFormatTime: Unexpected error formatting timestamp:', error, { timestamp })
    return fallback
  }
}

/**
 * Safely converts a timestamp to a Date object with validation
 * @param timestamp - Can be Date object, ISO string, Unix timestamp (number), or undefined/null
 * @returns Valid Date object or null if invalid
 */
export function safeToDate(
  timestamp: Date | string | number | null | undefined
): Date | null {
  try {
    if (!timestamp) return null

    if (timestamp instanceof Date) {
      return isNaN(timestamp.getTime()) ? null : timestamp
    }

    if (typeof timestamp === 'string') {
      if (timestamp.trim() === '') return null
      const date = new Date(timestamp)
      return isNaN(date.getTime()) ? null : date
    }

    if (typeof timestamp === 'number') {
      const normalizedTimestamp = timestamp < 10000000000 ? timestamp * 1000 : timestamp
      const date = new Date(normalizedTimestamp)
      return isNaN(date.getTime()) ? null : date
    }

    return null
  } catch (error) {
    console.error('safeToDate: Error converting timestamp:', error, { timestamp })
    return null
  }
}