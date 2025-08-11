
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Bell, 
  Plus,
  TrendingUp,
  TrendingDown,
  Trash2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ShoppingCart
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { TradeModal } from '@/components/trading/trade-modal'

interface Alert {
  id: string
  type: string
  condition: any
  message?: string
  isActive: boolean
  isTriggered: boolean
  triggeredAt?: string
  createdAt: string
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

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [tradeModalOpen, setTradeModalOpen] = useState(false)
  const [defaultAction, setDefaultAction] = useState<'BUY' | 'SELL'>('BUY')
  const { toast } = useToast()

  // Form state
  const [symbol, setSymbol] = useState('')
  const [alertType, setAlertType] = useState('PRICE_ABOVE')
  const [targetPrice, setTargetPrice] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/alerts')
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAlert = async () => {
    if (!symbol || !targetPrice) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    setCreateLoading(true)
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          type: alertType,
          condition: { targetPrice: parseFloat(targetPrice) },
          message: message || `Alert when ${symbol.toUpperCase()} ${alertType === 'PRICE_ABOVE' ? 'reaches' : 'drops to'} $${targetPrice}`
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create alert')
      }

      toast({
        title: "Alert Created",
        description: "Your price alert has been set successfully.",
      })

      // Reset form
      setSymbol('')
      setTargetPrice('')
      setMessage('')
      setShowCreateDialog(false)
      
      // Refresh alerts
      fetchAlerts()
    } catch (error) {
      toast({
        title: "Failed to Create Alert",
        description: error instanceof Error ? error.message : 'An error occurred.',
        variant: "destructive"
      })
    } finally {
      setCreateLoading(false)
    }
  }

  const handleTrade = (alert: Alert, action: 'BUY' | 'SELL') => {
    const currentPrice = alert.asset.prices?.[0]?.price || 0
    setSelectedAsset({
      symbol: alert.asset.symbol,
      name: alert.asset.name,
      price: currentPrice,
      changePercent: alert.asset.prices?.[0]?.changePercent || 0,
      type: alert.asset.type
    })
    setDefaultAction(action)
    setTradeModalOpen(true)
  }

  const closeTradeModal = () => {
    setTradeModalOpen(false)
    setSelectedAsset(null)
  }

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts?id=${alertId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete alert')
      }

      toast({
        title: "Alert Deleted",
        description: "The alert has been removed.",
      })

      fetchAlerts()
    } catch (error) {
      toast({
        title: "Failed to Delete Alert",
        description: "An error occurred while deleting the alert.",
        variant: "destructive"
      })
    }
  }

  const AlertCard = ({ alert, index }: { alert: Alert; index: number }) => {
    const currentPrice = alert.asset.prices?.[0]?.price || 0
    const targetPrice = alert.condition?.targetPrice || 0
    const isPriceAbove = alert.type === 'PRICE_ABOVE'
    const isTriggered = alert.isTriggered
    const isActive = alert.isActive && !isTriggered

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Card className="border-muted bg-card/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${isTriggered ? 'bg-green-500/20' : isActive ? 'bg-blue-500/20' : 'bg-gray-500/20'}`}>
                  {isTriggered ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : isActive ? (
                    <Bell className="h-5 w-5 text-blue-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{alert.asset.symbol}</span>
                    <Badge variant="outline" className="text-xs">
                      {alert.asset.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {alert.asset.name}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteAlert(alert.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Alert Type:</span>
                <div className="flex items-center space-x-1">
                  {isPriceAbove ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                  <span className="font-medium">
                    Price {isPriceAbove ? 'Above' : 'Below'} ${targetPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current Price:</span>
                <span className="font-medium">${currentPrice.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge 
                  variant={isTriggered ? 'default' : isActive ? 'secondary' : 'outline'}
                  className={
                    isTriggered ? 'bg-green-500 text-white' :
                    isActive ? 'bg-blue-500 text-white' : 
                    'text-gray-500'
                  }
                >
                  {isTriggered ? 'Triggered' : isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {alert.message && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    {alert.message}
                  </p>
                </div>
              )}

              {isTriggered && alert.triggeredAt && (
                <div className="text-xs text-muted-foreground">
                  Triggered: {new Date(alert.triggeredAt).toLocaleString()}
                </div>
              )}
              
              {/* Quick Trade Buttons for Triggered Alerts */}
              {isTriggered && (
                <div className="flex space-x-2 pt-3 border-t">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTrade(alert, 'BUY')
                    }}
                    className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Quick Buy
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTrade(alert, 'SELL')
                    }}
                    variant="destructive"
                    className="flex-1 h-8 text-xs"
                  >
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Quick Sell
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center">
            <Bell className="h-8 w-8 mr-3 text-primary" />
            Price Alerts
          </h1>
          <p className="text-muted-foreground">
            Get notified when your assets reach target prices
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={fetchAlerts} 
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Price Alert</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Asset Symbol</Label>
                  <Input
                    id="symbol"
                    placeholder="e.g., AAPL, BTC"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alertType">Alert Type</Label>
                  <Select value={alertType} onValueChange={setAlertType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRICE_ABOVE">Price Above Target</SelectItem>
                      <SelectItem value="PRICE_BELOW">Price Below Target</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetPrice">Target Price ($)</Label>
                  <Input
                    id="targetPrice"
                    type="number"
                    placeholder="0.00"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Custom Message (Optional)</Label>
                  <Input
                    id="message"
                    placeholder="Custom alert message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={handleCreateAlert}
                    disabled={createLoading}
                    className="flex-1"
                  >
                    {createLoading ? 'Creating...' : 'Create Alert'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Alerts Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-muted bg-card/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-muted rounded-lg"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : alerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {alerts.map((alert, index) => (
                <AlertCard key={alert.id} alert={alert} index={index} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Alerts Set</h3>
            <p className="text-muted-foreground mb-6">
              Create your first price alert to get notified when assets reach your target prices.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Alert
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
