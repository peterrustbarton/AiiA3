
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  Search,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { EnhancedMarketMoversCard } from './enhanced-market-movers-card'
import { WatchlistCard } from './watchlist-card'
import { PortfolioSummaryCard } from './portfolio-summary-card'
import { QuickSearchCard } from './quick-search-card'
import { AutomationStatusCard } from './automation-status-card'

export function Dashboard() {
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Trader'}
        </h1>
        <p className="text-muted-foreground">
          Your AI-powered investment dashboard
        </p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Link href="/analyze">
          <Card className="hover:shadow-lg transition-all cursor-pointer border-muted bg-card/50 backdrop-blur">
            <CardContent className="p-4 text-center">
              <Search className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">Analyze</p>
              <p className="text-xs text-muted-foreground">Search & AI insights</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/market-movers">
          <Card className="hover:shadow-lg transition-all cursor-pointer border-muted bg-card/50 backdrop-blur">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="font-medium">Market</p>
              <p className="text-xs text-muted-foreground">Top movers</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portfolio">
          <Card className="hover:shadow-lg transition-all cursor-pointer border-muted bg-card/50 backdrop-blur">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="font-medium">Portfolio</p>
              <p className="text-xs text-muted-foreground">Your positions</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/alerts">
          <Card className="hover:shadow-lg transition-all cursor-pointer border-muted bg-card/50 backdrop-blur">
            <CardContent className="p-4 text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="font-medium">Alerts</p>
              <p className="text-xs text-muted-foreground">Price notifications</p>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Portfolio Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PortfolioSummaryCard />
          </motion.div>

          {/* Market Movers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <EnhancedMarketMoversCard />
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Search */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <QuickSearchCard />
          </motion.div>

          {/* Automation Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <AutomationStatusCard />
          </motion.div>

          {/* Watchlist */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <WatchlistCard />
          </motion.div>

          {/* Market Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-muted bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-green-500" />
                  Market Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">US Markets</span>
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    Open
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Crypto Markets</span>
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    24/7
                  </Badge>
                </div>
                <div className="pt-2 text-xs text-muted-foreground">
                  Next close: 4:00 PM EST
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
