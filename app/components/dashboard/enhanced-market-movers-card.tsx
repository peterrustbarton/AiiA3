
// Enhanced Market Movers Card v2.0.0
// Tasks: E-029 (Watchlist), E-030 (Refresh), E-031 (Timestamps), E-009 (Symbol Links), E-016 (Loading)

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  ExternalLink
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { TradeModal } from '@/components/trading/trade-modal'
import { WatchlistToggle } from '@/components/ui/watchlist-toggle'
import { RefreshButton } from '@/components/ui/refresh-button'
import { LastUpdated } from '@/components/ui/last-updated'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { formatCurrency, formatNumber } from '@/lib/utils/number-formatting'

interface AssetData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  type: string
  lastUpdated?: Date
}

interface MarketMoversData {
  gainers: AssetData[]
  losers: AssetData[]
  lastUpdated: Date
}

export function EnhancedMarketMoversCard() {
  const [marketData, setMarketData] = useState<MarketMoversData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<AssetData | null>(null)
  const [tradeModalOpen, setTradeModalOpen] = useState(false)
  const [defaultAction, setDefaultAction] = useState<'BUY' | 'SELL'>('BUY')
  const [userPositions, setUserPositions] = useState<Record<string, number>>({})
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    fetchMarketMovers()
    fetchUserPositions()
  }, [])

  const fetchMarketMovers = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    
    setProgress(0)
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/market-movers')
      
      if (response.ok) {
        const data = await response.json()
        setMarketData({
          gainers: data.gainers || [],
          losers: data.losers || [],
          lastUpdated: new Date()
        })
        setProgress(100)
      } else {
        console.error('Failed to fetch market movers')
      }
      
      clearInterval(progressInterval)
    } catch (error) {
      console.error('Error fetching market movers:', error)
    } finally {
      setTimeout(() => {
        setLoading(false)
        setRefreshing(false)
        setProgress(0)
      }, 500)
    }
  }

  const fetchUserPositions = async () => {
    try {
      const response = await fetch('/api/portfolio')
      if (response.ok) {
        const data = await response.json()
        const positions: Record<string, number> = {}
        data.positions?.forEach((position: any) => {
          positions[position.symbol] = position.quantity
        })
        setUserPositions(positions)
      }
    } catch (error) {
      console.error('Error fetching user positions:', error)
    }
  }

  const handleTradeClick = (asset: AssetData, action: 'BUY' | 'SELL') => {
    setSelectedAsset(asset)
    setDefaultAction(action)
    setTradeModalOpen(true)
  }

  const handleRefresh = async () => {
    await fetchMarketMovers(true)
    await fetchUserPositions()
  }

  const renderAssetRow = (asset: AssetData, index: number) => {
    const hasPosition = userPositions[asset.symbol] > 0
    const isPositive = asset.changePercent > 0

    return (
      <motion.div
        key={asset.symbol}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-all duration-200"
      >
        {/* Symbol and Company */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <WatchlistToggle symbol={asset.symbol} size="sm" />
          
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <Link
                href={`/analyze?symbol=${asset.symbol}`}
                className="font-semibold text-foreground hover:text-primary transition-colors duration-200 flex items-center space-x-1 group"
              >
                <span>{asset.symbol}</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Link>
              {hasPosition && (
                <Badge variant="secondary" className="text-xs px-2 py-0">
                  Owned
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {asset.name}
            </p>
          </div>
        </div>

        {/* Price Info */}
        <div className="text-right mr-4">
          <p className="font-semibold">{formatCurrency(asset.price)}</p>
          <div className={`flex items-center space-x-1 text-sm ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            <span>
              {formatCurrency(Math.abs(asset.change))} 
              ({asset.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Trade Buttons */}
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-green-600 border-green-600/20 hover:bg-green-600/10"
            onClick={() => handleTradeClick(asset, 'BUY')}
          >
            Buy
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-red-600 border-red-600/20 hover:bg-red-600/10"
            onClick={() => handleTradeClick(asset, 'SELL')}
          >
            Sell
          </Button>
        </div>
      </motion.div>
    )
  }

  if (loading && !marketData) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Market Movers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner
            variant="chart"
            text="Loading market data..."
            progress={progress}
            estimatedTime={3}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Market Movers</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <RefreshButton
                onRefresh={handleRefresh}
                size="md"
                disabled={refreshing}
              />
            </div>
          </div>
          
          {marketData?.lastUpdated && (
            <LastUpdated
              timestamp={marketData.lastUpdated}
              size="sm"
              className="mt-2"
            />
          )}
        </CardHeader>

        <CardContent>
          {refreshing ? (
            <div className="py-8">
              <LoadingSpinner
                variant="pulse"
                text="Refreshing market data..."
                size="lg"
              />
            </div>
          ) : (
            <Tabs defaultValue="gainers" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger 
                  value="gainers" 
                  className="flex items-center space-x-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Top Gainers</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="losers"
                  className="flex items-center space-x-2"
                >
                  <TrendingDown className="w-4 h-4" />
                  <span>Top Losers</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="gainers" className="mt-4">
                <div className="space-y-1">
                  {marketData?.gainers?.length ? (
                    marketData.gainers.slice(0, 8).map((asset, index) =>
                      renderAssetRow(asset, index)
                    )
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No gainers data available
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="losers" className="mt-4">
                <div className="space-y-1">
                  {marketData?.losers?.length ? (
                    marketData.losers.slice(0, 8).map((asset, index) =>
                      renderAssetRow(asset, index)
                    )
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No losers data available
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Trade Modal */}
      {selectedAsset && (
        <TradeModal
          isOpen={tradeModalOpen}
          onClose={() => {
            fetchUserPositions()
            setTradeModalOpen(false)
          }}
          asset={selectedAsset}
          defaultAction={defaultAction}
        />
      )}
    </>
  )
}
