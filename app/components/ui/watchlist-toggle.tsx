
// Watchlist Toggle Component v1.0.0  
// Task E-029: Watchlist Toggle

'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { toast } from '@/hooks/use-toast'

interface WatchlistToggleProps {
  symbol: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showTooltip?: boolean
}

export function WatchlistToggle({ 
  symbol, 
  size = 'md', 
  className,
  showTooltip = true 
}: WatchlistToggleProps) {
  const { data: session } = useSession()
  const [isWatched, setIsWatched] = useState(false)
  const [loading, setLoading] = useState(false)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const buttonSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-10 w-10'
  }

  useEffect(() => {
    if (session?.user?.id && symbol) {
      checkWatchlistStatus()
    }
  }, [session?.user?.id, symbol])

  const checkWatchlistStatus = async () => {
    try {
      const response = await fetch('/api/watchlist')
      if (response.ok) {
        const data = await response.json()
        const watchlists = data.watchlists || []
        
        // Check if symbol exists in any watchlist
        const isSymbolWatched = watchlists.some((watchlist: any) =>
          watchlist.items?.some((item: any) => item.symbol === symbol)
        )
        setIsWatched(isSymbolWatched)
      }
    } catch (error) {
      console.error('Error checking watchlist status:', error)
    }
  }

  const toggleWatchlist = async () => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to manage your watchlist.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    
    try {
      if (isWatched) {
        // Remove from watchlist
        const response = await fetch('/api/watchlist', {
          method: 'GET'
        })
        
        if (response.ok) {
          const data = await response.json()
          const watchlists = data.watchlists || []
          
          for (const watchlist of watchlists) {
            const itemToRemove = watchlist.items?.find((item: any) => item.symbol === symbol)
            if (itemToRemove) {
              const deleteResponse = await fetch(`/api/watchlist/${watchlist.id}/items`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: itemToRemove.id })
              })
              
              if (deleteResponse.ok) {
                setIsWatched(false)
                if (showTooltip) {
                  toast({
                    title: "Removed from Watchlist",
                    description: `${symbol} has been removed from your watchlist.`
                  })
                }
                break
              }
            }
          }
        }
      } else {
        // Add to watchlist - get or create default watchlist
        let watchlistId: string | null = null
        
        const response = await fetch('/api/watchlist')
        if (response.ok) {
          const data = await response.json()
          const watchlists = data.watchlists || []
          
          // Use first watchlist or create one
          if (watchlists.length > 0) {
            watchlistId = watchlists[0].id
          } else {
            // Create default watchlist
            const createResponse = await fetch('/api/watchlist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: 'My Watchlist' })
            })
            
            if (createResponse.ok) {
              const newWatchlist = await createResponse.json()
              watchlistId = newWatchlist.watchlist.id
            }
          }
        }
        
        if (watchlistId) {
          const addResponse = await fetch(`/api/watchlist/${watchlistId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol })
          })
          
          if (addResponse.ok) {
            setIsWatched(true)
            if (showTooltip) {
              toast({
                title: "Added to Watchlist",
                description: `${symbol} has been added to your watchlist.`
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error)
      toast({
        title: "Error",
        description: "Failed to update watchlist. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        'rounded-full p-0 hover:bg-secondary/80 transition-all duration-200',
        buttonSizeClasses[size],
        className
      )}
      onClick={toggleWatchlist}
      disabled={loading}
      title={isWatched ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
    >
      <Star 
        className={cn(
          'transition-all duration-200',
          sizeClasses[size],
          isWatched 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-muted-foreground hover:text-yellow-400',
          loading && 'animate-pulse'
        )}
      />
    </Button>
  )
}
