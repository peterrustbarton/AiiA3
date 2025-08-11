
// Enhanced Analyze Page v2.0.0
// Tasks: E-026 (Expanded Data), E-019 (Chart Intervals), E-016 (Loading), E-029 (Watchlist), E-030 (Refresh), E-031 (Timestamps)

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Brain,
  DollarSign,
  Volume2,
  AlertTriangle,
  Target,
  Clock,
  ExternalLink,
  Building2,
  Calendar,
  Percent,
  TrendingUpDown
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import { AssetChart } from './asset-chart'
import { AIAnalysisCard } from './ai-analysis-card'
import { TradeButtons } from '@/components/trading/trade-buttons'
import { TradeModal } from '@/components/trading/trade-modal'
import { WatchlistToggle } from '@/components/ui/watchlist-toggle'
import { RefreshButton } from '@/components/ui/refresh-button'
import { LastUpdated } from '@/components/ui/last-updated'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ChartIntervalSelector, ChartInterval } from '@/components/ui/chart-interval-selector'
import { formatCurrency, formatNumber, formatVolume, formatMarketCap } from '@/lib/utils/number-formatting'

interface ExtendedAssetData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume?: number
  marketCap?: number
  type: string
  exchange?: string
  sector?: string
  industry?: string
  // Extended fields - Task E-026
  previousClose?: number
  open?: number
  bid?: number
  ask?: number
  dayRange?: string
  week52Range?: string
  avgVolume?: number
  marketCapIntraday?: number
  beta?: number
  pe?: number
  eps?: number
  earningsDate?: string
  forwardDividend?: number
  forwardYield?: number
  exDividendDate?: string
  targetPrice?: number
  lastUpdated?: Date
}

interface SearchResult {
  symbol: string
  name: string
  price: number
  changePercent: number
  type: string
}

export function EnhancedAnalyzePage() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedAsset, setSelectedAsset] = useState<ExtendedAssetData | null>(null)
  const [priceHistory, setPriceHistory] = useState<Array<{ timestamp: Date; price: number }>>([])
  const [loading, setLoading] = useState(false)
  const [assetLoading, setAssetLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [tradeModalOpen, setTradeModalOpen] = useState(false)
  const [selectedTradeAsset, setSelectedTradeAsset] = useState<ExtendedAssetData | null>(null)
  const [defaultAction, setDefaultAction] = useState<'BUY' | 'SELL'>('BUY')
  const [chartInterval, setChartInterval] = useState<ChartInterval>('1D')
  const [progress, setProgress] = useState(0)
  
  const searchParams = useSearchParams()
  const router = useRouter()

  // Handle initial symbol from URL params
  useEffect(() => {
    const symbol = searchParams?.get('symbol')
    if (symbol) {
      setQuery(symbol)
      handleAssetSelect(symbol)
    }
  }, [searchParams])

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setLoading(true)
    setProgress(0)
    
    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 85))
      }, 200)

      const response = await fetch(`/api/assets/search?q=${encodeURIComponent(searchQuery)}`)
      
      if (response.ok) {
        const data = await response.json()
        const searchResults = data.results || []
        
        setSearchResults(searchResults)
        setShowResults(true)
        setProgress(100)
      } else {
        setSearchResults([])
        setShowResults(true)
      }
      
      clearInterval(progressInterval)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
      setShowResults(true)
    } finally {
      setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 500)
    }
  }

  const handleAssetSelect = async (symbol: string) => {
    setAssetLoading(true)
    setProgress(0)
    setShowResults(false)
    
    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 300)

      const response = await fetch(`/api/assets/${encodeURIComponent(symbol)}`)
      
      if (response.ok) {
        const data = await response.json()
        setSelectedAsset({
          ...data.asset,
          lastUpdated: new Date()
        })
        setPriceHistory(data.priceHistory || [])
        setProgress(100)
        
        // Update URL without triggering navigation
        const url = new URL(window.location.href)
        url.searchParams.set('symbol', symbol)
        window.history.replaceState({}, '', url.toString())
      }
      
      clearInterval(progressInterval)
    } catch (error) {
      console.error('Asset selection failed:', error)
    } finally {
      setTimeout(() => {
        setAssetLoading(false)
        setProgress(0)
      }, 500)
    }
  }

  const handleRefreshAsset = async () => {
    if (selectedAsset) {
      await handleAssetSelect(selectedAsset.symbol)
    }
  }

  const handleChartIntervalChange = async (interval: ChartInterval) => {
    setChartInterval(interval)
    
    if (selectedAsset) {
      try {
        const response = await fetch(`/api/assets/${selectedAsset.symbol}/history?interval=${interval}`)
        if (response.ok) {
          const data = await response.json()
          setPriceHistory(data.priceHistory || [])
        }
      } catch (error) {
        console.error('Failed to fetch price history:', error)
      }
    }
  }

  const renderExtendedDataField = (label: string, value: any, icon?: React.ReactNode, format?: 'currency' | 'number' | 'percent' | 'date') => {
    if (value === undefined || value === null) return null

    let formattedValue = value
    if (format === 'currency') {
      formattedValue = formatCurrency(value)
    } else if (format === 'number') {
      formattedValue = formatNumber(value)
    } else if (format === 'percent') {
      formattedValue = `${value.toFixed(2)}%`
    } else if (format === 'date') {
      formattedValue = new Date(value).toLocaleDateString()
    }

    return (
      <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          {icon && icon}
          <span>{label}</span>
        </div>
        <span className="text-sm font-medium">{formattedValue}</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Asset Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search stocks, ETFs, crypto... (e.g., AAPL, BTC, IBM)"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  handleSearch(e.target.value)
                }}
                className="pl-10"
              />
            </div>
            {selectedAsset && (
              <RefreshButton
                onRefresh={handleRefreshAsset}
                size="md"
                showText={true}
              />
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="mt-4">
              <LoadingSpinner
                variant="dots"
                text="Searching assets..."
                progress={progress}
                estimatedTime={2}
              />
            </div>
          )}

          {/* Search Results */}
          <AnimatePresence>
            {showResults && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 border rounded-lg"
              >
                {searchResults.slice(0, 6).map((result, index) => (
                  <motion.div
                    key={result.symbol}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 transition-all duration-200"
                    onClick={() => handleAssetSelect(result.symbol)}
                  >
                    <div className="flex items-center space-x-3">
                      <WatchlistToggle symbol={result.symbol} size="sm" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{result.symbol}</span>
                          <Badge variant="secondary" className="text-xs">
                            {result.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate max-w-64">
                          {result.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(result.price)}</p>
                      <p className={`text-sm ${result.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {result.changePercent.toFixed(2)}%
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Asset Details */}
      {assetLoading && (
        <Card>
          <CardContent className="py-12">
            <LoadingSpinner
              variant="pulse"
              text="Loading asset details..."
              progress={progress}
              estimatedTime={4}
              size="lg"
            />
          </CardContent>
        </Card>
      )}

      {selectedAsset && !assetLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chart and Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Asset Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <WatchlistToggle symbol={selectedAsset.symbol} size="lg" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h1 className="text-2xl font-bold">{selectedAsset.symbol}</h1>
                        {selectedAsset.exchange && (
                          <Badge variant="outline">{selectedAsset.exchange}</Badge>
                        )}
                      </div>
                      <p className="text-lg text-muted-foreground">{selectedAsset.name}</p>
                      {selectedAsset.sector && (
                        <div className="flex items-center space-x-2 mt-1">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {selectedAsset.sector}
                            {selectedAsset.industry && ` • ${selectedAsset.industry}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-3xl font-bold">{formatCurrency(selectedAsset.price)}</p>
                    <div className={`flex items-center justify-end space-x-1 text-lg ${
                      selectedAsset.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedAsset.changePercent >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span>
                        {formatCurrency(Math.abs(selectedAsset.change))} 
                        ({selectedAsset.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
                
                {selectedAsset.lastUpdated && (
                  <LastUpdated
                    timestamp={selectedAsset.lastUpdated}
                    className="mt-3"
                  />
                )}
              </CardHeader>
            </Card>

            {/* Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Price Chart</span>
                  </CardTitle>
                  
                  <ChartIntervalSelector
                    selectedInterval={chartInterval}
                    onIntervalChange={handleChartIntervalChange}
                    variant="buttons"
                    size="sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <AssetChart
                  priceHistory={priceHistory}
                  symbol={selectedAsset.symbol}
                  currentPrice={selectedAsset.price}
                />
              </CardContent>
            </Card>

            {/* AI Analysis */}
            <AIAnalysisCard symbol={selectedAsset.symbol} />
          </div>

          {/* Right Column - Extended Data and Trading */}
          <div className="space-y-6">
            {/* Trading Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Quick Trade</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TradeButtons
                  symbol={selectedAsset.symbol}
                  price={selectedAsset.price}
                  handleTrade={(type: 'buy' | 'sell', symbol: string) => {
                    setSelectedTradeAsset(selectedAsset)
                    setDefaultAction(type.toUpperCase() as 'BUY' | 'SELL')
                    setTradeModalOpen(true)
                  }}
                />
              </CardContent>
            </Card>

            {/* Extended Asset Data - Task E-026 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Key Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {renderExtendedDataField('Previous Close', selectedAsset.previousClose, <Clock className="w-4 h-4" />, 'currency')}
                {renderExtendedDataField('Open', selectedAsset.open, <TrendingUpDown className="w-4 h-4" />, 'currency')}
                {renderExtendedDataField('Bid', selectedAsset.bid, undefined, 'currency')}
                {renderExtendedDataField('Ask', selectedAsset.ask, undefined, 'currency')}
                {renderExtendedDataField("Day's Range", selectedAsset.dayRange)}
                {renderExtendedDataField('52 Week Range', selectedAsset.week52Range)}
                {renderExtendedDataField('Volume', selectedAsset.volume, <Volume2 className="w-4 h-4" />, 'number')}
                {renderExtendedDataField('Avg. Volume', selectedAsset.avgVolume, undefined, 'number')}
                {renderExtendedDataField('Market Cap', selectedAsset.marketCap || selectedAsset.marketCapIntraday, <Building2 className="w-4 h-4" />, 'currency')}
                {renderExtendedDataField('Beta (5Y Monthly)', selectedAsset.beta, undefined, 'number')}
                {renderExtendedDataField('PE Ratio (TTM)', selectedAsset.pe, <Percent className="w-4 h-4" />, 'number')}
                {renderExtendedDataField('EPS (TTM)', selectedAsset.eps, undefined, 'currency')}
                {renderExtendedDataField('Earnings Date', selectedAsset.earningsDate, <Calendar className="w-4 h-4" />, 'date')}
                {renderExtendedDataField('Forward Dividend', selectedAsset.forwardDividend, undefined, 'currency')}
                {renderExtendedDataField('Forward Yield', selectedAsset.forwardYield, undefined, 'percent')}
                {renderExtendedDataField('Ex-Dividend Date', selectedAsset.exDividendDate, undefined, 'date')}
                {renderExtendedDataField('1y Target Est', selectedAsset.targetPrice, <Target className="w-4 h-4" />, 'currency')}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Trade Modal */}
      {selectedTradeAsset && (
        <TradeModal
          isOpen={tradeModalOpen}
          onClose={() => setTradeModalOpen(false)}
          asset={selectedTradeAsset}
          defaultAction={defaultAction}
        />
      )}
    </div>
  )
}
