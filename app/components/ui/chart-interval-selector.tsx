
// Chart Interval Selector Component v1.0.0
// Task E-019: Chart Interval Selector

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export type ChartInterval = '1D' | '1W' | '1M' | '3M' | 'YTD' | '1Y' | 'Max'

interface ChartIntervalSelectorProps {
  selectedInterval: ChartInterval
  onIntervalChange: (interval: ChartInterval) => void
  variant?: 'buttons' | 'dropdown'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
}

const intervals: { value: ChartInterval; label: string; description: string }[] = [
  { value: '1D', label: '1D', description: '1 Day' },
  { value: '1W', label: '1W', description: '1 Week' },
  { value: '1M', label: '1M', description: '1 Month' },
  { value: '3M', label: '3M', description: '3 Months' },
  { value: 'YTD', label: 'YTD', description: 'Year to Date' },
  { value: '1Y', label: '1Y', description: '1 Year' },
  { value: 'Max', label: 'Max', description: 'Maximum' }
]

export function ChartIntervalSelector({
  selectedInterval,
  onIntervalChange,
  variant = 'buttons',
  size = 'md',
  className,
  disabled = false
}: ChartIntervalSelectorProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1 h-7',
    md: 'text-sm px-3 py-1.5 h-8',
    lg: 'text-base px-4 py-2 h-9'
  }

  if (variant === 'dropdown') {
    return (
      <div className={cn('w-full max-w-[180px]', className)}>
        <Select
          value={selectedInterval}
          onValueChange={(value) => onIntervalChange(value as ChartInterval)}
          disabled={disabled}
        >
          <SelectTrigger className={cn('w-full', sizeClasses[size])}>
            <SelectValue placeholder="Select interval" />
          </SelectTrigger>
          <SelectContent>
            {intervals.map((interval) => (
              <SelectItem 
                key={interval.value} 
                value={interval.value}
                className="flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{interval.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {interval.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div className={cn(
      'inline-flex rounded-lg border border-border bg-background p-1',
      className
    )}>
      {intervals.map((interval) => (
        <Button
          key={interval.value}
          variant={selectedInterval === interval.value ? 'default' : 'ghost'}
          size="sm"
          className={cn(
            'transition-all duration-200',
            sizeClasses[size],
            selectedInterval === interval.value
              ? 'shadow-sm'
              : 'hover:bg-muted/50'
          )}
          onClick={() => onIntervalChange(interval.value)}
          disabled={disabled}
          title={interval.description}
        >
          {interval.label}
        </Button>
      ))}
    </div>
  )
}
