
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
  Clock
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import { AssetChart } from './asset-chart'
import { AIAnalysisCard } from './ai-analysis-card'
import { TradeButtons } from '@/components/trading/trade-buttons'
import { TradeModal } from '@/components/trading/trade-modal'
import { formatCurrency, formatNumber, formatVolume, formatMarketCap } from '@/lib/utils/number-formatting'

interface AssetData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume?: number
  marketCap?: number
  type: string
  exchange?: string
}

interface SearchResult {
  symbol: string
  name: string
  price: number
  changePercent: number
  type: string
}

export function AnalyzePage() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedAsset, setSelectedAsset] = useState<AssetData | null>(null)
  const [priceHistory, setPriceHistory] = useState<Array<{ timestamp: Date; price: number }>>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [tradeModalOpen, setTradeModalOpen] = useState(false)
  const [selectedTradeAsset, setSelectedTradeAsset] = useState<AssetData | null>(null)
  const [defaultAction, setDefaultAction] = useState<'BUY' | 'SELL'>('BUY')
  
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
    console.log(`AnalyzePage: Searching for "${searchQuery}"`)
    
    try {
      const response = await fetch(`/api/assets/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        const searchResults = data.results || []
        
        console.log(`AnalyzePage: Found ${searchResults.length} results for "${searchQuery}"`)
        setSearchResults(searchResults)
        setShowResults(true)
      } else {
        console.error(`AnalyzePage: Search API returned ${response.status} for "${searchQuery}"`)
        setSearchResults([])
        setShowResults(true) // Still show "no results" message
      }
    } catch (error) {
      console.error(`AnalyzePage: Search failed for "${searchQuery}":`, error)
      // Clear results but still show search state
      setSearchResults([])
      setShowResults(true)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (value: string) => {
    setQuery(value)
    if (value.length >= 2) {
      handleSearch(value)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }

  const handleAssetSelect = async (symbol: string) => {
    setLoading(true)
    setShowResults(false)
    
    try {
      const response = await fetch(`/api/assets/${symbol}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedAsset(data.asset)
        setPriceHistory(data.priceHistory?.map((p: any) => ({
          timestamp: new Date(p.timestamp),
          price: p.price
        })) || [])
        setQuery(symbol)
        
        // Update URL
        router.push(`/analyze?symbol=${symbol}`, { scroll: false })
      }
    } catch (error) {
      console.error('Failed to fetch asset details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTrade = (type: 'buy' | 'sell', symbol: string) => {
    if (selectedAsset && selectedAsset.symbol === symbol) {
      setSelectedTradeAsset(selectedAsset)
      setDefaultAction(type === 'buy' ? 'BUY' : 'SELL')
      setTradeModalOpen(true)
    }
  }

  const closeTradeModal = () => {
    setTradeModalOpen(false)
    setSelectedTradeAsset(null)
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold flex items-center">
          <Search className="h-8 w-8 mr-3 text-primary" />
          Asset Analysis
        </h1>
        <p className="text-muted-foreground">
          Search for stocks and cryptocurrencies to get AI-powered insights
        </p>
      </motion.div>

      {/* Search Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-muted bg-card/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for stocks, ETFs, crypto (e.g., AAPL, BTC, GOOGL)..."
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>

            {/* Search Results */}
            <AnimatePresence>
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-2 max-h-60 overflow-y-auto border-t pt-4"
                >
                  {loading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center justify-between p-3 rounded-lg border">
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-muted rounded w-1/4"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                          <div className="h-4 bg-muted rounded w-20"></div>
                        </div>
                      ))}
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((result, index) => (
                      <motion.div
                        key={result.symbol}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleAssetSelect(result.symbol)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">{result.symbol}</span>
                            <Badge variant="outline">
                              {result.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {result.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(result.price)}
                          </div>
                          <div className={`text-sm ${result.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {result.changePercent >= 0 ? '+' : ''}{formatNumber(result.changePercent)}%
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No results found for "{query}"
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Asset Details */}
      {selectedAsset && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Asset Header */}
          <Card className="border-muted bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-2xl font-bold">{selectedAsset.symbol}</h2>
                    <Badge variant="outline" className="text-sm">
                      {selectedAsset.type}
                    </Badge>
                    {selectedAsset.exchange && (
                      <Badge variant="secondary">
                        {selectedAsset.exchange}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{selectedAsset.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    {formatCurrency(selectedAsset.price)}
                  </div>
                  <div className={`flex items-center justify-end space-x-1 ${selectedAsset.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {selectedAsset.changePercent >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="font-medium">
                      {selectedAsset.changePercent >= 0 ? '+' : ''}{formatCurrency(selectedAsset.change)} ({formatNumber(selectedAsset.changePercent)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Asset Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {selectedAsset.volume && (
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                    <div className="flex items-center space-x-2">
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Volume</span>
                    </div>
                    <div className="font-semibold">
                      {formatVolume(selectedAsset.volume)}
                    </div>
                  </div>
                )}
                {selectedAsset.marketCap && (
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Market Cap</span>
                    </div>
                    <div className="font-semibold">
                      {formatMarketCap(selectedAsset.marketCap)}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Trade Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-md mx-auto"
          >
            <TradeButtons 
              symbol={selectedAsset.symbol}
              price={selectedAsset.price}
              handleTrade={handleTrade}
            />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Chart */}
            <div className="lg:col-span-2 space-y-6">
              <AssetChart 
                symbol={selectedAsset.symbol}
                priceHistory={priceHistory}
                currentPrice={selectedAsset.price}
              />
            </div>

            {/* Right Column - AI Analysis */}
            <div className="space-y-6">
              <AIAnalysisCard symbol={selectedAsset.symbol} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!selectedAsset && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center py-12"
        >
          <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Ready for AI Analysis</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Search for any stock or cryptocurrency to get detailed AI-powered insights, 
            technical analysis, and trading recommendations.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['AAPL', 'GOOGL', 'TSLA', 'BTC', 'ETH', 'NVDA'].map((symbol) => (
              <Button
                key={symbol}
                variant="outline"
                size="sm"
                onClick={() => handleAssetSelect(symbol)}
              >
                {symbol}
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Trade Modal */}
      <TradeModal
        asset={selectedTradeAsset}
        isOpen={tradeModalOpen}
        onClose={closeTradeModal}
        defaultAction={defaultAction}
      />
    </div>
  )
}
