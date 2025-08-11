
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  TrendingDown, 
  Star,
  AlertCircle,
  DollarSign,
  Calculator
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

interface AssetData {
  symbol?: string
  name?: string
  price?: number
  type?: string
}

interface TradingActionsProps {
  asset?: AssetData | null
}

export function TradingActions({ asset }: TradingActionsProps) {
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(false)
  const [inWatchlist, setInWatchlist] = useState(false)
  const { toast } = useToast()

  // Defensive guard: Check if asset exists and has required properties
  if (!asset) {
    console.error('TradingActions: asset prop is null or undefined')
    return (
      <Card className="border-muted bg-card/50 backdrop-blur">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Asset Data Unavailable</h3>
          <p className="text-muted-foreground">
            Unable to load asset information. Please try refreshing the page or selecting a different asset.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Additional guards for asset properties with fallbacks
  const assetPrice = asset.price ?? 0
  const assetSymbol = asset.symbol ?? 'N/A'
  const assetName = asset.name ?? 'Unknown Asset'
  const assetType = asset.type ?? 'Unknown'

  // Log warning if essential data is missing
  if (assetPrice === 0) {
    console.warn(`TradingActions: Missing price data for asset ${assetSymbol}`)
  }

  const totalValue = parseFloat(quantity) * assetPrice || 0

  const handleTrade = async (type: 'BUY' | 'SELL') => {
    if (!quantity || parseFloat(quantity) <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity to trade.",
        variant: "destructive"
      })
      return
    }

    if (assetPrice === 0) {
      toast({
        title: "Invalid Price",
        description: "Cannot execute trade: asset price data is unavailable.",
        variant: "destructive"
      })
      return
    }

    if (assetSymbol === 'N/A') {
      toast({
        title: "Invalid Asset",
        description: "Cannot execute trade: asset symbol is invalid.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Get user's default portfolio first
      const portfolioResponse = await fetch('/api/portfolio')
      if (!portfolioResponse.ok) throw new Error('Failed to fetch portfolio')
      
      const portfolioData = await portfolioResponse.json()
      if (!portfolioData.portfolios?.length) throw new Error('No portfolio found')

      const portfolioId = portfolioData.portfolios[0].id

      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: assetSymbol,
          type,
          quantity: parseFloat(quantity),
          portfolioId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Trade failed')
      }

      toast({
        title: `${type} Order Executed`,
        description: `Successfully ${type === 'BUY' ? 'bought' : 'sold'} ${quantity} shares of ${assetSymbol} at $${assetPrice.toFixed(2)}`,
      })

      setQuantity('')
    } catch (error) {
      toast({
        title: "Trade Failed",
        description: error instanceof Error ? error.message : 'An error occurred during the trade.',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddToWatchlist = async () => {
    if (assetSymbol === 'N/A') {
      toast({
        title: "Invalid Asset",
        description: "Cannot add to watchlist: asset symbol is invalid.",
        variant: "destructive"
      })
      return
    }

    try {
      // Get user's default watchlist first
      const watchlistResponse = await fetch('/api/watchlist')
      if (!watchlistResponse.ok) throw new Error('Failed to fetch watchlist')
      
      const watchlistData = await watchlistResponse.json()
      if (!watchlistData.watchlists?.length) throw new Error('No watchlist found')

      const watchlistId = watchlistData.watchlists[0].id

      const response = await fetch(`/api/watchlist/${watchlistId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: assetSymbol })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add to watchlist')
      }

      setInWatchlist(true)
      toast({
        title: "Added to Watchlist",
        description: `${assetSymbol} has been added to your watchlist.`,
      })
    } catch (error) {
      toast({
        title: "Watchlist Error",
        description: error instanceof Error ? error.message : 'Failed to add to watchlist.',
        variant: "destructive"
      })
    }
  }

  return (
    <Card className="border-muted bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          <ShoppingCart className="h-5 w-5 mr-2 text-primary" />
          Trading Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Price */}
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <div className="text-sm text-muted-foreground mb-1">Current Price</div>
          <div className="text-2xl font-bold">
            ${assetPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <Badge variant="outline" className="mt-2">
            {assetType}
          </Badge>
          {assetPrice === 0 && (
            <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              ⚠️ Price data unavailable
            </div>
          )}
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <div className="relative">
            <Calculator className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="quantity"
              type="number"
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="pl-10"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Total Value */}
        {totalValue > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary/10 rounded-lg p-3 text-center"
          >
            <div className="flex items-center justify-center space-x-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total Value</span>
            </div>
            <div className="text-lg font-semibold text-primary">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </motion.div>
        )}

        {/* Trading Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => handleTrade('BUY')}
            disabled={loading || !quantity || assetPrice === 0 || assetSymbol === 'N/A'}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Buy
          </Button>
          <Button
            onClick={() => handleTrade('SELL')}
            disabled={loading || !quantity || assetPrice === 0 || assetSymbol === 'N/A'}
            variant="destructive"
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Sell
          </Button>
        </div>

        {/* Add to Watchlist */}
        <Button
          onClick={handleAddToWatchlist}
          disabled={inWatchlist || assetSymbol === 'N/A'}
          variant="outline"
          className="w-full"
        >
          <Star className={`h-4 w-4 mr-2 ${inWatchlist ? 'fill-current text-yellow-500' : ''}`} />
          {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
        </Button>

        {/* Disclaimer */}
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-orange-700 dark:text-orange-300">
              <p className="font-medium mb-1">Simulated Trading</p>
              <p>This is a paper trading environment for educational purposes. No real money is involved.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
