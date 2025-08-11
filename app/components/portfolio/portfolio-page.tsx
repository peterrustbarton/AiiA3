
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Briefcase, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  RefreshCw,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { TradeModal } from '@/components/trading/trade-modal'
import { formatCurrency, formatNumber } from '@/lib/utils/number-formatting'

interface PortfolioItem {
  id: string
  quantity: number
  avgPrice: number
  totalCost: number
  currentValue?: number
  unrealizedPnL?: number
  asset: {
    symbol: string
    name: string
    type: string
    prices: Array<{
      price: number
      changePercent: number
    }>
  }
}

interface Trade {
  id: string
  type: string
  quantity: number
  price: number
  totalAmount: number
  executedAt: string
  asset: {
    symbol: string
    name: string
  }
}

interface Portfolio {
  id: string
  name: string
  balance: number
  totalValue: number
  totalReturn: number
  totalReturnPercent: number
  items: PortfolioItem[]
  trades: Trade[]
}

export function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [tradeModalOpen, setTradeModalOpen] = useState(false)
  const [defaultAction, setDefaultAction] = useState<'BUY' | 'SELL'>('BUY')

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const handleTrade = (item: PortfolioItem, action: 'BUY' | 'SELL') => {
    const currentPrice = item.asset.prices?.[0]?.price || 0
    setSelectedAsset({
      symbol: item.asset.symbol,
      name: item.asset.name,
      price: currentPrice,
      changePercent: item.asset.prices?.[0]?.changePercent || 0,
      type: item.asset.type
    })
    setDefaultAction(action)
    setTradeModalOpen(true)
  }

  const closeTradeModal = () => {
    setTradeModalOpen(false)
    setSelectedAsset(null)
    // Refresh portfolio after trade
    fetchPortfolio()
  }

  const fetchPortfolio = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/portfolio')
      if (response.ok) {
        const data = await response.json()
        setPortfolios(data.portfolios || [])
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  const portfolio = portfolios[0] // Main portfolio
  const isPositiveReturn = portfolio?.totalReturn ? portfolio.totalReturn >= 0 : true

  const PositionCard = ({ item, index }: { item: PortfolioItem; index: number }) => {
    const currentPrice = item.asset.prices?.[0]?.price || 0
    const currentValue = item.quantity * currentPrice
    const unrealizedPnL = currentValue - item.totalCost
    const unrealizedPnLPercent = (unrealizedPnL / item.totalCost) * 100
    const isPositive = unrealizedPnL >= 0

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Card className="border-muted bg-card/50 backdrop-blur hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Link href={`/analyze?symbol=${item.asset.symbol}`} className="hover:underline">
                    <span className="font-bold text-lg cursor-pointer">{item.asset.symbol}</span>
                  </Link>
                  <Badge variant="outline" className="text-xs">
                    {item.asset.type}
                  </Badge>
                </div>
                <Link href={`/analyze?symbol=${item.asset.symbol}`}>
                  <p className="text-sm text-muted-foreground truncate hover:underline cursor-pointer">
                    {item.asset.name}
                  </p>
                </Link>
              </div>
              <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                <span className="text-sm font-medium">
                  {isPositive ? '+' : ''}{formatNumber(unrealizedPnLPercent)}%
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Quantity</p>
                  <p className="font-semibold">{item.quantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg. Price</p>
                  <p className="font-semibold">{formatCurrency(item.avgPrice)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Current Price</p>
                  <p className="font-semibold">{formatCurrency(currentPrice)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Market Value</p>
                  <p className="font-semibold">{formatCurrency(currentValue)}</p>
                </div>
              </div>

              <div className="pt-2 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">P&L</span>
                  <span className={`font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{formatCurrency(unrealizedPnL)}
                  </span>
                </div>
                
                {/* Trade Buttons */}
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleTrade(item, 'BUY')
                    }}
                    className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Buy More
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleTrade(item, 'SELL')
                    }}
                    variant="destructive"
                    className="flex-1 h-8 text-xs"
                  >
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Sell
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const TradeRow = ({ trade, index }: { trade: Trade; index: number }) => {
    const isPositive = trade.type === 'BUY'
    const Icon = isPositive ? TrendingUp : TrendingDown

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Icon className={`h-4 w-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{trade.asset.symbol}</span>
              <Badge variant={isPositive ? 'default' : 'destructive'} className="text-xs">
                {trade.type}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(trade.executedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">
            {trade.quantity} @ {formatCurrency(trade.price)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(trade.totalAmount)}
          </p>
        </div>
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
            <Briefcase className="h-8 w-8 mr-3 text-primary" />
            Portfolio
          </h1>
          <p className="text-muted-foreground">
            Track your investments and performance
          </p>
        </div>
        <Button 
          onClick={fetchPortfolio} 
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {loading ? (
        <div className="space-y-6">
          <Card className="border-muted bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded w-1/3"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-16 bg-muted rounded"></div>
                  <div className="h-16 bg-muted rounded"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : portfolio ? (
        <div className="space-y-6">
          {/* Portfolio Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-muted bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{portfolio.name}</span>
                  <Badge variant="outline">Simulated</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold">
                    {formatCurrency(portfolio.totalValue)}
                  </div>
                  <div className={`flex items-center justify-center space-x-2 ${isPositiveReturn ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositiveReturn ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                    <span className="text-lg font-medium">
                      {isPositiveReturn ? '+' : ''}{formatCurrency(portfolio.totalReturn)} ({formatNumber(portfolio.totalReturnPercent)}%)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <DollarSign className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Available Cash</p>
                    <p className="text-xl font-semibold">
                      {formatCurrency(portfolio.balance)}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <Activity className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Positions</p>
                    <p className="text-xl font-semibold">{portfolio.items.length}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <TrendingUp className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Total Trades</p>
                    <p className="text-xl font-semibold">{portfolio.trades.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Positions and Trades */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs defaultValue="positions" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="positions">Positions</TabsTrigger>
                <TabsTrigger value="trades">Trade History</TabsTrigger>
              </TabsList>

              <TabsContent value="positions" className="mt-6">
                {portfolio.items.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {portfolio.items.map((item, index) => (
                      <PositionCard key={item.id} item={item} index={index} />
                    ))}
                  </div>
                ) : (
                  <Card className="border-muted bg-card/50 backdrop-blur">
                    <CardContent className="p-8 text-center">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground mb-4">No positions yet</p>
                      <Link href="/analyze">
                        <Button>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Start Trading
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="trades" className="mt-6">
                <Card className="border-muted bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle>Recent Trades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {portfolio.trades.length > 0 ? (
                      <div className="space-y-1">
                        {portfolio.trades.map((trade, index) => (
                          <TradeRow key={trade.id} trade={trade} index={index} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">No trades yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Portfolio Found</h3>
          <p className="text-muted-foreground">Unable to load your portfolio data.</p>
        </div>
      )}

      <TradeModal
        asset={selectedAsset}
        isOpen={tradeModalOpen}
        onClose={closeTradeModal}
        defaultAction={defaultAction}
      />
    </div>
  )
}
