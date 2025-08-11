

'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ShoppingCart, 
  TrendingDown, 
  AlertCircle,
  DollarSign,
  Calculator,
  Brain,
  Info
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

interface AssetData {
  symbol: string
  name: string
  price: number
  type?: string
  changePercent?: number
}

interface Position {
  quantity: number
  avgPrice: number
}

interface TradeModalProps {
  asset: AssetData | null
  isOpen: boolean
  onClose: () => void
  defaultAction?: 'BUY' | 'SELL'
}

export function TradeModal({ asset, isOpen, onClose, defaultAction = 'BUY' }: TradeModalProps) {
  const [action, setAction] = useState<'BUY' | 'SELL'>(defaultAction)
  const [quantity, setQuantity] = useState('')
  const [orderType, setOrderType] = useState('MARKET')
  const [timeInForce, setTimeInForce] = useState('DAY')
  const [limitPrice, setLimitPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState<Position | null>(null)
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && asset) {
      fetchPosition()
      fetchAIRecommendation()
    }
  }, [isOpen, asset])

  useEffect(() => {
    setAction(defaultAction)
  }, [defaultAction])

  const fetchPosition = async () => {
    if (!asset) return
    
    try {
      const response = await fetch('/api/portfolio')
      if (response.ok) {
        const data = await response.json()
        const portfolio = data.portfolios?.[0]
        if (portfolio) {
          const positionItem = portfolio.items.find((item: any) => 
            item.asset.symbol === asset.symbol
          )
          if (positionItem) {
            setPosition({
              quantity: positionItem.quantity,
              avgPrice: positionItem.avgPrice
            })
          } else {
            setPosition(null)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch position:', error)
    }
  }

  const fetchAIRecommendation = async () => {
    if (!asset) return
    
    try {
      const response = await fetch(`/api/analysis/${asset.symbol}`)
      if (response.ok) {
        const data = await response.json()
        if (data.recommendation) {
          setAiRecommendation(data.recommendation)
        }
      }
    } catch (error) {
      console.error('Failed to fetch AI recommendation:', error)
    }
  }

  if (!asset) return null

  const totalValue = parseFloat(quantity) * asset.price || 0
  const canSell = position && position.quantity > 0
  const recommendedQuantity = position ? Math.min(100, Math.floor(position.quantity / 2)) : 10

  const handleTrade = async () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity to trade.",
        variant: "destructive"
      })
      return
    }

    if (action === 'SELL' && (!position || parseFloat(quantity) > position.quantity)) {
      toast({
        title: "Insufficient Shares",
        description: `You only have ${position?.quantity || 0} shares available to sell.`,
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
          symbol: asset.symbol,
          type: action,
          quantity: parseFloat(quantity),
          portfolioId,
          orderType,
          timeInForce,
          limitPrice: orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Trade failed')
      }

      toast({
        title: `${action} Order Submitted`,
        description: `${orderType} order for ${quantity} shares of ${asset.symbol} has been submitted.`,
      })

      onClose()
      setQuantity('')
      setLimitPrice('')
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

  const fillRecommendedQuantity = () => {
    setQuantity(recommendedQuantity.toString())
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2 text-primary" />
            Trade {asset.symbol}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Asset Info */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-semibold">{asset.name}</div>
                <div className="text-sm text-muted-foreground">{asset.symbol}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">${asset.price.toFixed(2)}</div>
                {asset.changePercent !== undefined && (
                  <div className={`text-sm ${asset.changePercent > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {asset.changePercent > 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                  </div>
                )}
              </div>
            </div>
            
            {/* Position Info */}
            {position && (
              <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                Current Position: {position.quantity} shares @ ${position.avgPrice.toFixed(2)}
              </div>
            )}
          </div>

          {/* AI Recommendation */}
          {aiRecommendation && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Brain className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    AI Recommendation
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {aiRecommendation}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={action === 'BUY' ? 'default' : 'outline'}
              onClick={() => setAction('BUY')}
              className="flex items-center"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Buy
            </Button>
            <Button
              variant={action === 'SELL' ? 'destructive' : 'outline'}
              onClick={() => setAction('SELL')}
              disabled={!canSell}
              className="flex items-center"
            >
              <TrendingDown className="h-4 w-4 mr-2" />
              Sell
            </Button>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="quantity">Quantity</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fillRecommendedQuantity}
                className="text-xs h-6 px-2"
              >
                Use {recommendedQuantity}
              </Button>
            </div>
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
                step="1"
              />
            </div>
          </div>

          {/* Order Type */}
          <div className="space-y-2">
            <Label>Order Type</Label>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger>
                <SelectValue placeholder="Select order type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MARKET">Market</SelectItem>
                <SelectItem value="LIMIT">Limit</SelectItem>
                <SelectItem value="STOP">Stop</SelectItem>
                <SelectItem value="STOP_LIMIT">Stop Limit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Limit Price (if applicable) */}
          {(orderType === 'LIMIT' || orderType === 'STOP_LIMIT') && (
            <div className="space-y-2">
              <Label htmlFor="limitPrice">Limit Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="limitPrice"
                  type="number"
                  placeholder="Enter limit price"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="pl-10"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          )}

          {/* Time in Force */}
          <div className="space-y-2">
            <Label>Time in Force</Label>
            <Select value={timeInForce} onValueChange={setTimeInForce}>
              <SelectTrigger>
                <SelectValue placeholder="Select time in force" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAY">Day</SelectItem>
                <SelectItem value="GTC">Good Till Canceled</SelectItem>
                <SelectItem value="IOC">Immediate or Cancel</SelectItem>
                <SelectItem value="FOK">Fill or Kill</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Order Summary */}
          {totalValue > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-primary/10 rounded-lg p-3"
            >
              <div className="text-sm font-medium mb-2">Order Summary</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Shares:</span>
                  <span>{quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span>${orderType === 'LIMIT' ? limitPrice || asset.price.toFixed(2) : asset.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Total:</span>
                  <span>${totalValue.toFixed(2)}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Risk Warning */}
          {action === 'SELL' && !canSell && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-red-700 dark:text-red-300">
                  You don't own any shares of {asset.symbol} to sell.
                </div>
              </div>
            </div>
          )}

          {/* Trading Disclaimer */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-orange-700 dark:text-orange-300">
                <p className="font-medium mb-1">Paper Trading Environment</p>
                <p>This is a simulated trading environment for educational purposes. No real money is involved.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleTrade}
              disabled={loading || !quantity || (action === 'SELL' && !canSell)}
              className={`flex-1 ${action === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {loading ? 'Processing...' : `${action} ${asset.symbol}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
