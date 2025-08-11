
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Bot, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Zap,
  Settings,
  RefreshCw,
  Clock,
  Target
} from 'lucide-react'
import { motion } from 'framer-motion'
import { safeFormatTime } from '@/lib/utils'

interface AutomationStatus {
  settings?: {
    buyConfidenceThreshold: number
    sellConfidenceThreshold: number
    maxTradeAmountAuto: number
    maxTradesPerDay: number
    requireManualConfirm: boolean
    tradingMode: string
    riskTolerance: string
  } | null
  statistics?: {
    todayTrades: number
    todayAnalyses: number
    activeAlerts: number
    tradesRemaining: number
  } | null
  automationHealth?: {
    score: number
    status: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'ERROR'
    factors: string[]
  } | null
  recentActivities?: Array<{
    id: string
    type: string
    description: string
    timestamp: string
    metadata: any
  }> | null
}

export function AutomationStatusCard() {
  const [status, setStatus] = useState<AutomationStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAutomationStatus()
    // Refresh every 30 seconds
    const interval = setInterval(fetchAutomationStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAutomationStatus = async () => {
    try {
      const response = await fetch('/api/automation/status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch automation status:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'EXCELLENT': return 'text-green-500'
      case 'GOOD': return 'text-blue-500'
      case 'WARNING': return 'text-yellow-500'
      case 'ERROR': return 'text-red-500'
      default: return 'text-muted-foreground'
    }
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'EXCELLENT': return <CheckCircle className="h-4 w-4" />
      case 'GOOD': return <TrendingUp className="h-4 w-4" />
      case 'WARNING': return <AlertTriangle className="h-4 w-4" />
      case 'ERROR': return <AlertTriangle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <Card className="border-muted bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="h-5 w-5 mr-2 text-primary animate-pulse" />
            Automation Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status) {
    return (
      <Card className="border-muted bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="h-5 w-5 mr-2 text-primary" />
            Automation Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Failed to load automation status</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Defensive guards for nested objects with fallbacks
  const settings = status.settings || {
    buyConfidenceThreshold: 0,
    sellConfidenceThreshold: 0,
    maxTradeAmountAuto: 0,
    maxTradesPerDay: 0,
    requireManualConfirm: true,
    tradingMode: 'PAPER',
    riskTolerance: 'MEDIUM'
  }

  const statistics = status.statistics || {
    todayTrades: 0,
    todayAnalyses: 0,
    activeAlerts: 0,
    tradesRemaining: 0
  }

  const automationHealth = status.automationHealth || {
    score: 0,
    status: 'ERROR' as const,
    factors: ['Data unavailable']
  }

  const recentActivities = status.recentActivities || []

  // Log warnings for missing data
  if (!status.settings) {
    console.warn('AutomationStatusCard: Missing settings data')
  }
  if (!status.statistics) {
    console.warn('AutomationStatusCard: Missing statistics data')
  }
  if (!status.automationHealth) {
    console.warn('AutomationStatusCard: Missing automationHealth data')
  }

  return (
    <Card className="border-muted bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center">
          <Bot className="h-5 w-5 mr-2 text-primary" />
          Automation Engine
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Badge 
            variant="outline" 
            className={`${getHealthColor(automationHealth.status)} border-current`}
          >
            {getHealthIcon(automationHealth.status)}
            <span className="ml-1 text-xs">{automationHealth.status}</span>
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAutomationStatus}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Health Score */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Health Score</span>
            <span className={`text-sm font-semibold ${getHealthColor(automationHealth.status)}`}>
              {automationHealth.score}%
            </span>
          </div>
          <Progress value={automationHealth.score} className="h-2" />
          {automationHealth.factors.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {automationHealth.factors.join(', ')}
            </div>
          )}
        </div>

        {/* Daily Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-lg p-3 space-y-1">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Trades Today</span>
            </div>
            <div className="font-semibold">
              {statistics.todayTrades}/{settings.maxTradesPerDay}
            </div>
            <div className="text-xs text-muted-foreground">
              {statistics.tradesRemaining} remaining
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 space-y-1">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Analyses</span>
            </div>
            <div className="font-semibold">
              {statistics.todayAnalyses}
            </div>
            <div className="text-xs text-muted-foreground">
              AI recommendations
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 space-y-1">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Active Alerts</span>
            </div>
            <div className="font-semibold">
              {statistics.activeAlerts}
            </div>
            <div className="text-xs text-muted-foreground">
              Monitoring triggers
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 space-y-1">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Confidence</span>
            </div>
            <div className="font-semibold">
              {settings.buyConfidenceThreshold}%+
            </div>
            <div className="text-xs text-muted-foreground">
              Buy threshold
            </div>
          </div>
        </div>

        {/* Quick Settings */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Quick Settings</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Trading Mode</span>
              <Badge variant="outline" className="text-xs">
                {settings.tradingMode}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Risk Tolerance</span>
              <Badge variant="outline" className="text-xs">
                {settings.riskTolerance}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Manual Confirm</span>
              <Badge variant="outline" className="text-xs">
                {settings.requireManualConfirm ? 'ON' : 'OFF'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        {recentActivities.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Recent Activity</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {recentActivities.slice(0, 3).map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-2 text-xs"
                >
                  <Clock className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-muted-foreground">{activity.description}</div>
                    <div className="text-xs text-muted-foreground/60">
                      {safeFormatTime(activity.timestamp)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button variant="outline" className="w-full" onClick={() => window.location.href = '/settings'}>
          <Settings className="h-4 w-4 mr-2" />
          Configure automation
        </Button>
      </CardContent>
    </Card>
  )
}
