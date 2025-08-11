
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart3,
  ShoppingCart
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { TradeModal } from '@/components/trading/trade-modal'

interface AssetData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume?: number
  marketCap?: number
  type: string
  exchange?: string
}

interface MarketMoversData {
  gainers: AssetData[]
  losers: AssetData[]
}

export function MarketMoversPage() {
  const [marketData, setMarketData] = useState<MarketMoversData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<AssetData | null>(null)
  const [tradeModalOpen, setTradeModalOpen] = useState(false)
  const [defaultAction, setDefaultAction] = useState<'BUY' | 'SELL'>('BUY')
  const [userPositions, setUserPositions] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchMarketMovers()
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

  const handleTrade = (asset: AssetData, action: 'BUY' | 'SELL') => {
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

  const fetchMarketMovers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/market-movers')
      if (response.ok) {
        const data = await response.json()
        setMarketData(data)
      }
    } catch (error) {
      console.error('Failed to fetch market movers:', error)
    } finally {
      setLoading(false)
    }
  }

  const AssetCard = ({ asset, index }: { asset: AssetData; index: number }) => {
    const isPositive = asset.changePercent > 0
    const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight
    const hasPosition = userPositions[asset.symbol] > 0
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Card className="border-muted bg-card/50 backdrop-blur hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Link href={`/analyze?symbol=${asset.symbol}`} className="hover:underline">
                    <span className="font-bold text-lg cursor-pointer">{asset.symbol}</span>
                  </Link>
                  <Badge variant="outline" className="text-xs">
                    {asset.type}
                  </Badge>
                  {hasPosition && (
                    <Badge variant="secondary" className="text-xs">
                      {userPositions[asset.symbol]} shares
                    </Badge>
                  )}
                </div>
                {asset.exchange && (
                  <Badge variant="secondary" className="text-xs">
                    {asset.exchange}
                  </Badge>
                )}
              </div>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <Link href={`/analyze?symbol=${asset.symbol}`}>
              <h3 className="font-medium text-sm text-muted-foreground mb-3 truncate hover:underline cursor-pointer">
                {asset.name}
              </h3>
            </Link>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className={`flex items-center space-x-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                <ChangeIcon className="h-4 w-4" />
                <span className="font-medium">
                  {isPositive ? '+' : ''}${asset.change.toFixed(2)}
                </span>
                <span className="font-medium">
                  ({isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%)
                </span>
              </div>
              
              {asset.volume && (
                <div className="text-sm text-muted-foreground">
                  Volume: {asset.volume.toLocaleString()}
                </div>
              )}
              
              {asset.marketCap && (
                <div className="text-sm text-muted-foreground">
                  Market Cap: ${(asset.marketCap / 1e9).toFixed(1)}B
                </div>
              )}
              
              {/* Trade Buttons */}
              <div className="flex space-x-2 pt-3 border-t">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTrade(asset, 'BUY')
                  }}
                  className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
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
                  className="flex-1 h-8 text-xs"
                >
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Sell
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center">
            <TrendingUp className="h-8 w-8 mr-3 text-primary" />
            Market Movers
          </h1>
          <p className="text-muted-foreground">
            Top gaining and losing assets in the market
          </p>
        </div>
        <Button 
          onClick={fetchMarketMovers} 
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Market Movers Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-muted bg-card/50 backdrop-blur">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="h-6 bg-muted rounded w-1/3"></div>
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                      </div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                      <div className="h-8 bg-muted rounded w-1/2"></div>
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : marketData ? (
          <Tabs defaultValue="gainers" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="gainers" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>Top Gainers</span>
              </TabsTrigger>
              <TabsTrigger value="losers" className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span>Top Losers</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gainers" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketData.gainers.map((asset, index) => (
                  <AssetCard key={asset.symbol} asset={asset} index={index} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="losers" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketData.losers.map((asset, index) => (
                  <AssetCard key={asset.symbol} asset={asset} index={index} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Unable to Load Market Data</h3>
            <p className="text-muted-foreground mb-6">
              Please check your connection and try again.
            </p>
            <Button onClick={fetchMarketMovers} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </motion.div>

      <TradeModal
        asset={selectedAsset}
        isOpen={tradeModalOpen}
        onClose={closeTradeModal}
        defaultAction={defaultAction}
      />
    </div>
  )
}
