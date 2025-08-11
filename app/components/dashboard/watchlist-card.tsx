
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Star, 
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  ShoppingCart,
  TrendingDown
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { TradeModal } from '@/components/trading/trade-modal'

interface WatchlistAsset {
  symbol: string
  name: string
  price: number
  changePercent: number
  type: string
}

interface WatchlistData {
  id: string
  name: string
  items: Array<{
    asset: {
      symbol: string
      name: string
      prices: Array<{
        price: number
        changePercent: number
      }>
      type: string
    }
  }>
}

export function WatchlistCard() {
  const [watchlistData, setWatchlistData] = useState<WatchlistData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<WatchlistAsset | null>(null)
  const [tradeModalOpen, setTradeModalOpen] = useState(false)
  const [defaultAction, setDefaultAction] = useState<'BUY' | 'SELL'>('BUY')
  const [userPositions, setUserPositions] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchWatchlist()
    fetchUserPositions()
  }, [])

  const fetchUserPositions = async () => {
    try {
      const response = await fetch('/api/portfolio')
      if (response.ok) {
        const data = await response.json()
        const portfolio = data.portfolios?.[0]
        if (portfolio) {
          const positions: Record<string, number> = {}
          portfolio.items.forEach((item: any) => {
            positions[item.asset.symbol] = item.quantity
          })
          setUserPositions(positions)
        }
      }
    } catch (error) {
      console.error('Failed to fetch user positions:', error)
    }
  }

  const handleTrade = (asset: WatchlistAsset, action: 'BUY' | 'SELL') => {
    setSelectedAsset(asset)
    setDefaultAction(action)
    setTradeModalOpen(true)
  }

  const closeTradeModal = () => {
    setTradeModalOpen(false)
    setSelectedAsset(null)
    // Refresh positions after trade
    fetchUserPositions()
  }

  const fetchWatchlist = async () => {
    try {
      const response = await fetch('/api/watchlist')
      if (response.ok) {
        const data = await response.json()
        if (data.watchlists?.length > 0) {
          setWatchlistData(data.watchlists[0]) // Default watchlist
        }
      }
    } catch (error) {
      console.error('Failed to fetch watchlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const WatchlistItem = ({ asset, index }: { asset: WatchlistAsset; index: number }) => {
    const isPositive = asset.changePercent >= 0
    const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight
    const hasPosition = userPositions[asset.symbol] > 0
    
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">{asset.symbol}</span>
            <Badge variant="outline" className="text-xs">
              {asset.type}
            </Badge>
            {hasPosition && (
              <Badge variant="secondary" className="text-xs">
                {userPositions[asset.symbol]} shares
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {asset.name}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="text-sm font-medium">
              ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className={`flex items-center text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              <ChangeIcon className="h-3 w-3 mr-1" />
              {isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%
            </div>
          </div>
          
          <div className="flex flex-col space-y-1 ml-3">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleTrade(asset, 'BUY')
              }}
              className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              Buy
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleTrade(asset, 'SELL')
              }}
              disabled={!hasPosition}
              variant="destructive"
              className="h-6 px-2 text-xs"
            >
              <TrendingDown className="h-3 w-3 mr-1" />
              Sell
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  const formatWatchlistData = (): WatchlistAsset[] => {
    if (!watchlistData?.items) return []
    
    return watchlistData.items.map(item => ({
      symbol: item.asset.symbol,
      name: item.asset.name,
      price: item.asset.prices?.[0]?.price || 0,
      changePercent: item.asset.prices?.[0]?.changePercent || 0,
      type: item.asset.type
    }))
  }

  const watchlistAssets = formatWatchlistData()

  return (
    <Card className="border-muted bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center">
          <Star className="h-5 w-5 mr-2 text-primary" />
          Watchlist
        </CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between py-3">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-16"></div>
                  <div className="h-3 bg-muted rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        ) : watchlistAssets.length > 0 ? (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            <AnimatePresence>
              {watchlistAssets.slice(0, 5).map((asset, index) => (
                <WatchlistItem key={asset.symbol} asset={asset} index={index} />
              ))}
            </AnimatePresence>
            {watchlistAssets.length > 5 && (
              <div className="text-center pt-2">
                <Link href="/watchlist">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View all {watchlistAssets.length} assets
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-3">Your watchlist is empty</p>
            <Link href="/analyze">
              <Button variant="outline" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Find Assets to Watch
              </Button>
            </Link>
          </div>
        )}
      </CardContent>

      <TradeModal
        asset={selectedAsset ? {
          symbol: selectedAsset.symbol,
          name: selectedAsset.name,
          price: selectedAsset.price,
          changePercent: selectedAsset.changePercent,
          type: selectedAsset.type
        } : null}
        isOpen={tradeModalOpen}
        onClose={closeTradeModal}
        defaultAction={defaultAction}
      />
    </Card>
  )
}
