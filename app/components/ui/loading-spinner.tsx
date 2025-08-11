
// Loading Spinner Component v1.0.0
// Task E-016: Loading Animation & Progress Estimate

'use client'

import { motion } from 'framer-motion'
import { Loader2, TrendingUp, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'dots' | 'pulse' | 'chart'
  text?: string
  progress?: number
  estimatedTime?: number
  className?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default', 
  text, 
  progress, 
  estimatedTime,
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex flex-col items-center space-y-2', className)}>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn('bg-primary rounded-full', sizeClasses[size])}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
        {text && (
          <p className={cn('text-muted-foreground', textSizeClasses[size])}>
            {text}
          </p>
        )}
        {estimatedTime && (
          <p className="text-xs text-muted-foreground">
            ~{estimatedTime}s remaining
          </p>
        )}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex flex-col items-center space-y-3', className)}>
        <motion.div
          className={cn(
            'bg-primary/20 border-2 border-primary rounded-full flex items-center justify-center',
            sizeClasses[size === 'sm' ? 'lg' : size === 'md' ? 'xl' : 'xl']
          )}
          animate={{
            scale: [1, 1.1, 1],
            borderColor: ['hsl(var(--primary))', 'hsl(var(--primary)/0.5)', 'hsl(var(--primary))']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <TrendingUp className={cn('text-primary', sizeClasses[size])} />
        </motion.div>
        {text && (
          <p className={cn('text-muted-foreground text-center max-w-xs', textSizeClasses[size])}>
            {text}
          </p>
        )}
        {progress !== undefined && (
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{Math.round(progress)}%</span>
              {estimatedTime && <span>~{estimatedTime}s</span>}
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <motion.div
                className="bg-primary h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'chart') {
    return (
      <div className={cn('flex flex-col items-center space-y-3', className)}>
        <motion.div
          className="flex items-center space-x-2"
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <BarChart3 className={cn('text-primary', sizeClasses[size])} />
          <div className="flex space-x-1">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-1 bg-primary rounded-full"
                animate={{
                  height: [8, 16, 12, 20, 8]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}
          </div>
        </motion.div>
        {text && (
          <p className={cn('text-muted-foreground text-center', textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    )
  }

  // Default spinner
  return (
    <div className={cn('flex flex-col items-center space-y-2', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && (
        <p className={cn('text-muted-foreground', textSizeClasses[size])}>
          {text}
        </p>
      )}
      {progress !== undefined && (
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{Math.round(progress)}%</span>
            {estimatedTime && <span>~{estimatedTime}s</span>}
          </div>
          <div className="w-full bg-secondary rounded-full h-1">
            <motion.div
              className="bg-primary h-1 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
