
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AIAnalysisData {
  recommendation: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  priceTarget?: number
  timeHorizon?: string
  analysis: string
  keyPoints: string[]
  risks: string[]
  opportunities: string[]
  marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  automationSignal?: {
    action: 'BUY' | 'SELL'
    confidence: number
  }
  automationRecommendation?: {
    positionSize: string
    urgency: 'LOW' | 'MEDIUM' | 'HIGH'
  }
}

interface AIAnalysisCardProps {
  symbol: string
}

export function AIAnalysisCard({ symbol }: AIAnalysisCardProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisData | null>(null)
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    if (symbol) {
      generateAnalysis()
    }
  }, [symbol])

  const generateAnalysis = async () => {
    setLoading(true)
    setIsStreaming(true)
    setStreamingText('')
    setAnalysis(null)

    try {
      // First try to get cached analysis
      const cachedResponse = await fetch(`/api/analysis/${symbol}`)
      if (cachedResponse.ok) {
        const cachedData = await cachedResponse.json()
        if (cachedData.analysis) {
          setAnalysis(cachedData.analysis)
          setLoading(false)
          setIsStreaming(false)
          return
        }
      }

      // Generate enhanced automated analysis
      const automatedResponse = await fetch(`/api/analysis/automated/${symbol}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'MANUAL' })
      })

      if (automatedResponse.ok) {
        const automatedData = await automatedResponse.json()
        if (automatedData.analysis) {
          setAnalysis({
            ...automatedData.analysis,
            automationSignal: automatedData.automationSignal
          })
          setLoading(false)
          setIsStreaming(false)
          return
        }
      }

      // Fallback to stream new analysis
      const response = await fetch(`/api/analysis/stream/${symbol}`)
      if (!response.ok) throw new Error('Analysis failed')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader?.read() || { done: true, value: undefined }
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        // Parse SSE chunks
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              setIsStreaming(false)
              // Generate structured analysis from streaming text
              await generateStructuredAnalysis()
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ''
              if (content) {
                setStreamingText(prev => prev + content)
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Analysis generation failed:', error)
      setIsStreaming(false)
    } finally {
      setLoading(false)
    }
  }

  const generateStructuredAnalysis = async () => {
    try {
      const response = await fetch(`/api/analysis/${symbol}`)
      if (response.ok) {
        const data = await response.json()
        if (data.analysis) {
          setAnalysis(data.analysis)
        }
      }
    } catch (error) {
      console.error('Failed to fetch structured analysis:', error)
    }
  }

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY': return <TrendingUp className="h-4 w-4" />
      case 'SELL': return <TrendingDown className="h-4 w-4" />
      case 'HOLD': return <Minus className="h-4 w-4" />
      default: return <Minus className="h-4 w-4" />
    }
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY': return 'text-green-500 border-green-500'
      case 'SELL': return 'text-red-500 border-red-500'
      case 'HOLD': return 'text-yellow-500 border-yellow-500'
      default: return 'text-muted-foreground border-muted'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-500'
    if (confidence >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <Card className="border-muted bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center">
          <Brain className="h-5 w-5 mr-2 text-primary" />
          AI Analysis
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={generateAnalysis}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating AI analysis...</span>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 min-h-32 max-h-48 overflow-y-auto">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {streamingText}
                <span className="animate-pulse">|</span>
              </div>
            </div>
          </motion.div>
        )}

        {analysis && !isStreaming && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Recommendation */}
              <div className="flex items-center justify-between">
                <Badge 
                  variant="outline" 
                  className={`px-3 py-1 flex items-center space-x-2 ${getRecommendationColor(analysis.recommendation)}`}
                >
                  {getRecommendationIcon(analysis.recommendation)}
                  <span className="font-semibold">{analysis.recommendation}</span>
                </Badge>
                <div className="text-right">
                  <div className={`text-sm font-medium ${getConfidenceColor(analysis.confidence)}`}>
                    {analysis.confidence}% Confidence
                  </div>
                </div>
              </div>

              {/* Price Target & Timeframe */}
              {(analysis.priceTarget || analysis.timeHorizon) && (
                <div className="grid grid-cols-2 gap-4">
                  {analysis.priceTarget && (
                    <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Price Target</span>
                      </div>
                      <div className="font-semibold">
                        ${analysis.priceTarget.toFixed(2)}
                      </div>
                    </div>
                  )}
                  {analysis.timeHorizon && (
                    <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Timeframe</span>
                      </div>
                      <div className="font-semibold">
                        {analysis.timeHorizon}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Key Points */}
              {analysis.keyPoints?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Key Insights
                  </h4>
                  <ul className="space-y-1">
                    {analysis.keyPoints.slice(0, 3).map((point, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start">
                        <span className="text-primary mr-2">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risks */}
              {analysis.risks?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                    Key Risks
                  </h4>
                  <ul className="space-y-1">
                    {analysis.risks.slice(0, 2).map((risk, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Market Sentiment */}
              {analysis.marketSentiment && (
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Market Sentiment</span>
                  <Badge 
                    variant="outline"
                    className={
                      analysis.marketSentiment === 'BULLISH' ? 'text-green-500 border-green-500' :
                      analysis.marketSentiment === 'BEARISH' ? 'text-red-500 border-red-500' :
                      'text-yellow-500 border-yellow-500'
                    }
                  >
                    {analysis.marketSentiment}
                  </Badge>
                </div>
              )}

              {/* Automation Signal */}
              {analysis.automationSignal && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border border-primary/20 bg-primary/5 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-primary">Automation Signal</span>
                    </div>
                    <Badge 
                      variant="outline"
                      className={`${getRecommendationColor(analysis.automationSignal.action)} text-xs`}
                    >
                      AUTO {analysis.automationSignal.action}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {analysis.automationSignal.confidence}% confidence meets your automation threshold
                  </div>
                  {analysis.automationRecommendation && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Position:</span>
                        <span className="ml-1 font-medium">{analysis.automationRecommendation.positionSize}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Urgency:</span>
                        <span className="ml-1 font-medium">{analysis.automationRecommendation.urgency}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {!analysis && !loading && !isStreaming && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Click refresh to generate AI analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
