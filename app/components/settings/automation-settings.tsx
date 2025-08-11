

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, Bot, TrendingUp, TrendingDown, Shield, Settings2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'

interface AutomationSettings {
  buyConfidenceThreshold: number
  sellConfidenceThreshold: number
  maxTradeAmountAuto: number
  maxTradesPerDay: number
  stopLossPercent: number
  takeProfitPercent: number
  requireManualConfirm: boolean
}

export function AutomationSettings() {
  const [settings, setSettings] = useState<AutomationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/automation')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to fetch automation settings:', error)
      toast.error('Failed to load automation settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const response = await fetch('/api/settings/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast.success('Automation settings updated successfully')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update settings')
      }
    } catch (error) {
      toast.error('Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!settings) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p>Failed to load automation settings</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="w-full"
    >
      <Card className="border-muted bg-card/50 backdrop-blur">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3">
            <Bot className="h-5 w-5 text-primary" />
            <span>Automation Settings</span>
          </CardTitle>
          <CardDescription>
            Configure AI-powered trading automation parameters and risk controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Manual Confirmation Toggle */}
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="space-y-1">
              <Label htmlFor="manual-confirm" className="text-base font-medium">
                Manual Confirmation Required
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, all automated trades require your approval before execution
              </p>
            </div>
            <Switch
              id="manual-confirm"
              checked={settings.requireManualConfirm}
              onCheckedChange={(checked) => 
                setSettings({...settings, requireManualConfirm: checked})
              }
            />
          </div>

          {/* Confidence Thresholds */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <h3 className="text-lg font-medium">AI Confidence Thresholds</h3>
            </div>
            
            {/* Buy Confidence */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="buy-confidence" className="font-medium">
                  Buy Signal Confidence
                </Label>
                <Badge variant="outline" className="font-mono">
                  {settings.buyConfidenceThreshold}%
                </Badge>
              </div>
              <Slider
                id="buy-confidence"
                value={[settings.buyConfidenceThreshold]}
                onValueChange={(value) => 
                  setSettings({...settings, buyConfidenceThreshold: value[0]})
                }
                max={100}
                min={50}
                step={5}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Minimum AI confidence required to trigger automated buy orders
              </p>
            </div>

            {/* Sell Confidence */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="sell-confidence" className="font-medium">
                  Sell Signal Confidence
                </Label>
                <Badge variant="outline" className="font-mono">
                  {settings.sellConfidenceThreshold}%
                </Badge>
              </div>
              <Slider
                id="sell-confidence"
                value={[settings.sellConfidenceThreshold]}
                onValueChange={(value) => 
                  setSettings({...settings, sellConfidenceThreshold: value[0]})
                }
                max={100}
                min={50}
                step={5}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Minimum AI confidence required to trigger automated sell orders
              </p>
            </div>
          </div>

          <Separator />

          {/* Trade Limits */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <h3 className="text-lg font-medium">Trade Limits & Controls</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Max Trade Amount */}
              <div className="space-y-3">
                <Label htmlFor="max-trade-amount" className="font-medium">
                  Max Trade Amount (Per Trade)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="max-trade-amount"
                    type="number"
                    value={settings.maxTradeAmountAuto}
                    onChange={(e) => setSettings({
                      ...settings, 
                      maxTradeAmountAuto: parseFloat(e.target.value) || 0
                    })}
                    className="pl-8"
                    placeholder="500"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Maximum dollar amount for each automated trade
                </p>
              </div>

              {/* Max Trades Per Day */}
              <div className="space-y-3">
                <Label htmlFor="max-trades-day" className="font-medium">
                  Max Trades Per Day
                </Label>
                <Input
                  id="max-trades-day"
                  type="number"
                  value={settings.maxTradesPerDay}
                  onChange={(e) => setSettings({
                    ...settings, 
                    maxTradesPerDay: parseInt(e.target.value) || 0
                  })}
                  placeholder="5"
                  max="100"
                  min="0"
                />
                <p className="text-sm text-muted-foreground">
                  Daily limit for automated trades (0 = unlimited)
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Risk Management */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <h3 className="text-lg font-medium">Risk Management</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stop Loss */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="stop-loss" className="font-medium">
                    Stop Loss Percentage
                  </Label>
                  <Badge variant="outline" className="font-mono text-red-600">
                    -{settings.stopLossPercent}%
                  </Badge>
                </div>
                <Slider
                  id="stop-loss"
                  value={[settings.stopLossPercent]}
                  onValueChange={(value) => 
                    setSettings({...settings, stopLossPercent: value[0]})
                  }
                  max={25}
                  min={1}
                  step={0.5}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Automatic sell trigger when position loses this percentage
                </p>
              </div>

              {/* Take Profit */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="take-profit" className="font-medium">
                    Take Profit Percentage
                  </Label>
                  <Badge variant="outline" className="font-mono text-green-600">
                    +{settings.takeProfitPercent}%
                  </Badge>
                </div>
                <Slider
                  id="take-profit"
                  value={[settings.takeProfitPercent]}
                  onValueChange={(value) => 
                    setSettings({...settings, takeProfitPercent: value[0]})
                  }
                  max={50}
                  min={5}
                  step={1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Automatic sell trigger when position gains this percentage
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={saveSettings} 
              disabled={saving}
              className="min-w-[120px]"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>

          {/* Current Configuration Summary */}
          <div className="p-4 bg-muted/50 rounded-lg border">
            <h4 className="font-medium mb-3 flex items-center">
              <Bot className="h-4 w-4 mr-2" />
              Current Automation Profile
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Manual Confirm:</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={settings.requireManualConfirm ? 'default' : 'secondary'}>
                    {settings.requireManualConfirm ? 'Required' : 'Disabled'}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Buy Threshold:</span>
                <p className="mt-1 font-medium">{settings.buyConfidenceThreshold}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Sell Threshold:</span>
                <p className="mt-1 font-medium">{settings.sellConfidenceThreshold}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Max Per Trade:</span>
                <p className="mt-1 font-medium">${settings.maxTradeAmountAuto}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Daily Limit:</span>
                <p className="mt-1 font-medium">{settings.maxTradesPerDay || 'Unlimited'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Risk Control:</span>
                <p className="mt-1 font-medium text-xs">
                  -{settings.stopLossPercent}% / +{settings.takeProfitPercent}%
                </p>
              </div>
            </div>
          </div>

          {/* Warning Notice */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="font-medium text-amber-700 dark:text-amber-300">
                  Automation Safety Notice
                </h4>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Automated trading involves risk. Always monitor your positions and ensure your 
                  risk management settings align with your investment strategy. Consider starting 
                  with manual confirmation enabled until you're comfortable with the automation behavior.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
