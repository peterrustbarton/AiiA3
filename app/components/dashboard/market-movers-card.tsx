
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
  ShoppingCart
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { TradeModal } from '@/components/trading/trade-modal'
import { formatCurrency, formatNumber } from '@/lib/utils/number-formatting'

interface AssetData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  type: string
}

interface MarketMoversData {
  gainers: AssetData[]
  losers: AssetData[]
}

export function MarketMoversCard() {
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

  const fetchMarketMovers = async () => {
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

  const AssetRow = ({ asset, index }: { asset: AssetData; index: number }) => {
    const isPositive = asset.changePercent > 0
    const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight
    const hasPosition = userPositions[asset.symbol] > 0
    
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
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
              {formatCurrency(asset.price)}
            </div>
            <div className={`flex items-center text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              <ChangeIcon className="h-3 w-3 mr-1" />
              {isPositive ? '+' : ''}{formatNumber(asset.changePercent)}%
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

  return (
    <Card className="border-muted bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-primary" />
          Market Movers
        </CardTitle>
        <Link href="/market-movers">
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
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
        ) : marketData ? (
          <Tabs defaultValue="gainers" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="gainers" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>Gainers</span>
              </TabsTrigger>
              <TabsTrigger value="losers" className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span>Losers</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gainers" className="space-y-1">
              {marketData.gainers.slice(0, 4).map((asset, index) => (
                <AssetRow key={asset.symbol} asset={asset} index={index} />
              ))}
            </TabsContent>

            <TabsContent value="losers" className="space-y-1">
              {marketData.losers.slice(0, 4).map((asset, index) => (
                <AssetRow key={asset.symbol} asset={asset} index={index} />
              ))}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Unable to load market data</p>
          </div>
        )}
      </CardContent>

      <TradeModal
        asset={selectedAsset}
        isOpen={tradeModalOpen}
        onClose={closeTradeModal}
        defaultAction={defaultAction}
      />
    </Card>
  )
}
