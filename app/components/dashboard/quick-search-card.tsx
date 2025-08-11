
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, TrendingUp, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatNumber } from '@/lib/utils/number-formatting'

interface SearchResult {
  symbol: string
  name: string
  price: number
  changePercent: number
  type: string
}

export function QuickSearchCard() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const router = useRouter()

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    setLoading(true)
    console.log(`QuickSearch: Searching for "${searchQuery}"`)
    
    try {
      const response = await fetch(`/api/assets/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        const searchResults = data.results || []
        
        console.log(`QuickSearch: Found ${searchResults.length} results for "${searchQuery}"`)
        setResults(searchResults)
        setShowResults(true)
      } else {
        console.error(`QuickSearch: Search API returned ${response.status} for "${searchQuery}"`)
        setResults([])
        setShowResults(true) // Still show "no results" message
      }
    } catch (error) {
      console.error(`QuickSearch: Search failed for "${searchQuery}":`, error)
      // Clear results but still show search state
      setResults([])
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
      setResults([])
      setShowResults(false)
    }
  }

  const handleResultClick = (symbol: string) => {
    router.push(`/analyze?symbol=${symbol}`)
  }

  const popularSymbols = ['AAPL', 'GOOGL', 'TSLA', 'BTC', 'ETH', 'NVDA']

  return (
    <Card className="border-muted bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          <Search className="h-5 w-5 mr-2 text-primary" />
          Quick Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stocks, crypto..."
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Search Results */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 max-h-48 overflow-y-auto"
            >
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between p-2 rounded">
                      <div className="space-y-1 flex-1">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                      <div className="h-4 bg-muted rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : results.length > 0 ? (
                results.slice(0, 5).map((result, index) => (
                  <motion.div
                    key={result.symbol}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleResultClick(result.symbol)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{result.symbol}</span>
                        <Badge variant="outline" className="text-xs">
                          {result.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {result.name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatCurrency(result.price)}
                        </div>
                        <div className={`text-xs ${result.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {result.changePercent >= 0 ? '+' : ''}{formatNumber(result.changePercent)}%
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No results found for "{query}"
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Popular Symbols */}
        {!showResults && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Popular</h4>
            <div className="grid grid-cols-3 gap-2">
              {popularSymbols.map((symbol) => (
                <Button
                  key={symbol}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => handleResultClick(symbol)}
                >
                  {symbol}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Action */}
        <Button 
          className="w-full" 
          onClick={() => router.push('/analyze')}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Advanced Analysis
        </Button>
      </CardContent>
    </Card>
  )
}
