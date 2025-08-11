
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { formatCurrency, formatNumber } from '@/lib/utils/number-formatting'

interface PortfolioData {
  totalValue: number
  totalReturn: number
  totalReturnPercent: number
  balance: number
  positions: number
}

export function PortfolioSummaryCard() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPortfolioData()
  }, [])

  const fetchPortfolioData = async () => {
    try {
      const response = await fetch('/api/portfolio')
      if (response.ok) {
        const data = await response.json()
        if (data.portfolios?.length > 0) {
          const portfolio = data.portfolios[0] // Main portfolio
          setPortfolioData({
            totalValue: portfolio.totalValue || 100000,
            totalReturn: portfolio.totalReturn || 0,
            totalReturnPercent: portfolio.totalReturnPercent || 0,
            balance: portfolio.balance || 100000,
            positions: portfolio.items?.length || 0
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error)
      // Set default values
      setPortfolioData({
        totalValue: 100000,
        totalReturn: 0,
        totalReturnPercent: 0,
        balance: 100000,
        positions: 0
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading || !portfolioData) {
    return (
      <Card className="border-muted bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-primary" />
            Portfolio Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-16 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isPositive = portfolioData.totalReturn >= 0
  const returnColor = isPositive ? 'text-green-500' : 'text-red-500'
  const ReturnIcon = isPositive ? ArrowUpRight : ArrowDownRight

  return (
    <Card className="border-muted bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-primary" />
          Portfolio Summary
        </CardTitle>
        <Link href="/portfolio">
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Value */}
        <div className="space-y-2">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold">
              {formatCurrency(portfolioData.totalValue)}
            </span>
            <Badge variant={isPositive ? 'default' : 'destructive'} className="flex items-center space-x-1">
              <ReturnIcon className="h-3 w-3" />
              <span>{isPositive ? '+' : ''}{formatCurrency(Math.abs(portfolioData.totalReturn))}</span>
            </Badge>
          </div>
          <div className={`flex items-center space-x-1 ${returnColor}`}>
            <span className="text-sm font-medium">
              {isPositive ? '+' : ''}{formatNumber(portfolioData.totalReturnPercent)}%
            </span>
            <span className="text-xs text-muted-foreground">total return</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-muted/30 rounded-lg p-4 space-y-2"
          >
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Available Cash</span>
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(portfolioData.balance)}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-muted/30 rounded-lg p-4 space-y-2"
          >
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Positions</span>
            </div>
            <div className="text-lg font-semibold">
              {portfolioData.positions}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2">
          <Link href="/analyze" className="flex-1">
            <Button variant="outline" className="w-full">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analyze Assets
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
