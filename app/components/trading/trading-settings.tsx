
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Settings } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface TradingSettings {
  tradingMode: 'PAPER' | 'LIVE'
  riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH'
  maxPositionSize: number
  alpacaConfigured: boolean
}

export function TradingSettings() {
  const [settings, setSettings] = useState<TradingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/trading')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to fetch trading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const response = await fetch('/api/settings/trading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast.success('Trading settings updated successfully')
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
    return <div className="animate-pulse p-6">Loading trading settings...</div>
  }

  if (!settings) {
    return <div className="p-6 text-center">Failed to load trading settings</div>
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Trading Settings
        </CardTitle>
        <CardDescription>
          Configure your trading preferences and risk management settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trading Mode */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Trading Mode</Label>
          <div className="flex gap-4">
            <div 
              className={`flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                settings.tradingMode === 'PAPER' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-primary/50'
              }`}
              onClick={() => setSettings({...settings, tradingMode: 'PAPER'})}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Paper Trading</h3>
                <Badge variant="secondary">Recommended</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Practice with virtual money. Perfect for learning and testing strategies.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Risk-free environment</span>
              </div>
            </div>

            <div 
              className={`flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                settings.tradingMode === 'LIVE' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-primary/50'
              } ${!settings.alpacaConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (settings.alpacaConfigured) {
                  setSettings({...settings, tradingMode: 'LIVE'})
                }
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Live Trading</h3>
                {!settings.alpacaConfigured && (
                  <Badge variant="destructive">Not Available</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Trade with real money. Requires proper setup and careful consideration.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm">Real money at risk</span>
              </div>
            </div>
          </div>
          
          {!settings.alpacaConfigured && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Live trading requires Alpaca API configuration
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Risk Tolerance */}
        <div className="space-y-3">
          <Label htmlFor="risk-tolerance" className="text-base font-medium">
            Risk Tolerance
          </Label>
          <Select 
            value={settings.riskTolerance} 
            onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH') => 
              setSettings({...settings, riskTolerance: value})
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">
                <div className="flex flex-col">
                  <span>Low Risk</span>
                  <span className="text-xs text-muted-foreground">Conservative approach</span>
                </div>
              </SelectItem>
              <SelectItem value="MEDIUM">
                <div className="flex flex-col">
                  <span>Medium Risk</span>
                  <span className="text-xs text-muted-foreground">Balanced approach</span>
                </div>
              </SelectItem>
              <SelectItem value="HIGH">
                <div className="flex flex-col">
                  <span>High Risk</span>
                  <span className="text-xs text-muted-foreground">Aggressive approach</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Max Position Size */}
        <div className="space-y-3">
          <Label htmlFor="max-position" className="text-base font-medium">
            Maximum Position Size
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              id="max-position"
              type="number"
              value={settings.maxPositionSize}
              onChange={(e) => setSettings({
                ...settings, 
                maxPositionSize: parseFloat(e.target.value) || 0
              })}
              className="pl-8"
              placeholder="1000"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Maximum amount to invest in a single position
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={saveSettings} 
            disabled={saving}
            className="min-w-[120px]"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        {/* Current Status */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Current Configuration</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Mode:</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={settings.tradingMode === 'PAPER' ? 'secondary' : 'default'}>
                  {settings.tradingMode}
                </Badge>
                {settings.tradingMode === 'PAPER' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Risk Level:</span>
              <p className="mt-1 font-medium">{settings.riskTolerance}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
