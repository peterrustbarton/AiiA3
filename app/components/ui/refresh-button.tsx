
// Refresh Button Component v1.0.0
// Task E-030: Refresh Button

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { cn, safeFormatTime } from '@/lib/utils'
import { LoadingSpinner } from './loading-spinner'

interface RefreshButtonProps {
  onRefresh: () => Promise<void> | void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
  showText?: boolean
  disabled?: boolean
}

export function RefreshButton({
  onRefresh,
  size = 'md',
  variant = 'outline',
  className,
  showText = false,
  disabled = false
}: RefreshButtonProps) {
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const sizeClasses = {
    sm: showText ? 'px-2 py-1 text-xs' : 'w-8 h-8',
    md: showText ? 'px-3 py-2 text-sm' : 'w-9 h-9', 
    lg: showText ? 'px-4 py-2 text-base' : 'w-10 h-10'
  }

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const handleRefresh = async () => {
    if (loading || disabled) return

    setLoading(true)
    const startTime = Date.now()

    try {
      await onRefresh()
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Refresh error:', error)
    } finally {
      // Minimum loading time for UX
      const elapsedTime = Date.now() - startTime
      const minLoadingTime = 500
      
      if (elapsedTime < minLoadingTime) {
        setTimeout(() => setLoading(false), minLoadingTime - elapsedTime)
      } else {
        setLoading(false)
      }
    }
  }

  const formatLastRefresh = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`
    } else {
      return safeFormatTime(date, { hour: '2-digit', minute: '2-digit' }, '--:--')
    }
  }

  return (
    <div className="flex flex-col items-center space-y-1">
      <Button
        variant={variant}
        size={showText ? (size === 'md' ? 'default' : size) : 'sm'}
        className={cn(
          'transition-all duration-200',
          !showText && sizeClasses[size],
          showText && sizeClasses[size],
          loading && 'cursor-not-allowed',
          className
        )}
        onClick={handleRefresh}
        disabled={loading || disabled}
        title={`Refresh data${lastRefresh ? ` (last updated ${formatLastRefresh(lastRefresh)})` : ''}`}
      >
        {loading ? (
          showText ? (
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" variant="default" />
              <span>Refreshing...</span>
            </div>
          ) : (
            <LoadingSpinner size="sm" variant="default" />
          )
        ) : (
          <div className={cn('flex items-center', showText ? 'space-x-2' : '')}>
            <RefreshCw className={cn(iconSizeClasses[size], loading && 'animate-spin')} />
            {showText && <span>Refresh</span>}
          </div>
        )}
      </Button>
      
      {lastRefresh && !showText && (
        <span className="text-xs text-muted-foreground">
          {formatLastRefresh(lastRefresh)}
        </span>
      )}
    </div>
  )
}
