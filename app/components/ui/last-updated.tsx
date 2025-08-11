
// Last Updated Component v1.0.0
// Task E-031: Last Updated Timestamp

'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { cn, safeFormatTime } from '@/lib/utils'

interface LastUpdatedProps {
  timestamp: Date
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  includeMarketStatus?: boolean
}

export function LastUpdated({
  timestamp,
  showIcon = true,
  size = 'sm',
  className,
  includeMarketStatus = true
}: LastUpdatedProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (date: Date | string | number | null | undefined) => {
    return safeFormatTime(date, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }, '--:--:--')
  }

  const getMarketStatus = () => {
    const now = new Date()
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}))
    const hour = easternTime.getHours()
    const day = easternTime.getDay()
    
    // Market is open 9:30 AM - 4:00 PM ET, Monday-Friday
    const isWeekday = day >= 1 && day <= 5
    const isMarketHours = hour >= 9 && (hour < 16 || (hour === 9 && easternTime.getMinutes() >= 30))
    
    if (isWeekday && isMarketHours) {
      return { status: 'Open', color: 'text-green-600' }
    } else if (isWeekday) {
      return { status: 'Closed', color: 'text-red-600' }
    } else {
      return { status: 'Closed', color: 'text-red-600' }
    }
  }

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const marketStatus = getMarketStatus()
  const formattedTime = formatTime(timestamp)

  return (
    <div className={cn(
      'flex items-center space-x-1 text-muted-foreground',
      sizeClasses[size],
      className
    )}>
      {showIcon && (
        <Clock className={cn(iconSizeClasses[size])} />
      )}
      <span>
        As of {formattedTime} EDT
        {includeMarketStatus && (
          <>
            {' • '}
            <span className={cn('font-medium', marketStatus.color)}>
              Market {marketStatus.status}
            </span>
          </>
        )}
      </span>
    </div>
  )
}
